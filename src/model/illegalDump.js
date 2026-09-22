import { Schema, model } from "mongoose";

const illegalDumpSchema = new Schema(
  {
    reporter: {
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

    location: {
      type: String,
      required: true,
      trim: true,
    },

    materials: [
      {
        dumpType: {
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

        unit: {
          type: String,
          enum: ["kg", "items", "liters"],
          default: "kg",
        },
      },
    ],

    description: {
      type: String,
      required: true,
      trim: true,
    },

    images: {
      type: String,
    },

    reportDate: {
      type: Date,
      default: Date.now,
    },

    resolutionDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "InReview",
        "Rejected",
        "Resolved",
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

    resolutionNote: {
      type: String,
      maxlength: 500,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const IllegalDump = model("IllegalDump", illegalDumpSchema);

export default IllegalDump;