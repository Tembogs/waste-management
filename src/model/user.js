import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    phoneNumber: {
      type: Number,
      required: true,
      unique: true,
    },

    bio: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["Houser", "Collector", "Community_admin"],
      default: "Houser",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },

    profilePicture: {
      type: String,
      default: "https://res.cloudinary.com/...",
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Other",
      required: true,
    },

    totalWasteCollected: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalRecyclingCollected: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalIllegalDumpReports: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRewardPointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },

    rewardPointsBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    rewardPointsReserved: {
      type: Number,
      default: 0,
      min: 0,
    },
    requestStats: [
      {
        category: {
          type: String,
          enum: ["waste", "recycle", "illegal"],
          required: true,
        },

        material: {
          type: String,
          enum: [
            "General",
            "Paper",
            "Plastic",
            "Glass",
            "Metal",
            "Organic",
            "E-waste",
          ],
          required: true,
        },

        quantityCollected: {
          type: Number,
          default: 0,
          min: 0,
        },

        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = model("User", userSchema);

export default User;