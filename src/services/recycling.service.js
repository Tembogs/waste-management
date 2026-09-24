import mongoose from "mongoose";
import CollectorAssay from "../model/collectorAssay.js";
import Recycling from "../model/recycling.js";
import Reward from "../model/rewards.js";
import User from "../model/user.js";
import { sendEmail } from "./email.services.js";

const genTitle = (gender) => gender === "Male" ? "Mr" : gender === "Female" ? "Mrs/Miss" : 'Mx'

export const createRecycleRequest = async (recycleData) => {
  try {
    const user = await User.findById(recycleData.userId).select(
      "name email phoneNumber gender"
    );

    if (!user) {
      throw new Error("User not found");
    }

    if (!recycleData.materials?.length) {
      throw new Error("At least one recycling material is required");
    }

    const normalizedLocation = recycleData.location
      ?.trim()
      .toLowerCase();

    if (!normalizedLocation) {
      throw new Error("Location is required");
    }

    const materials = recycleData.materials.map((material) => ({
      recycleType: material.recycleType,
      quantity: material.quantity,
      collectedQuantity: null,
      unit: material.unit || "kg",
    }));

    const assignedCollector = await CollectorAssay.findOne({
      serviceArea: normalizedLocation,
    }).select("_id collector serviceArea");

    const recycleRequest = new Recycling({
      user: user._id,
      materials,
      location: normalizedLocation,
      address:recycleData.address,
      images: recycleData.images || null,
      status: "Pending",
      collector: assignedCollector?._id || null,
      collectionDate: null,
      collectionNote: recycleData.collectionNote,
    });

    await recycleRequest.save();

    const genTitle = (gender) =>
      gender === "Male"
        ? "Mr"
        : gender === "Female"
        ? "Mrs/Miss"
        : "Mx";

    const materialSummary = recycleRequest.materials
      .map(
        (item, index) =>
          `${index + 1}. ${item.quantity} ${
            item.unit || "kg"
          } of ${item.recycleType}`
      )
      .join("<br>");

    const subject = "New Recycling Request ♻️";

    const html = `
      <h1>Hi ${genTitle(user.gender)} ${user.name},</h1>

      <p>
        Thank you for submitting your recycling request.
        Here's a summary of your materials:
      </p>

      <p>${materialSummary}</p>

      <p>
        <strong>Location:</strong>
        ${recycleRequest.location}
      </p>

      <p>
        <strong>Status:</strong>
        ${recycleRequest.status}
      </p>

      <p>
        Your recycling request will be reviewed and processed
        by our collection team.
      </p>

      <p>
        Reward points will be credited after your recycling
        request has been successfully collected.
      </p>
    `;

    try {
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error(
        "Recycling request created, but notification email failed:",
        emailError.message
      );
    }

    // Notify assigned collector
    if (assignedCollector?.collector) {
      const collectorUser = await User.findById(
        assignedCollector.collector
      ).select("email name gender");

      if (collectorUser?.email) {
        const collectorSubject =
          "New Recycling Request Assigned 🚛";

        const collectorHtml = `
          <h1>
            Hi ${genTitle(collectorUser.gender)}
            ${collectorUser.name},
          </h1>

          <p>
            A new recycling request has been assigned to you
            in <strong>${assignedCollector.serviceArea}</strong>.
          </p>

          <p>
            Please check your dashboard for the request details.
          </p>
        `;

        try {
          await sendEmail(
            collectorUser.email,
            collectorSubject,
            collectorHtml
          );
        } catch (emailError) {
          console.error(
            "Recycling request created, but collector notification failed:",
            emailError.message
          );
        }
      }
    }

    return recycleRequest;
  } catch (error) {
    console.error(
      "Recycling request creation failed:",
      error.message
    );

    throw error;
  }
};


export const getAllRecycleEntries = async () => {
  const recycleEntries = await Recycling.find().populate('user', 'name email phoneNumber');
  return recycleEntries;
}

export const getRecycleStatusV2 = async (userId) => {
  const recycleEntries = await Recycling.find({
    user: userId,
  })
    .populate(
      "user",
      "name email phoneNumber"
    )
    .populate({
      path: "collector",
      select: "collector serviceArea",
      populate: {
        path: "collector",
        select: "name email phoneNumber",
      },
    });

  if (!recycleEntries || recycleEntries.length === 0) {
    return [];
  }

  return recycleEntries.map((entry) => {
    if (!entry.user) {
      return {
        id: entry._id,
        name: "Unknown User",
        email: "N/A",
        phoneNumber: "N/A",
        collectorId: entry.collector?._id || null,
        collectorName: "N/A",
        collectorEmail: "N/A",
        collectorPhoneNumber: "N/A",
        serviceArea: entry.collector?.serviceArea || null,
        materials: entry.materials,
        location: entry.location,
        status: entry.status,
        rejectionReason: entry.rejectionReason,
        collectionNote: entry.collectionNote,
        requestDate: entry.requestDate,
        collectionDate: entry.collectionDate,
        error: "Associated user not found",
      };
    }

    const collectorUser =
      entry.collector?.collector || null;

    return {
      id: entry._id,

      name: entry.user.name,
      email: entry.user.email,
      phoneNumber: entry.user.phoneNumber,

      collectorId: entry.collector?._id || null,
      collectorName: collectorUser?.name || "N/A",
      collectorEmail: collectorUser?.email || "N/A",
      collectorPhoneNumber:
        collectorUser?.phoneNumber || "N/A",

      serviceArea:
        entry.collector?.serviceArea || null,

      materials: entry.materials,

      location: entry.location,

      status: entry.status,

      rejectionReason:
        entry.rejectionReason,

      collectionNote:
        entry.collectionNote,

      requestDate:
        entry.requestDate,

      collectionDate:
        entry.collectionDate,
    };
  });
};

export const deleteRecycleEntry = async (id) => {
  const recycleEntry = await Recycling.findById(id);

  if (!recycleEntry) {
    return null;
  }

  if (!["Pending", "Rejected"].includes(recycleEntry.status)) {
    throw new Error(
      `Recycling request cannot be deleted because its current status is ${recycleEntry.status}`
    );
  }

  await Recycling.findByIdAndDelete(id);

  return recycleEntry;
};

export const updateRecycle = async (id, updateData) => {
  const recycleEntry = await Recycling.findById(id);

  if (!recycleEntry) {
    throw new Error("Recycling request not found");
  }

  // Only rejected requests can be edited and resubmitted
  if (recycleEntry.status !== "Rejected") {
    throw new Error(
      `Recycling request cannot be edited because its current status is ${recycleEntry.status}`
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

  if (updates.materials !== undefined) {
    if (
      !Array.isArray(updates.materials) ||
      updates.materials.length === 0
    ) {
      throw new Error(
        "At least one recycling material is required"
      );
    }

    updates.materials = updates.materials.map((material) => ({
      recycleType: material.recycleType,
      quantity: material.quantity,
      collectedQuantity: null,
      unit: material.unit || "kg",
    }));
  }

  if (updates.location !== undefined) {
    const normalizedLocation = updates.location
      ?.trim()
      .toLowerCase();

    if (!normalizedLocation) {
      throw new Error("Location is required");
    }

    updates.location = normalizedLocation;
  }

  // Use the new location if supplied,
  // otherwise keep the existing location.
  const assignmentLocation =
    updates.location || recycleEntry.location;

  const assignedCollector = await CollectorAssay.findOne({
    serviceArea: assignmentLocation,
  }).select("_id collector serviceArea");

  updates.collector = assignedCollector?._id || null;

  // Reset the request for resubmission
  updates.status = "Pending";
  updates.rejectionReason = null;
  updates.collectionDate = null;
  updates.collectionNote = null;

  const updatedRecycle = await Recycling.findByIdAndUpdate(
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

  if (!updatedRecycle) {
    throw new Error(
      "Recycling request could not be updated"
    );
  }

  const materialSummary = updatedRecycle.materials
    .map(
      (item, index) =>
        `${index + 1}. ${item.quantity} ${
          item.unit || "units"
        } of ${item.recycleType}`
    )
    .join("<br>");

  const genTitle = (gender) =>
    gender === "Male"
      ? "Mr"
      : gender === "Female"
      ? "Mrs/Miss"
      : "Mx";

  const subject = "Recycling Request Resubmitted ♻️";

  const html = `
    <h1>
      Hi ${genTitle(updatedRecycle.user.gender)}
      ${updatedRecycle.user.name} 👋
    </h1>

    <p>
      Your previously rejected recycling request has been
      successfully updated and resubmitted.
    </p>

    <p>
      <strong>Request details:</strong>
    </p>

    <p>
      ${materialSummary}
    </p>

    <p>
      <strong>Location:</strong>
      ${updatedRecycle.location}
    </p>

    <p>
      <strong>Status:</strong>
      ${updatedRecycle.status} ⏳
    </p>

    <p>
      Your request will now go through the recycling
      collection process again.
    </p>

    <p>
      Thank you for helping us build a cleaner environment 🌍♻️.
    </p>
  `;

  try {
    await sendEmail(
      updatedRecycle.user.email,
      subject,
      html
    );
  } catch (error) {
    console.error(
      "Recycling request updated, but notification email failed:",
      error.message
    );
  }

  return updatedRecycle;
};

// Collector- Section
export const acceptRecycleRequestService = async (
  recycleId,
  collectorAssayId
) => {
  const session = await mongoose.startSession();
  let committed = false;

  try {
    session.startTransaction();

    const recycle = await Recycling.findById(recycleId)
      .session(session);

    if (!recycle) {
      throw new Error("Recycle request not found");
    }

    if (recycle.status !== "Pending") {
      throw new Error(
        `Recycle request cannot be accepted because its current status is ${recycle.status}`
      );
    }

    const user = await User.findById(recycle.user)
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

    // Make sure this recycling request is assigned
    // to the collector trying to accept it.
    if (
      !recycle.collector ||
      recycle.collector.toString() !== collectorAssayId.toString()
    ) {
      throw new Error(
        "This recycling request is not assigned to this collector"
      );
    }

    recycle.status = "Accepted";

    await recycle.save({ session });

    assay.acceptedRequests += 1;

    await assay.save({ session });

    await session.commitTransaction();
    committed = true;

    const genTitle = (gender) =>
      gender === "Male"
        ? "Mr"
        : gender === "Female"
        ? "Mrs/Miss"
        : "Mx";

    const subject = "Recycling Request Accepted ✅";

    const html = `
      <h1>Hi ${genTitle(user.gender)} ${user.name},</h1>

      <p>
        Your recycling request has been accepted!
      </p>

      <p>
        A collector will proceed with your recycling collection.
      </p>

      <p>
        <strong>Status:</strong> ${recycle.status}
      </p>

      <p>
        Thank you for contributing to a cleaner environment! 🌍♻️
      </p>
    `;

    try {
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error(
        "Recycling request accepted, but notification email failed:",
        emailError.message
      );
    }

    return recycle;
  } catch (error) {
    if (!committed && session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(
      "Error accepting recycling request:",
      error.message
    );

    throw new Error(error.message);
  } finally {
    await session.endSession();
  }
};


export const rejectRecycleRequestService = async (
  recycleId,
  collectorAssayId,
  rejectionReason = ""
) => {
  const session = await mongoose.startSession();
  let committed = false;

  try {
    session.startTransaction();

    const recycle = await Recycling.findById(recycleId)
      .session(session);

    if (!recycle) {
      throw new Error("Recycle request not found");
    }

    if (recycle.status !== "Pending") {
      throw new Error(
        `Recycle request cannot be rejected because its current status is ${recycle.status}`
      );
    }

    if (!rejectionReason || rejectionReason.trim() === "") {
      throw new Error(
        "Rejection reason is required when rejecting a recycle request"
      );
    }

    const assay = await CollectorAssay.findById(collectorAssayId)
      .session(session);

    if (!assay) {
      throw new Error("Collector assay not found");
    }

    if (
      recycle.collector &&
      recycle.collector.toString() !== collectorAssayId.toString()
    ) {
      throw new Error(
        "This recycling request is not assigned to this collector"
      );
    }

    const user = await User.findById(recycle.user)
      .select("name email gender")
      .session(session);

    if (!user) {
      throw new Error("User not found");
    }

    const trimmedReason = rejectionReason.trim();

    recycle.status = "Rejected";
    recycle.collector = assay._id;
    recycle.rejectionReason = trimmedReason;

    await recycle.save({ session });

    assay.rejectedRequests += 1;

    await assay.save({ session });

    await session.commitTransaction();
    committed = true;

    const genTitle = (gender) =>
      gender === "Male"
        ? "Mr"
        : gender === "Female"
        ? "Mrs/Miss"
        : "Mx";

    const subject = "Recycling Request Rejected ❌";

    const html = `
      <h1>Hi ${genTitle(user.gender)} ${user.name},</h1>

      <p>
        We're sorry to inform you that your recent
        recycling request has been rejected.
      </p>

      <p>
        <strong>Reason:</strong> ${trimmedReason}
      </p>

      <p>
        You can review your request, make the necessary
        changes, and submit it again.
      </p>

      <p>
        Thank you for your continued efforts toward
        a cleaner environment 🌍♻️.
      </p>
    `;

    try {
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error(
        "Recycling request rejected, but notification email failed:",
        emailError.message
      );
    }

    return recycle;
  } catch (error) {
    if (!committed && session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(
      "Error rejecting recycling request:",
      error.message
    );

    throw new Error(error.message);
  } finally {
    await session.endSession();
  }
};

export const routecollectorService = async (
  recycleId,
  collectorAssayId
) => {
  const session = await mongoose.startSession();
  let committed = false;

  try {
    session.startTransaction();

    const recycle = await Recycling.findById(recycleId)
      .session(session);

    if (!recycle) {
      throw new Error("Recycle request not found");
    }

    if (recycle.status !== "Accepted") {
      throw new Error(
        `Recycle request cannot be routed because its current status is ${recycle.status}`
      );
    }

    if (
      !recycle.collector ||
      recycle.collector.toString() !== collectorAssayId.toString()
    ) {
      throw new Error(
        "This recycling request is not assigned to this collector"
      );
    }

    const user = await User.findById(recycle.user)
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

    recycle.status = "En Route";

    await recycle.save({ session });

    await session.commitTransaction();
    committed = true;

    const genTitle = (gender) =>
      gender === "Male"
        ? "Mr"
        : gender === "Female"
        ? "Mrs/Miss"
        : "Mx";

    const subject = "Recycling Request En Route 🚚";

    const html = `
      <h1>Hi ${genTitle(user.gender)} ${user.name},</h1>

      <p>
        Good news! Your recycling request is currently
        en route and will be handled shortly.
      </p>

      <p>
        <strong>Status:</strong> ${recycle.status}
      </p>

      <p>
        Please ensure the recycling materials are accessible
        for collection at the specified location.
      </p>

      <p>
        Thank you for your commitment to a cleaner and
        healthier environment 🌍♻️.
      </p>
    `;

    try {
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error(
        "Recycling request routed, but notification email failed:",
        emailError.message
      );
    }

    return recycle;
  } catch (error) {
    if (!committed && session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(
      "Error routing recycling request:",
      error.message
    );

    throw new Error(error.message);
  } finally {
    await session.endSession();
  }
};

export const collectRecycleRequest = async (
  recycleId,
  collectorAssayId,
  collectedMaterials = null,
  collectionNote = null
) => {
  const session = await mongoose.startSession();
  let committed = false;

  try {
    session.startTransaction();

    const recycle = await Recycling.findById(recycleId)
      .session(session);

    if (!recycle) {
      throw new Error("Recycle request not found");
    }

    if (recycle.status !== "En Route") {
      throw new Error(
        `Recycle request cannot be collected because its current status is ${recycle.status}`
      );
    }

    if (
      !recycle.collector ||
      recycle.collector.toString() !== collectorAssayId.toString()
    ) {
      throw new Error(
        "This recycling request is not assigned to this collector"
      );
    }

    const user = await User.findById(recycle.user)
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
     * If the collector does not submit a collected quantity,
     * use the originally requested quantity.
     */
    recycle.materials.forEach((material) => {
      const submittedMaterial = collectedMaterials?.find(
        (item) => item.recycleType === material.recycleType
      );

      const actualQuantity =
        submittedMaterial?.collectedQuantity ?? material.quantity;

      if (actualQuantity < 0) {
        throw new Error(
          `Collected quantity for ${material.recycleType} cannot be negative`
        );
      }

      if (actualQuantity > material.quantity) {
        throw new Error(
          `Collected quantity for ${material.recycleType} cannot exceed requested quantity`
        );
      }

      material.collectedQuantity = actualQuantity;
    });

    recycle.status = "Collected";
    recycle.collectionDate = new Date();

    if (collectionNote) {
      recycle.collectionNote = collectionNote;
    }

    await recycle.save({ session });

    /*
     * Calculate total actual quantity collected.
     */
    const totalCollected = recycle.materials.reduce(
      (sum, material) =>
        sum + (material.collectedQuantity ?? material.quantity),
      0
    );

    /*
     * Update collector statistics.
     */
    for (const material of recycle.materials) {
      const quantityCollected =
        material.collectedQuantity ?? material.quantity;

      const stat = assay.collectionStats.find(
        (item) =>
          item.category === "recycle" &&
          item.material === material.recycleType
      );

      if (stat) {
        stat.quantityCollected += quantityCollected;
        stat.updatedAt = new Date();
      } else {
        assay.collectionStats.push({
          category: "recycle",
          material: material.recycleType,
          quantityCollected,
          updatedAt: new Date(),
        });
      }
    }

    assay.totalQuantityCollected += totalCollected;

    await assay.save({ session });

    /*
     * Update user's recycling statistics.
     */
    user.totalRecyclingCollected =
      (user.totalRecyclingCollected || 0) + totalCollected;

    for (const material of recycle.materials) {
      const quantityCollected =
        material.collectedQuantity ?? material.quantity;

      const stat = user.requestStats.find(
        (item) =>
          item.category === "recycle" &&
          item.material === material.recycleType
      );

      if (stat) {
        stat.quantityCollected += quantityCollected;
        stat.updatedAt = new Date();
      } else {
        user.requestStats.push({
          category: "recycle",
          material: material.recycleType,
          quantityCollected,
          updatedAt: new Date(),
        });
      }
    }

    /*
     * Calculate recycling reward points.
     *
     * Existing recycling policy:
     * General = 1 point
     * Paper = 2 points
     * Plastic = 3 points
     * Glass = 2 points
     * Metal = 4 points
     * Organic = 2 points
     * E-waste = 5 points
     *
     * Bonus: 10% when the collected quantity for a material
     * is greater than 50.
     */
    const pointsPerMaterial = {
      General: 1,
      Paper: 2,
      Plastic: 3,
      Glass: 2,
      Metal: 4,
      Organic: 2,
      "E-waste": 5,
    };

    let pointsEarned = 0;

    for (const material of recycle.materials) {
      const quantityCollected =
        material.collectedQuantity ?? material.quantity;

      const basePoints =
        quantityCollected *
        (pointsPerMaterial[material.recycleType] || 1);

      const bonus =
        quantityCollected > 50
          ? Math.round(basePoints * 0.1)
          : 0;

      pointsEarned += basePoints + bonus;
    }

    /*
     * Create reward only after successful collection.
     */
    const reward = new Reward({
      user: user._id,
      collector: assay._id,
      sourceRequest: recycle._id,
      sourceType: "Recycling",
      pointsEarned,
      rewardItem: "Recycling Collection Reward",
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
     * Email notification happens after the transaction.
     * If email fails, the collection remains successful.
     */
    const genTitle = (gender) =>
      gender === "Male"
        ? "Mr"
        : gender === "Female"
        ? "Mrs/Miss"
        : "Mx";

    const subject = "Recycling Request Collected ✅";

    const html = `
      <h1>Hi ${genTitle(user.gender)} ${user.name},</h1>

      <p>
        We're pleased to inform you that your recycling request
        has been successfully collected.
      </p>

      <p>
        <strong>Status:</strong> ${recycle.status}
      </p>

      <p>
        <strong>Total Quantity Collected:</strong>
        ${totalCollected}
      </p>

      <p>
        <strong>Reward Points Earned:</strong>
        ${pointsEarned}
      </p>

      <p>
        <strong>Location:</strong>
        ${recycle.location}
      </p>

      ${
        collectionNote
          ? `<p><strong>Collection Note:</strong> ${collectionNote}</p>`
          : ""
      }

      <p>
        Thank you for contributing to a cleaner and healthier
        environment 🌍♻️.
      </p>
    `;

    try {
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error(
        "Recycling collected, but notification email failed:",
        emailError.message
      );
    }

    return recycle;
  } catch (error) {
    if (!committed && session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(
      "Error collecting recycling request:",
      error.message
    );

    throw new Error(error.message);
  } finally {
    await session.endSession();
  }
};

export const deleteAllUser = async () =>{
  const user = await Recycling.deleteMany()
  await User.updateMany({}, {
      $set: { Recycling: 0, requestStats: [] }
    });
  return user
}


export const getRecycleRequestToCollector = async (
  id
) => {
  const recycleRequests = await Recycling.find({
    collector: id,
  })
    .populate(
      "user",
      "name email phoneNumber"
    )
    .populate({
      path: "collector",
      select: "collector serviceArea",
      populate: {
        path: "collector",
        select: "name email phoneNumber",
      },
    });

  if (!recycleRequests || recycleRequests.length === 0) {
    return [];
  }

  return recycleRequests.map((entry) => {
    if (!entry.user) {
      return {
        recycleId: entry._id,
        userId: null,
        userName: "Unknown User",
        userEmail: "N/A",
        userPhoneNumber: "N/A",

        collectorId:
          entry.collector?._id || null,

        collectorName: "N/A",
        collectorEmail: "N/A",
        collectorPhoneNumber: "N/A",

        materials: entry.materials,
        status: entry.status,
        rejectionReason: entry.rejectionReason,
        collectionNote: entry.collectionNote,
        location: entry.location,
        address : entry.address,
        images : entry.images,
        serviceArea:entry.collector?.serviceArea || null,
        requestDate: entry.requestDate,
        collectionDate: entry.collectionDate,

        error: "Associated user not found",
      };
    }

    const collectorUser =
      entry.collector?.collector || null;

    const totalQuantityCollected =
      entry.materials.reduce(
        (sum, material) =>
          sum +
          (material.collectedQuantity ?? 0),
        0
      );

    return {
      recycleId: entry._id,

      userId: entry.user._id,
      userName: entry.user.name,
      userEmail: entry.user.email,
      userPhoneNumber:
        entry.user.phoneNumber,

      collectorId:
        entry.collector?._id || null,

      collectorName:
        collectorUser?.name || "N/A",

      collectorEmail:
        collectorUser?.email || "N/A",

      collectorPhoneNumber:
        collectorUser?.phoneNumber || "N/A",

      materials: entry.materials,

      status: entry.status,

      rejectionReason:
        entry.rejectionReason,

      collectionNote:
        entry.collectionNote,

      location: entry.location,

      serviceArea:
        entry.collector?.serviceArea || null,

      requestDate:
        entry.requestDate,

      collectionDate:
        entry.collectionDate,

      totalQuantityCollected,

    };
  });
};



  