import { Schema, model } from "mongoose";

const wasteSchema = new Schema(
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
      index: true,
    },

    materials: [
      {
        wasteType: {
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
    address:{
      type: String,
      required:false
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
      default: null,
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

const Waste = model("Waste", wasteSchema);

export default Waste;