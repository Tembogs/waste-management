import IllegalDump from "../model/illegalDump.js";
import Reward from "../model/rewards.js";
import User from "../model/user.js";
import { sendEmail } from "./email.services.js";
import CollectorAssay from "../model/collectorAssay.js";
import mongoose from "mongoose";


const genTitle = (gender) => gender === "Male" ? "Mr" : gender === "Female" ? "Mrs/Miss" : 'Mx'

export const reportIllegalDump = async (illegalData) => {
  try {
    const user = await User.findById(illegalData.userId).select(
      "name email phoneNumber gender"
    );

    if (!user) {
      throw new Error("User not found");
    }

    if (!illegalData.materials?.length) {
      throw new Error(
        "At least one illegal dumping material is required"
      );
    }

    const normalizedLocation =
      illegalData.location?.trim().toLowerCase();

    if (!normalizedLocation) {
      throw new Error("Location is required");
    }

    if (!illegalData.description?.trim()) {
      throw new Error("Description is required");
    }

    /*
     * Normalize the submitted materials.
     */
    const materials = illegalData.materials.map((material) => ({
      dumpType: material.dumpType,
      quantity: material.quantity,
      unit: material.unit || "kg",
    }));

    /*
     * Automatically assign a collector based on location.
     */
    const assignedCollector = await CollectorAssay.findOne({
      serviceArea: normalizedLocation,
    }).select("_id collector serviceArea");

    /*
     * Create the report only.
     *
     * NO reward is created here.
     * NO reward points are credited here.
     * NO requestStats are updated here.
     */
    const illegalRequest = new IllegalDump({
      reporter: user._id,
      collector: assignedCollector?._id || null,
      location: normalizedLocation,
      materials,
      address:illegalData.address,
      description: illegalData.description.trim(),
      images: illegalData.images || null,
      reportDate: new Date(),
      resolutionDate: null,
      status: "Pending",
      rejectionReason: null,
      resolutionNote: illegalData.resolutionNote,
    });

    await illegalRequest.save();

    /*
     * Email helper.
     */
    const genTitle = (gender) =>
      gender === "Male"
        ? "Mr"
        : gender === "Female"
        ? "Mrs/Miss"
        : "Mx";

    const materialSummary = illegalRequest.materials
      .map(
        (item, index) =>
          `${index + 1}. ${item.quantity} ${
            item.unit || "kg"
          } of ${item.dumpType}`
      )
      .join("<br>");

    /*
     * Email reporter.
     */
    const subject = "Illegal Dump Report Received 🚨";

    const html = `
      <h1>
        Hello ${genTitle(user.gender)} ${user.name},
      </h1>

      <p>
        Thank you for reporting an illegal dumping incident.
        Here's a summary of your report:
      </p>

      <p>
        <strong>Location:</strong>
        ${illegalRequest.location}
      </p>

      <p>
        <strong>Description:</strong>
        ${illegalRequest.description}
      </p>

      <p>
        <strong>Materials:</strong><br>
        ${materialSummary}
      </p>

      <p>
        <strong>Status:</strong>
        ${illegalRequest.status}
      </p>

      <p>
        <strong>Reported on:</strong>
        ${illegalRequest.reportDate.toLocaleString()}
      </p>

      ${
        assignedCollector
          ? `<p>
              A collector has been assigned to review
              this report.
            </p>`
          : `<p>
              A collector has not yet been assigned to
              this report.
            </p>`
      }

      <p>
        Reward points will only be credited after the
        illegal dumping report has been successfully resolved.
      </p>

      <p>
        Thank you for helping us keep our communities
        clean and safe 🌍.
      </p>
    `;

    try {
      await sendEmail(
        user.email,
        subject,
        html
      );
    } catch (emailError) {
      console.error(
        "Illegal dump report created, but reporter email failed:",
        emailError.message
      );
    }

    /*
     * Notify assigned collector.
     */
    if (assignedCollector?.collector) {
      const collectorUser = await User.findById(
        assignedCollector.collector
      ).select("email name gender");

      if (collectorUser?.email) {
        const collectorSubject =
          "New Illegal Dump Report Assigned 🚛";

        const collectorHtml = `
          <h1>
            Hi ${genTitle(collectorUser.gender)}
            ${collectorUser.name},
          </h1>

          <p>
            A new illegal dumping report has been assigned
            to you in
            <strong>${assignedCollector.serviceArea}</strong>.
          </p>

          <p>
            Please check your dashboard for the report details.
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
            "Illegal dump report created, but collector notification failed:",
            emailError.message
          );
        }
      }
    }

    return illegalRequest;
  } catch (error) {
    console.error(
      "Illegal dump report failed:",
      error.message
    );

    throw error;
  }
};

export const getAllIllegalEntries = async () => {
  const IllegalEntries = await IllegalDump.find().populate('reporter', 'name email phoneNumber');
  return IllegalEntries;
}

export const getIllegalStatusV2 = async (userId) => {
  const illegalEntries = await IllegalDump.find({
    reporter: userId,
  })
    .populate("reporter", "name email phoneNumber")
    .populate({
      path: "collector",
      select: "collector serviceArea",
      populate: {
        path: "collector",
        select: "name email phoneNumber",
      },
    });

  if (!illegalEntries || illegalEntries.length === 0) {
    return [];
  }

  return illegalEntries.map((entry) => {
    if (!entry.reporter) {
      return {
        id: entry._id,
        name: "Unknown Reporter",
        email: "N/A",
        phoneNumber: "N/A",
        collectorId: entry.collector?._id || null,
        collectorName: "N/A",
        collectorEmail: "N/A",
        collectorPhoneNumber: "N/A",
        serviceArea: entry.collector?.serviceArea || null,
        location: entry.location,
        materials: entry.materials,
        description: entry.description,
        status: entry.status,
        rejectionReason: entry.rejectionReason,
        resolutionNote: entry.resolutionNote,
        reportDate: entry.reportDate,
        resolutionDate: entry.resolutionDate,
        error: "Associated reporter not found",
      };
    }

    const collectorUser = entry.collector?.collector || null;

    return {
      id: entry._id,

      name: entry.reporter.name,
      email: entry.reporter.email,
      phoneNumber: entry.reporter.phoneNumber,

      collectorId: entry.collector?._id || null,
      collectorName: collectorUser?.name || "N/A",
      collectorEmail: collectorUser?.email || "N/A",
      collectorPhoneNumber: collectorUser?.phoneNumber || "N/A",
      serviceArea: entry.collector?.serviceArea || null,

      location: entry.location,
      materials: entry.materials,
      description: entry.description,

      status: entry.status,
      rejectionReason: entry.rejectionReason,
      resolutionNote: entry.resolutionNote,

      reportDate: entry.reportDate,
      resolutionDate: entry.resolutionDate,
    };
  });
};


export const updateIllegalEntryById = async (id, updateData) => {
  const illegalEntry = await IllegalDump.findById(id);

  if (!illegalEntry) {
    throw new Error("Illegal dump report not found");
  }

  if (illegalEntry.status !== "Rejected") {
    throw new Error(
      `Illegal dump report cannot be edited because its current status is ${illegalEntry.status}`
    );
  }

  const allowedUpdates = [
    "materials",
    "description",
    "images",
    "location",
  ];

  const updates = {};

  for (const key of allowedUpdates) {
    if (updateData[key] !== undefined) {
      updates[key] = updateData[key];
    }
  }

  /*
   * Validate materials if they are being changed.
   */
  if (updates.materials !== undefined) {
    if (
      !Array.isArray(updates.materials) ||
      updates.materials.length === 0
    ) {
      throw new Error(
        "At least one illegal dumping material is required"
      );
    }

    updates.materials = updates.materials.map((material) => ({
      dumpType: material.dumpType,
      quantity: material.quantity,
      unit: material.unit || "kg",
    }));
  }

  /*
   * Validate description.
   */
  if (updates.description !== undefined) {
    if (!updates.description?.trim()) {
      throw new Error("Description is required");
    }

    updates.description = updates.description.trim();
  }

  /*
   * Normalize location.
   */
  if (updates.location !== undefined) {
    const normalizedLocation = updates.location?.trim().toLowerCase();

    if (!normalizedLocation) {
      throw new Error("Location is required");
    }

    updates.location = normalizedLocation;
  }

  /*
   * Determine the location used for collector assignment.
   */
  const assignmentLocation =
    updates.location || illegalEntry.location;

  const assignedCollector = await CollectorAssay.findOne({
    serviceArea: assignmentLocation,
  }).select("_id collector serviceArea");

  /*
   * Reset the rejected request back to Pending.
   */
  updates.status = "Pending";
  updates.rejectionReason = null;
  updates.resolutionDate = null;
  updates.resolutionNote = null;
  updates.collector = assignedCollector?._id || null;

  const updatedIllegalEntry =
    await IllegalDump.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).populate(
      "reporter",
      "name email phoneNumber gender"
    );

  if (!updatedIllegalEntry) {
    throw new Error(
      "Illegal dump report could not be updated"
    );
  }

  /*
   * Material summary for notification.
   */
  const materialSummary = updatedIllegalEntry.materials
    .map(
      (item, index) =>
        `${index + 1}. ${item.quantity} ${
          item.unit || "kg"
        } of ${item.dumpType}`
    )
    .join("<br>");

  const genTitle = (gender) =>
    gender === "Male"
      ? "Mr"
      : gender === "Female"
      ? "Mrs/Miss"
      : "Mx";

  const subject = "Illegal Dump Report Resubmitted ♻️";

  const html = `
    <h1>
      Hi ${genTitle(
        updatedIllegalEntry.reporter.gender
      )} ${updatedIllegalEntry.reporter.name} 👋
    </h1>

    <p>
      Your rejected illegal dumping report has been
      successfully updated and resubmitted.
    </p>

    <p>
      <strong>Materials:</strong><br>
      ${materialSummary}
    </p>

    <p>
      <strong>Location:</strong>
      ${updatedIllegalEntry.location}
    </p>

    <p>
      <strong>Status:</strong>
      Pending ⏳
    </p>

    <p>
      No reward points have been awarded yet.
      Reward points will only be awarded if the report
      is successfully resolved.
    </p>

    <p>
      We'll notify you when the report is processed.
    </p>

    <p>
      Thank you for helping keep our environment clean
      and safe 🌍♻️.
    </p>
  `;

  try {
    await sendEmail(
      updatedIllegalEntry.reporter.email,
      subject,
      html
    );
  } catch (error) {
    console.error(
      "Illegal dump updated, but notification email failed:",
      error.message
    );
  }

  return updatedIllegalEntry;
};
    
    
export const deleteIllegalEntry = async (id) => {
  const illegalEntry = await IllegalDump.findById(id);

  if (!illegalEntry) {
    return null;
  }

  if (!["Pending", "Rejected"].includes(illegalEntry.status)) {
    throw new Error(
      `Illegal dump report cannot be deleted because its current status is ${illegalEntry.status}`
    );
  }

  await IllegalDump.findByIdAndDelete(id);

  return illegalEntry;
};


export const deleteAllDump = async () =>{
  const dump = await IllegalDump.deleteMany()
  await User.updateMany({}, {
      $set: { Recycling: 0, requestStats: [] }
    });
  return dump
}


// Collector- Section
export const acceptDumpRequestService = async (
  dumpId,
  collectorAssayId
) => {
  const session = await mongoose.startSession();
  let committed = false;

  try {
    session.startTransaction();

    const dump = await IllegalDump.findById(dumpId)
      .session(session);

    if (!dump) {
      throw new Error(
        "Illegal dump report not found"
      );
    }

    if (dump.status !== "Pending") {
      throw new Error(
        `Illegal dump report cannot be moved to review because its current status is ${dump.status}`
      );
    }

    const assay = await CollectorAssay.findById(
      collectorAssayId
    ).session(session);

    if (!assay) {
      throw new Error(
        "Collector assay not found"
      );
    }

    /*
     * If a collector was already assigned,
     * only that collector can accept/review it.
     */
    if (
      dump.collector &&
      dump.collector.toString() !==
        collectorAssayId.toString()
    ) {
      throw new Error(
        "This illegal dump report is assigned to another collector"
      );
    }

    const user = await User.findById(
      dump.reporter
    )
      .select("name email gender")
      .session(session);

    if (!user) {
      throw new Error("User not found");
    }

    /*
     * Move the report into review.
     */
    dump.status = "InReview";
    dump.collector = assay._id;

    await dump.save({ session });

    /*
     * An accepted/reviewed report counts as an
     * accepted request, but it is NOT collected yet.
     *
     * Therefore:
     * - no collectionStats update
     * - no totalQuantityCollected update
     * - no reward
     * - no user reward points
     */
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

    const subject =
      "Illegal Dump Report Under Review 🔍";

    const html = `
      <h1>
        Hi ${genTitle(user.gender)} ${user.name},
      </h1>

      <p>
        Your illegal dumping report is now under review
        by our collection team.
      </p>

      <p>
        <strong>Status:</strong>
        ${dump.status}
      </p>

      <p>
        Our team will review the report and take the
        necessary action.
      </p>

      <p>
        Reward points will only be credited after the
        report has been successfully resolved.
      </p>

      <p>
        Thank you for helping us maintain a cleaner
        environment! 🌍♻️
      </p>
    `;

    try {
      await sendEmail(
        user.email,
        subject,
        html
      );
    } catch (emailError) {
      console.error(
        "Illegal dump moved to review, but notification email failed:",
        emailError.message
      );
    }

    return dump;
  } catch (error) {
    if (
      !committed &&
      session.inTransaction()
    ) {
      await session.abortTransaction();
    }

    console.error(
      "Error accepting illegal dump request:",
      error.message
    );

    throw new Error(error.message);
  } finally {
    await session.endSession();
  }
};



export const rejectDumpRequestService = async (
  dumpId,
  collectorAssayId,
  rejectionReason = ""
) => {
  const session = await mongoose.startSession();
  let committed = false;

  try {
    session.startTransaction();

    const dump = await IllegalDump.findById(dumpId)
      .session(session);

    if (!dump) {
      throw new Error(
        "Illegal dump report not found"
      );
    }

    /*
     * Only Pending reports can be rejected.
     *
     * Once a report is InReview, it has already been
     * accepted by a collector and should proceed toward
     * resolution.
     */
    if (dump.status !== "Pending") {
      throw new Error(
        `Illegal dump report cannot be rejected because its current status is ${dump.status}`
      );
    }

    if (
      !rejectionReason ||
      rejectionReason.trim() === ""
    ) {
      throw new Error(
        "Rejection reason is required when rejecting an illegal dump report"
      );
    }

    const assay = await CollectorAssay.findById(
      collectorAssayId
    ).session(session);

    if (!assay) {
      throw new Error(
        "Collector assay not found"
      );
    }

    /*
     * If the report already has an assigned collector,
     * only that collector can reject it.
     */
    if (
      dump.collector &&
      dump.collector.toString() !==
        collectorAssayId.toString()
    ) {
      throw new Error(
        "This illegal dump report is assigned to another collector"
      );
    }

    const user = await User.findById(
      dump.reporter
    )
      .select("name email gender")
      .session(session);

    if (!user) {
      throw new Error("User not found");
    }

    const trimmedReason =
      rejectionReason.trim();

    /*
     * Update report.
     */
    dump.status = "Rejected";
    dump.collector = assay._id;
    dump.rejectionReason = trimmedReason;

    await dump.save({ session });

    /*
     * Update collector rejection count only.
     *
     * No collection statistics.
     * No quantity changes.
     * No reward.
     */
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

    const subject =
      "Illegal Dump Report Rejected ❌";

    const html = `
      <h1>
        Hi ${genTitle(user.gender)} ${user.name},
      </h1>

      <p>
        We're sorry to inform you that your recent
        illegal dumping report has been rejected.
      </p>

      <p>
        <strong>Reason:</strong>
        ${trimmedReason}
      </p>

      <p>
        You can review the report and submit a new
        report if necessary.
      </p>

      <p>
        No reward points were awarded because the
        report was not resolved.
      </p>

      <p>
        Thank you for your continued efforts toward
        a cleaner environment 🌍.
      </p>
    `;

    try {
      await sendEmail(
        user.email,
        subject,
        html
      );
    } catch (emailError) {
      console.error(
        "Illegal dump rejected, but notification email failed:",
        emailError.message
      );
    }

    return dump;
  } catch (error) {
    if (
      !committed &&
      session.inTransaction()
    ) {
      await session.abortTransaction();
    }

    console.error(
      "Error rejecting illegal dump report:",
      error.message
    );

    throw new Error(error.message);
  } finally {
    await session.endSession();
  }
};

export const resolveDumpRequestService = async (
  dumpId,
  collectorAssayId,
  resolutionNote = ""
) => {
  const session = await mongoose.startSession();
  let committed = false;

  try {
    session.startTransaction();

    const dump = await IllegalDump.findById(dumpId).session(session);

    if (!dump) {
      throw new Error("Illegal dump report not found");
    }

    if (dump.status !== "InReview") {
      throw new Error(
        `Illegal dump report cannot be resolved because its current status is ${dump.status}`
      );
    }

    const user = await User.findById(dump.reporter).session(session);

    if (!user) {
      throw new Error("User not found");
    }

    const assay = await CollectorAssay.findById(collectorAssayId)
      .session(session);

    if (!assay) {
      throw new Error("Collector assay not found");
    }

    if (
      !dump.collector ||
      dump.collector.toString() !== collectorAssayId.toString()
    ) {
      throw new Error(
        "This illegal dump report is not assigned to this collector"
      );
    }

    /*
     * Resolve the report
     */
    dump.status = "Resolved";
    dump.resolutionDate = new Date();
    dump.resolutionNote = resolutionNote?.trim() || null;

    await dump.save({ session });

    /*
     * Count this as a resolved illegal dump report
     */
    user.totalIllegalDumpReports =
      (user.totalIllegalDumpReports || 0) + 1;

    /*
     * Update user's illegal-dump material statistics
     */
    for (const material of dump.materials) {
      const quantity = material.quantity;

      const stat = user.requestStats.find(
        (item) =>
          item.category === "illegal" &&
          item.material === material.dumpType
      );

      if (stat) {
        stat.quantityCollected += quantity;
        stat.updatedAt = new Date();
      } else {
        user.requestStats.push({
          category: "illegal",
          material: material.dumpType,
          quantityCollected: quantity,
          updatedAt: new Date(),
        });
      }
    }

    /*
     * Calculate reward points.
     *
     * Current policy:
     * General = 1 point
     * Paper = 2 points
     * Plastic = 3 points
     * Glass = 2 points
     * Metal = 4 points
     * Organic = 2 points
     * E-waste = 5 points
     *
     * 10% bonus when quantity > 50.
     */
    const rewardRates = {
      General: 1,
      Paper: 2,
      Plastic: 3,
      Glass: 2,
      Metal: 4,
      Organic: 2,
      "E-waste": 5,
    };

    let pointsEarned = 0;

    for (const material of dump.materials) {
      const rate = rewardRates[material.dumpType] || 0;

      let materialPoints = material.quantity * rate;

      if (material.quantity > 50) {
        materialPoints *= 1.1;
      }

      pointsEarned += materialPoints;
    }

    pointsEarned = Math.round(pointsEarned);

    /*
     * Create reward only after successful resolution.
     */
    if (pointsEarned > 0) {
      const reward = new Reward({
        user: user._id,
        collector: assay._id,
        sourceRequest: dump._id,
        sourceType: "IllegalDump",
        pointsEarned,
        rewardItem: "Illegal Dump Resolution Reward",
        status: "Earned",
      });

      await reward.save({ session });

      user.totalRewardPointsEarned =
        (user.totalRewardPointsEarned || 0) + pointsEarned;

      user.rewardPointsBalance =
        (user.rewardPointsBalance || 0) + pointsEarned;
    }

    await user.save({ session });

    await session.commitTransaction();
    committed = true;

    /*
     * Send notification after the database transaction succeeds.
     */
    const genTitle = (gender) =>
      gender === "Male"
        ? "Mr"
        : gender === "Female"
        ? "Mrs/Miss"
        : "Mx";

    const subject = "Illegal Dump Report Resolved ✅";

    const html = `
      <h1>Hi ${genTitle(user.gender)} ${user.name},</h1>

      <p>
        Great news! Your illegal dumping report has been successfully resolved.
        The reported materials have been collected and properly disposed of.
      </p>

      <p>
        <strong>Reward points earned:</strong> ${pointsEarned}
      </p>

      ${
        dump.resolutionNote
          ? `<p><strong>Resolution note:</strong> ${dump.resolutionNote}</p>`
          : ""
      }

      <p>
        Thank you for taking action to keep our environment clean and safe! 🌍♻️
      </p>

      <p>
        If you have any further concerns or need assistance, feel free to reply
        to this email 📩.
      </p>
    `;

    try {
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error(
        "Illegal dump resolved, but notification email failed:",
        emailError.message
      );
    }

    return dump;
  } catch (error) {
    if (!committed && session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(
      "Error resolving illegal dump report:",
      error.message
    );

    throw new Error(error.message);
  } finally {
    await session.endSession();
  }
};

export const getDumpRequestToCollector = async (collectorAssayId) => {
  const dumpRequests = await IllegalDump.find({
    collector: collectorAssayId,
  })
    .populate("reporter", "name email phoneNumber")
    .populate({
      path: "collector",
      select: "collector serviceArea",
      populate: {
        path: "collector",
        select: "name email phoneNumber",
      },
    });

  if (!dumpRequests || dumpRequests.length === 0) {
    return [];
  }

  return dumpRequests.map((entry) => {
    if (!entry.reporter) {
      return {
        dumpId: entry._id,

        userId: null,
        userName: "Unknown User",
        userEmail: "N/A",
        userPhoneNumber: "N/A",

        collectorId: entry.collector?._id || null,
        collectorName: "N/A",
        collectorEmail: "N/A",
        collectorPhoneNumber: "N/A",

        materials: entry.materials,
        location: entry.location,
        description: entry.description,

        status: entry.status,
        rejectionReason: entry.rejectionReason,
        resolutionNote: entry.resolutionNote,

        reportDate: entry.reportDate,
        resolutionDate: entry.resolutionDate,

        serviceArea: entry.collector?.serviceArea || null,

        error: "Associated reporter not found",
      };
    }

    const collectorUser = entry.collector?.collector || null;

    return {
      dumpId: entry._id,

      userId: entry.reporter._id,
      userName: entry.reporter.name,
      userEmail: entry.reporter.email,
      userPhoneNumber: entry.reporter.phoneNumber,

      collectorId: entry.collector?._id || null,
      collectorName: collectorUser?.name || "N/A",
      collectorEmail: collectorUser?.email || "N/A",
      collectorPhoneNumber:
        collectorUser?.phoneNumber || "N/A",

      materials: entry.materials,

      location: entry.location,
      serviceArea: entry.collector?.serviceArea || null,

      description: entry.description,

      status: entry.status,
      rejectionReason: entry.rejectionReason,
      resolutionNote: entry.resolutionNote,

      reportDate: entry.reportDate,
      resolutionDate: entry.resolutionDate,
    };
  });
};
