import Waste from "../model/wastecollection.js";
import User from "../model/user.js";
import { sendEmail } from "./email.services.js";
import Reward from "../model/rewards.js";
import CollectorAssay from "../model/collectorAssay.js";
import mongoose from "mongoose";

 const genTitle = (gender) => gender === "Male" ? "Mr" : gender === "Female" ? "Mrs/Miss" : 'Mx'
 
export const createWasteRequest = async (wasteData) => {
  const user = await User.findById(wasteData.userId).select(
    "name email phoneNumber gender"
  );

  if (!user) {
    throw new Error("User not found");
  }

  if (!wasteData.materials?.length) {
    throw new Error("At least one waste material is required");
  }

  const normalizedLocation = wasteData.location?.trim().toLowerCase();

  if (!normalizedLocation) {
    throw new Error("Location is required");
  }

  const materials = wasteData.materials.map((material) => ({
    wasteType: material.wasteType,
    quantity: material.quantity,
    unit: material.unit || "kg",
    collectedQuantity: null,
  }));

  const assignedCollector = await CollectorAssay.findOne({
    serviceArea: normalizedLocation,
  }).select("_id collector serviceArea");

  const wasteRequest = new Waste({
    user: user._id,
    materials,
    location: normalizedLocation,
    requestDate: new Date(),
    collectionDate: null,
    address:wasteData.address,
    images: wasteData.images || null,
    status: "Pending",
    rejectionReason: null,
    collectionNote: wasteData.collectionNote,
    collector: assignedCollector?._id || null,
  });

  await wasteRequest.save();

  return wasteRequest;
};

export const getAllWasteEntries = async () => {
  const wasteEntries = await Waste.find().populate('user', 'name email phoneNumber');
  return wasteEntries;
}


export const getWasteStatusV2 = async (userId) => {
  const wasteEntries = await Waste.find({ user: userId })
    .populate("user", "name email phoneNumber")
    .populate({
      path: "collector",
      select: "collector serviceArea",
      populate: {
        path: "collector",
        select: "name email phoneNumber",
      },
    });

  if (!wasteEntries || wasteEntries.length === 0) {
    return [];
  }

  return wasteEntries.map((entry) => {
    if (!entry.user) {
      return {
        id: entry._id,
        name: "Unknown User",
        email: "N/A",
        phoneNumber: "N/A",
        collectorId: entry.collector?._id || null,
        collectorName: "N/A",
        materials: entry.materials,
        location: entry.location,
        status: entry.status,
        rejectionReason: entry.rejectionReason,
        collectionNote: entry.collectionNote,
        collectionDate: entry.collectionDate,
        requestDate: entry.requestDate,
        error: "Associated user not found",
      };
    }

    const collectorUser = entry.collector?.collector || null;

    return {
      id: entry._id,

      name: entry.user.name,
      email: entry.user.email,
      phoneNumber: entry.user.phoneNumber,

      collectorId: entry.collector?._id || null,
      collectorName: collectorUser?.name || "N/A",
      collectorEmail: collectorUser?.email || "N/A",
      collectorPhoneNumber: collectorUser?.phoneNumber || "N/A",

      serviceArea: entry.collector?.serviceArea || null,

      materials: entry.materials,
      location: entry.location,

      status: entry.status,
      rejectionReason: entry.rejectionReason,
      collectionNote: entry.collectionNote,

      requestDate: entry.requestDate,
      collectionDate: entry.collectionDate,
    };
  });
};


export const deleteWasteEntry = async (id) => {
  const wasteEntry = await Waste.findById(id);

  if (!wasteEntry) {
    return null;
  }

  if (!["Pending", "Rejected"].includes(wasteEntry.status)) {
    throw new Error(
      `Waste request cannot be deleted because its current status is ${wasteEntry.status}`
    );
  }

  await Waste.findByIdAndDelete(id);

  return wasteEntry;
};


export const updatewaste = async (id, updateData) => {
  const wasteEntry = await Waste.findById(id);

  if (!wasteEntry) {
    throw new Error("Waste request not found");
  }

  // Only rejected requests can be edited and resubmitted
  if (wasteEntry.status !== "Rejected") {
    throw new Error(
      `Waste request cannot be edited because its current status is ${wasteEntry.status}`
    );
  }

  const allowedUpdates = [
    "materials",
    "images",
    "location",
  ];

  const updates = {};

  for (const key of allowedUpdates) {
    if (updateData[key] !== undefined) {
      updates[key] = updateData[key];
    }
  }

  // Validate materials if they are being changed
  if (updates.materials !== undefined) {
    if (
      !Array.isArray(updates.materials) ||
      updates.materials.length === 0
    ) {
      throw new Error("At least one waste material is required");
    }

    updates.materials = updates.materials.map((material) => ({
      wasteType: material.wasteType,
      quantity: material.quantity,
      unit: material.unit || "kg",
      collectedQuantity: null,
    }));
  }

  // Normalize and validate location
  if (updates.location !== undefined) {
    const normalizedLocation = updates.location?.trim().toLowerCase();

    if (!normalizedLocation) {
      throw new Error("Location is required");
    }

    updates.location = normalizedLocation;
  }

  // Determine the location that should be used
  // for automatic collector assignment.
  const assignmentLocation =
    updates.location || wasteEntry.location;

  // Automatically assign a collector based on service area.
  const assignedCollector = await CollectorAssay.findOne({
    serviceArea: assignmentLocation,
  }).select("_id");

  updates.collector = assignedCollector?._id || null;

  // Reset rejected request for resubmission
  updates.status = "Pending";
  updates.rejectionReason = null;
  updates.collectionDate = null;
  updates.collectionNote = null;

  const updatedWaste = await Waste.findByIdAndUpdate(
    id,
    { $set: updates },
    {
      new: true,
      runValidators: true,
    }
  ).populate(
    "user",
    "name email phoneNumber gender"
  );

  if (!updatedWaste) {
    throw new Error("Waste request could not be updated");
  }

  // Email the user after successful resubmission
  const materialSummary = updatedWaste.materials
    .map(
      (item, index) =>
        `${index + 1}. ${item.quantity} ${
          item.unit || "units"
        } of ${item.wasteType}`
    )
    .join("<br>");

  const subject = "Waste Request Resubmitted ♻️";

  const html = `
    <h1>
      Hi ${
        updatedWaste.user.gender === "Male"
          ? "Mr"
          : updatedWaste.user.gender === "Female"
          ? "Mrs/Miss"
          : "Mx"
      } ${updatedWaste.user.name} 👋
    </h1>

    <p>
      Your previously rejected waste request has been
      successfully updated and resubmitted.
    </p>

    <p>
      <strong>Request details:</strong>
    </p>

    <p>
      ${materialSummary}
    </p>

    <p>
      <strong>Location:</strong> ${updatedWaste.location}
    </p>

    <p>
      <strong>Status:</strong> ${updatedWaste.status} ⏳
    </p>

    <p>
      Your request will now go through the collection process
      again.
    </p>

    <p>
      Thank you for helping us build a cleaner environment 🌍♻️.
    </p>
  `;

  try {
    await sendEmail(
      updatedWaste.user.email,
      subject,
      html
    );
  } catch (error) {
    console.error(
      "Waste request updated, but notification email failed:",
      error.message
    );
  }

  return updatedWaste;
};


// Collector Section
export const acceptWasteRequestService = async (
  wasteId,
  collectorAssayId
) => {
  const session = await mongoose.startSession();
  let committed = false;

  try {
    session.startTransaction();

    const waste = await Waste.findById(wasteId).session(session);

    if (!waste) {
      throw new Error("Waste request not found");
    }

    if (waste.status !== "Pending") {
      throw new Error(
        `Waste request cannot be accepted because its current status is ${waste.status}`
      );
    }

    const user = await User.findById(waste.user)
      .select("name email gender")
      .session(session);

    if (!user) {
      throw new Error("User not found");
    }

    const assay = await CollectorAssay.findById(collectorAssayId)
      .session(session);

    if (!assay) {
      throw new Error("Collector assay not found");
    }

    // Update waste request
    waste.status = "Accepted";
    waste.collector = assay._id;

    await waste.save({ session });

    // Update collector statistics
    assay.acceptedRequests += 1;

    await assay.save({ session });

    await session.commitTransaction();
    committed = true;

    // Send email only after successful transaction
    const subject = "Waste Request Accepted ✅";

    const html = `
      <h1>Hi ${genTitle(user.gender)} ${user.name},</h1>
      <p>Your waste request has been accepted!</p>
      <p>A collector will proceed with your waste collection.</p>
      <p>Thank you for contributing to a cleaner environment! 🌍♻️</p>
      <p>If you have any questions, feel free to reply to this email 📩.</p>
    `;

    try {
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error(
        "Waste accepted, but notification email failed:",
        emailError.message
      );
    }

    return waste;
  } catch (error) {
    if (!committed && session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Error accepting waste request:", error.message);

    throw new Error(error.message);
  } finally {
    await session.endSession();
  }
};


export const rejectWasteRequestService = async (
  wasteId,
  collectorAssayId,
  rejectionReason = ""
) => {
  const session = await mongoose.startSession();
  let committed = false;

  try {
    session.startTransaction();

    const waste = await Waste.findById(wasteId).session(session);

    if (!waste) {
      throw new Error("Waste request not found");
    }

    if (waste.status !== "Pending") {
      throw new Error(
        `Waste request cannot be rejected because its current status is ${waste.status}`
      );
    }

    if (!rejectionReason || rejectionReason.trim() === "") {
      throw new Error(
        "Rejection reason is required when rejecting a waste request"
      );
    }

    const assay = await CollectorAssay.findById(collectorAssayId)
      .session(session);

    if (!assay) {
      throw new Error("Collector assay not found");
    }

    // Make sure this collector is actually assigned to the request
    if (
      waste.collector &&
      waste.collector.toString() !== collectorAssayId.toString()
    ) {
      throw new Error(
        "This waste request is not assigned to this collector"
      );
    }

    const user = await User.findById(waste.user)
      .select("name email gender")
      .session(session);

    if (!user) {
      throw new Error("User not found");
    }

    const trimmedReason = rejectionReason.trim();

    // Update waste
    waste.status = "Rejected";
    waste.collector = assay._id;
    waste.rejectionReason = trimmedReason;

    await waste.save({ session });

    // Update collector statistics
    assay.rejectedRequests += 1;

    await assay.save({ session });

    await session.commitTransaction();
    committed = true;

    // Send notification after successful transaction
    const subject = "Waste Request Rejected ❌";

    const html = `
      <h1>Hi ${genTitle(user.gender)} ${user.name},</h1>

      <p>
        We're sorry to inform you that your recent waste request
        has been rejected.
      </p>

      <p>
        <strong>Reason:</strong> ${trimmedReason}
      </p>

      <p>
        You can review your request, make the necessary changes,
        and submit it again.
      </p>

      <p>
        Thank you for your continued efforts toward a cleaner
        environment 🌍.
      </p>
    `;

    try {
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error(
        "Waste rejected, but notification email failed:",
        emailError.message
      );
    }

    return waste;
  } catch (error) {
    if (!committed && session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(
      "Error rejecting waste request:",
      error.message
    );

    throw new Error(error.message);
  } finally {
    await session.endSession();
  }
};


export const getCollectorStat = async (collectorAssayId) => {
  const collector = await CollectorAssay.findById(collectorAssayId).select(
    "serviceArea totalQuantityCollected acceptedRequests rejectedRequests collectionStats"
  );

  if (!collector) {
    return null;
  }

  const {
    serviceArea,
    totalQuantityCollected,
    acceptedRequests,
    rejectedRequests,
    collectionStats,
  } = collector;

  return {
    serviceArea,
    totalQuantityCollected,
    acceptedRequests,
    rejectedRequests,
    collectionStats,
  };
};

export const routecollectorService = async (
  wasteId,
  collectorAssayId
) => {
  const session = await mongoose.startSession();
  let committed = false;

  try {
    session.startTransaction();

    const waste = await Waste.findById(wasteId).session(session);

    if (!waste) {
      throw new Error("Waste request not found");
    }

    if (waste.status !== "Accepted") {
      throw new Error(
        `Waste request cannot be routed because its current status is ${waste.status}`
      );
    }

    // Make sure this collector is the one assigned to the request
    if (
      !waste.collector ||
      waste.collector.toString() !== collectorAssayId.toString()
    ) {
      throw new Error("This waste request is not assigned to this collector");
    }

    const user = await User.findById(waste.user)
      .select("name email gender")
      .session(session);

    if (!user) {
      throw new Error("User not found");
    }

    const assay = await CollectorAssay.findById(collectorAssayId)
      .session(session);

    if (!assay) {
      throw new Error("Collector assay not found");
    }

    // Update the waste request
    waste.status = "En Route";

    await waste.save({ session });

    await session.commitTransaction();
    committed = true;

    // Send notification only after successful transaction
    const subject = "Waste Request En Route 🚚";

    const html = `
      <h1>Hi ${genTitle(user.gender)} ${user.name},</h1>
      <p>Good news! Your waste request is currently en route and will be handled shortly.</p>
      <p><strong>Status:</strong> ${waste.status}</p>
      <p>Please ensure the waste is accessible for collection at the specified location.</p>
      <p>Thank you for your commitment to a cleaner and healthier environment 🌍.</p>
    `;

    try {
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error(
        "Waste routed, but notification email failed:",
        emailError.message
      );
    }

    return waste;
  } catch (error) {
    if (!committed && session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Error routing waste request:", error.message);

    throw new Error(error.message);
  } finally {
    await session.endSession();
  }
};

export const collectWasteRequest = async (
  wasteId,
  collectorAssayId,
  collectedMaterials = null,
  collectionNote = null
) => {
  const session = await mongoose.startSession();
  let committed = false;

  try {
    session.startTransaction();

    const waste = await Waste.findById(wasteId).session(session);

    if (!waste) {
      throw new Error("Waste request not found");
    }

    if (waste.status !== "En Route") {
      throw new Error(
        `Waste request cannot be collected because its current status is ${waste.status}`
      );
    }

    // Make sure this collector is assigned to this request
    if (
      !waste.collector ||
      waste.collector.toString() !== collectorAssayId.toString()
    ) {
      throw new Error("This waste request is not assigned to this collector");
    }

    const user = await User.findById(waste.user)
      .session(session);

    if (!user) {
      throw new Error("User not found");
    }

    const assay = await CollectorAssay.findById(collectorAssayId)
      .session(session);

    if (!assay) {
      throw new Error("Collector assay not found");
    }

    /*
     * Determine the actual quantity collected.
     *
     * If the collector doesn't provide collectedMaterials,
     * we assume the full requested quantity was collected.
     */
    waste.materials.forEach((material) => {
      const submittedMaterial = collectedMaterials?.find(
        (item) => item.wasteType === material.wasteType
      );

      const actualQuantity =
        submittedMaterial?.collectedQuantity ?? material.quantity;

      if (actualQuantity < 0) {
        throw new Error(
          `Collected quantity for ${material.wasteType} cannot be negative`
        );
      }

      if (actualQuantity > material.quantity) {
        throw new Error(
          `Collected quantity for ${material.wasteType} cannot exceed requested quantity`
        );
      }

      material.collectedQuantity = actualQuantity;
    });

    /*
     * Update Waste
     */
    waste.status = "Collected";
    waste.collectionDate = new Date();

    if (collectionNote) {
      waste.collectionNote = collectionNote;
    }

    await waste.save({ session });

    /*
     * Calculate actual total collected quantity.
     */
    const totalCollected = waste.materials.reduce(
      (sum, material) =>
        sum + (material.collectedQuantity ?? material.quantity),
      0
    );

    /*
     * Update collector statistics.
     */
    for (const material of waste.materials) {
      const quantityCollected =
        material.collectedQuantity ?? material.quantity;

      const stat = assay.collectionStats.find(
        (item) =>
          item.category === "waste" &&
          item.material === material.wasteType
      );

      if (stat) {
        stat.quantityCollected += quantityCollected;
        stat.updatedAt = new Date();
      } else {
        assay.collectionStats.push({
          category: "waste",
          material: material.wasteType,
          quantityCollected,
          updatedAt: new Date(),
        });
      }
    }

    assay.totalQuantityCollected += totalCollected;

    await assay.save({ session });

    /*
     * Update user statistics.
     */
    user.totalWasteCollected =
      (user.totalWasteCollected || 0) + totalCollected;

    /*
     * Update user requestStats.
     */
    for (const material of waste.materials) {
      const quantityCollected =
        material.collectedQuantity ?? material.quantity;

      const stat = user.requestStats.find(
        (item) =>
          item.category === "waste" &&
          item.material === material.wasteType
      );

      if (stat) {
        stat.quantityCollected += quantityCollected;
        stat.updatedAt = new Date();
      } else {
        user.requestStats.push({
          category: "waste",
          material: material.wasteType,
          quantityCollected,
          updatedAt: new Date(),
        });
      }
    }

    /*
     * Calculate reward points.
     *
     * For now, 1 collected quantity = 1 point.
     * We can replace this with material-specific point
     * values later.
     */
    const pointsEarned = totalCollected;

    /*
     * Create the reward.
     *
     * The unique sourceRequest + sourceType index prevents
     * the same waste request from receiving another reward.
     */
    const reward = new Reward({
      user: user._id,
      collector: assay._id,
      sourceRequest: waste._id,
      sourceType: "Waste",
      pointsEarned,
      rewardItem: "Waste Collection Reward",
      status: "Earned",
    });

    await reward.save({ session });

    /*
     * Update user's reward balances.
     */
    user.totalRewardPointsEarned =
      (user.totalRewardPointsEarned || 0) + pointsEarned;

    user.rewardPointsBalance =
      (user.rewardPointsBalance || 0) + pointsEarned;

    await user.save({ session });

    await session.commitTransaction();
    committed = true;

    /*
     * Send email after successful transaction.
     */
    const subject = "Waste Request Collected ✅";

    const html = `
      <h1>Hi ${genTitle(user.gender)} ${user.name},</h1>

      <p>
        We're pleased to inform you that your waste request
        has been successfully collected.
      </p>

      <p>
        <strong>Status:</strong> ${waste.status}
      </p>

      <p>
        <strong>Total Quantity Collected:</strong> ${totalCollected}
      </p>

      <p>
        <strong>Reward Points Earned:</strong> ${pointsEarned}
      </p>

      <p>
        <strong>Location:</strong> ${waste.location}
      </p>

      <p>
        Thank you for contributing to a cleaner and healthier
        environment 🌍♻️.
      </p>
    `;

    try {
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error(
        "Waste collected, but notification email failed:",
        emailError.message
      );
    }

    return waste;
  } catch (error) {
    if (!committed && session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(
      "Error collecting waste request:",
      error.message
    );

    throw new Error(error.message);
  } finally {
    await session.endSession();
  }
};


export const deleteAllUser = async () =>{
  const user = await Waste.deleteMany()
  await User.updateMany({}, {
    $set: { Waste: 0, requestStats: [] }
  });
  return user
}


export const getWasteRequestToCollector = async (id) => {
  const wasteRequests = await Waste.find({ collector: id })
    .populate('user', 'name email phoneNumber')
    .populate({
      path: "collector",
      select: "collector serviceArea",
      populate: {
        path: "collector",
        select: "name email phoneNumber",
      },
    });

  if (!wasteRequests || wasteRequests.length === 0) {
    return [];
  }

  return wasteRequests.map(entry => {
    if (!entry.user) {
      return {
        id: entry._id,
        name: 'Unknown User',
        email: 'N/A',
        phoneNumber: 'N/A',
        materials: entry.materials,
        status: entry.status,
        recyclingDate: entry.recyclingDate,
        error: 'Associated user not found'
      };
    }

    const collectorUser = entry.collector ? entry.collector.user : null;

    return {
      wasteId: entry._id,
      userId: entry.user._id,
      userName: entry.user.name,
      userEmail: entry.user.email,
      userPhoneNumber: entry.user.phoneNumber,
      collectorId: entry.collector ? entry.collector._id : null,
      collectorName: collectorUser ? collectorUser.name : 'N/A',
      collectorPhoneNumber: collectorUser ? collectorUser.phoneNumber : 'N/A',
      rejectionReason:entry.collector.rejectionReason,
      materials: entry.materials,
      status: entry.status,
      requestDate: entry.requestDate,
      location: entry.location,
      address : entry.address,
      images : entry.images,
      serviceArea: entry.collector ? entry.collector.serviceArea : 'N/A',
      collectionDate: entry.collector ? entry.collector.collectionDate : null,
      totalQuantityCollected:entry.collector.totalQuantityCollected,
      notes: entry.notes
    };
  });
};

export const getAllWasteRequest = async () => {
  const WasteRequest = await Waste.find().populate('collector', 'name email phoneNumber');
  return WasteRequest;
}

