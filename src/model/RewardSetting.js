import { Schema, model } from "mongoose";

const rewardSettingSchema = new Schema(
  {
    pointsPerUnit: {
      type: Number,
      required: true,
      min: 1,
      default: 100,
    },

    cashPerUnit: {
      type: Number,
      required: true,
      min: 0,
      default: 100,
    },

    minimumRedemptionPoints: {
      type: Number,
      required: true,
      min: 1,
      default: 1000,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const RewardSetting = model(
  "RewardSetting",
  rewardSettingSchema
);

export default RewardSetting;