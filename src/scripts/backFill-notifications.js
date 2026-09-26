import dotenv from "dotenv";
import mongoose from "mongoose";
import Notification from "../model/Notification.js";
import Waste from "../model/wastecollection.js";
import Recycling from "../model/recycling.js";
import IllegalDump from "../model/illegalDump.js";


dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const createBackfillNotification = async ({
  recipient,
  type,
  title,
  message,
  link,
  metadata,
}) => {
  if (!recipient) return;

  // Prevent duplicate backfill notifications
  const existing = await Notification.findOne({
    recipient,
    type,
    "metadata.backfill": true,
    "metadata.requestId": metadata?.requestId,
    "metadata.redemptionId": metadata?.redemptionId,
    "metadata.rewardId": metadata?.rewardId,
  });

  if (existing) {
    return;
  }

  await Notification.create({
    recipient,
    type,
    title,
    message,
    link,
    metadata: {
      ...metadata,
      backfill: true,
    },
  });
};

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected");

    let created = 0;

    // =========================================================
    // WASTE
    // =========================================================

    const wastes = await Waste.find({})
      .select("_id user status createdAt collectionDate rejectionReason")
      .lean();

    for (const waste of wastes) {
      if (!waste.user) continue;

      if (waste.status === "Pending") {
        await createBackfillNotification({
          recipient: waste.user,
          type: "REQUEST_CREATED",
          title: "Waste Request",
          message: "Your waste collection request is currently pending.",
          link: `/dashboard/waste/${waste._id}`,
          metadata: {
            requestId: waste._id,
            requestType: "Waste",
          },
        });

        created++;
      }

      if (waste.status === "Accepted") {
        await createBackfillNotification({
          recipient: waste.user,
          type: "REQUEST_ACCEPTED",
          title: "Waste Request Accepted",
          message: "Your waste collection request has been accepted.",
          link: `/dashboard/waste/${waste._id}`,
          metadata: {
            requestId: waste._id,
            requestType: "Waste",
          },
        });

        created++;
      }

      if (waste.status === "En Route") {
        await createBackfillNotification({
          recipient: waste.user,
          type: "REQUEST_EN_ROUTE",
          title: "Collector Is On The Way",
          message: "Your waste collection request is currently en route.",
          link: `/dashboard/waste/${waste._id}`,
          metadata: {
            requestId: waste._id,
            requestType: "Waste",
          },
        });

        created++;
      }

      if (waste.status === "Collected") {
        await createBackfillNotification({
          recipient: waste.user,
          type: "REQUEST_COLLECTED",
          title: "Waste Collected",
          message: "Your waste collection request has been collected.",
          link: `/dashboard/waste/${waste._id}`,
          metadata: {
            requestId: waste._id,
            requestType: "Waste",
            collectionDate: waste.collectionDate,
          },
        });

        created++;
      }

      if (waste.status === "Rejected") {
        await createBackfillNotification({
          recipient: waste.user,
          type: "REQUEST_REJECTED",
          title: "Waste Request Rejected",
          message: waste.rejectionReason
            ? `Your waste collection request was rejected. Reason: ${waste.rejectionReason}`
            : "Your waste collection request was rejected.",
          link: `/dashboard/waste/${waste._id}`,
          metadata: {
            requestId: waste._id,
            requestType: "Waste",
            rejectionReason: waste.rejectionReason || null,
          },
        });

        created++;
      }

      if (waste.status === "Cancelled") {
        await createBackfillNotification({
          recipient: waste.user,
          type: "REQUEST_CANCELLED",
          title: "Waste Request Cancelled",
          message: "Your waste collection request was cancelled.",
          link: `/dashboard/waste/${waste._id}`,
          metadata: {
            requestId: waste._id,
            requestType: "Waste",
          },
        });

        created++;
      }
    }

    // =========================================================
    // RECYCLING
    // =========================================================

    const recyclingRequests = await Recycling.find({})
      .select("_id user status createdAt collectionDate rejectionReason")
      .lean();

    for (const recycle of recyclingRequests) {
      if (!recycle.user) continue;

      if (recycle.status === "Pending") {
        await createBackfillNotification({
          recipient: recycle.user,
          type: "REQUEST_CREATED",
          title: "Recycling Request",
          message: "Your recycling collection request is currently pending.",
          link: `/dashboard/recycle/${recycle._id}`,
          metadata: {
            requestId: recycle._id,
            requestType: "Recycling",
          },
        });

        created++;
      }

      if (recycle.status === "Accepted") {
        await createBackfillNotification({
          recipient: recycle.user,
          type: "REQUEST_ACCEPTED",
          title: "Recycling Request Accepted",
          message: "Your recycling collection request has been accepted.",
          link: `/dashboard/recycle/${recycle._id}`,
          metadata: {
            requestId: recycle._id,
            requestType: "Recycling",
          },
        });

        created++;
      }

      if (recycle.status === "En Route") {
        await createBackfillNotification({
          recipient: recycle.user,
          type: "REQUEST_EN_ROUTE",
          title: "Collector Is On The Way",
          message: "Your recycling collection request is currently en route.",
          link: `/dashboard/recycle/${recycle._id}`,
          metadata: {
            requestId: recycle._id,
            requestType: "Recycling",
          },
        });

        created++;
      }

      if (recycle.status === "Collected") {
        await createBackfillNotification({
          recipient: recycle.user,
          type: "REQUEST_COLLECTED",
          title: "Recycling Collected",
          message: "Your recycling request has been successfully collected.",
          link: `/dashboard/recycle/${recycle._id}`,
          metadata: {
            requestId: recycle._id,
            requestType: "Recycling",
            collectionDate: recycle.collectionDate,
          },
        });

        created++;
      }

      if (recycle.status === "Rejected") {
        await createBackfillNotification({
          recipient: recycle.user,
          type: "REQUEST_REJECTED",
          title: "Recycling Request Rejected",
          message: recycle.rejectionReason
            ? `Your recycling request was rejected. Reason: ${recycle.rejectionReason}`
            : "Your recycling request was rejected.",
          link: `/dashboard/recycle/${recycle._id}`,
          metadata: {
            requestId: recycle._id,
            requestType: "Recycling",
            rejectionReason: recycle.rejectionReason || null,
          },
        });

        created++;
      }

      if (recycle.status === "Cancelled") {
        await createBackfillNotification({
          recipient: recycle.user,
          type: "REQUEST_CANCELLED",
          title: "Recycling Request Cancelled",
          message: "Your recycling request was cancelled.",
          link: `/dashboard/recycle/${recycle._id}`,
          metadata: {
            requestId: recycle._id,
            requestType: "Recycling",
          },
        });

        created++;
      }
    }

    // =========================================================
    // ILLEGAL DUMP
    // =========================================================

    const illegalDumps = await IllegalDump.find({})
      .select("_id user status createdAt rejectionReason resolutionDate")
      .lean();

    for (const report of illegalDumps) {
      if (!report.user) continue;

      if (report.status === "Pending") {
        await createBackfillNotification({
          recipient: report.user,
          type: "REPORT_CREATED",
          title: "Illegal Dump Report",
          message: "Your illegal dumping report is currently pending.",
          link: `/dashboard/illegal-dumps/${report._id}`,
          metadata: {
            requestId: report._id,
            requestType: "IllegalDump",
          },
        });

        created++;
      }

      if (report.status === "InReview") {
        await createBackfillNotification({
          recipient: report.user,
          type: "REPORT_IN_REVIEW",
          title: "Report Under Review",
          message: "Your illegal dumping report is currently under review.",
          link: `/dashboard/illegal-dumps/${report._id}`,
          metadata: {
            requestId: report._id,
            requestType: "IllegalDump",
          },
        });

        created++;
      }

      if (report.status === "Resolved") {
        await createBackfillNotification({
          recipient: report.user,
          type: "REPORT_RESOLVED",
          title: "Illegal Dump Report Resolved",
          message: "Your illegal dumping report has been resolved.",
          link: `/dashboard/illegal-dumps/${report._id}`,
          metadata: {
            requestId: report._id,
            requestType: "IllegalDump",
            resolutionDate: report.resolutionDate,
          },
        });

        created++;
      }

      if (report.status === "Rejected") {
        await createBackfillNotification({
          recipient: report.user,
          type: "REPORT_REJECTED",
          title: "Illegal Dump Report Rejected",
          message: report.rejectionReason
            ? `Your illegal dumping report was rejected. Reason: ${report.rejectionReason}`
            : "Your illegal dumping report was rejected.",
          link: `/dashboard/illegal-dumps/${report._id}`,
          metadata: {
            requestId: report._id,
            requestType: "IllegalDump",
            rejectionReason: report.rejectionReason || null,
          },
        });

        created++;
      }

      if (report.status === "Cancelled") {
        await createBackfillNotification({
          recipient: report.user,
          type: "REQUEST_CANCELLED",
          title: "Illegal Dump Report Cancelled",
          message: "Your illegal dumping report was cancelled.",
          link: `/dashboard/illegal-dumps/${report._id}`,
          metadata: {
            requestId: report._id,
            requestType: "IllegalDump",
          },
        });

        created++;
      }
    }

    console.log(`Backfill complete. Notifications processed: ${created}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Notification backfill failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

run();