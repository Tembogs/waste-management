import { Schema, model } from "mongoose";

const recyclingSchema = new Schema(
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
      index: true,
      default: null,
    },

    materials: [
      {
        recycleType: {
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
          default: "General",
        },

        quantity: {
          type: Number,
          required: true,
          min: 0,
        },

        collectedQuantity: {
          type: Number,
          default: null,
          min: 0,
        },

        unit: {
          type: String,
          enum: ["kg", "items", "liters"],
          default: "kg",
        },
      },
    ],

    location: {
      type: String,
      required: true,
      trim: true,
    },

    requestDate: {
      type: Date,
      default: Date.now,
    },

    collectionDate: {
      type: Date,
      default: null,
    },

    images: {
      type: String,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "Rejected",
        "En Route",
        "Collected",
        "Cancelled",
      ],
      default: "Pending",
      index: true,
    },

    rejectionReason: {
      type: String,
      maxlength: 500,
      default: null,
    },

    collectionNote: {
      type: String,
      maxlength: 500,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Recycling = model("Recycling", recyclingSchema);

export default Recycling;