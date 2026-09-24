import { Schema, model } from "mongoose";

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "REQUEST_CREATED",
        "REQUEST_ACCEPTED",
        "REQUEST_ASSIGNED",
        "REQUEST_EN_ROUTE",
        "REQUEST_COLLECTED",
        "REQUEST_REJECTED",
        "REQUEST_CANCELLED",

        "REPORT_CREATED",
        "REPORT_IN_REVIEW",
        "REPORT_RESOLVED",
        "REPORT_REJECTED",

        "REWARD_EARNED",

        "REDEMPTION_CREATED",
        "REDEMPTION_APPROVED",
        "REDEMPTION_REJECTED",
        "REDEMPTION_PAID",
        "REDEMPTION_CANCELLED",

        "ACCOUNT_DEACTIVATED",
        "ACCOUNT_REACTIVATED",
      ],
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    read: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    link: {
      type: String,
      default: null,
      trim: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Most notification queries will be:
 * "Give me this user's newest unread/read notifications."
 */
notificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

notificationSchema.index({
  recipient: 1,
  read: 1,
  createdAt: -1,
});

const Notification = model("Notification", notificationSchema);

export default Notification;