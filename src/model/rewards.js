import { Schema, model } from "mongoose";

const rewardSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    collector: {
      type: Schema.Types.ObjectId,
      ref: "CollectorAssay",
      default: null,
    },

    sourceRequest: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "sourceType",
    },

    sourceType: {
      type: String,
      required: true,
      enum: ["Waste", "Recycling", "IllegalDump"],
    },

    pointsEarned: {
      type: Number,
      required: true,
      min: 0,
    },

    rewardItem: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["Earned", "Cancelled"],
      default: "Earned",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent one request from generating multiple rewards
rewardSchema.index(
  {
    sourceRequest: 1,
    sourceType: 1,
  },
  {
    unique: true,
  }
);

const Reward = model("Reward", rewardSchema);

export default Reward;