import { Schema, model } from "mongoose";

const collectorAssaySchema = new Schema(
  {
    collector: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    serviceArea: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    totalQuantityCollected: {
      type: Number,
      default: 0,
      min: 0,
    },

    acceptedRequests: {
      type: Number,
      default: 0,
      min: 0,
    },

    rejectedRequests: {
      type: Number,
      default: 0,
      min: 0,
    },

    collectionStats: [
      {
        category: {
          type: String,
          enum: ["waste", "recycle"],
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

const CollectorAssay = model("CollectorAssay", collectorAssaySchema);

export default CollectorAssay;