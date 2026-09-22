import { Schema, model } from "mongoose";

const rewardRedemptionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    points: {
      type: Number,
      required: true,
      min: 1,
    },

    cashValue: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
        "Paid",
        "Cancelled",
      ],
      default: "Pending",
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: [
        "BankTransfer",
        "Airtime",
        "Data",
        "Voucher",
      ],
      default: "BankTransfer",
    },

    accountName: {
      type: String,
      trim: true,
      default: null,
    },

    accountNumber: {
      type: String,
      trim: true,
      default: null,
    },

    bankName: {
      type: String,
      trim: true,
      default: null,
    },

    rejectionReason: {
      type: String,
      maxlength: 500,
      default: null,
    },

    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const RewardRedemption = model(
  "RewardRedemption",
  rewardRedemptionSchema
);

export default RewardRedemption;