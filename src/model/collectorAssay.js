import dayjs from "dayjs";
import { Schema, model } from "mongoose";

const collectorAssaySchema = new Schema({
  collector: {
    type: Schema.Types.ObjectId,
    ref: "User", 
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  assayDate: {
    type: String,
    default: () => dayjs().format('YYYY-MM-DD')
  },
  status: {
    type: String,
    enum: ['Accepted', 'Rejected', 'En Route', 'Collected'],
    default: "Rejected"
  },
  rejectionReason: {
    type: String,
    maxlength: 500
  },
  totalQuantityCollected: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  acceptedRequests: {
    type: Number,
    default: 0,
    min: 0
  },
  rejectedRequests: {
    type: Number,
    default: 0,
    min: 0
  },
  collectionStats: [
    {
      wasteType: {
        type: String,
        enum: ['General', 'Paper', 'Plastic', 'Glass', 'Metal', 'Organic', 'E-waste'],
        default: 'General',
        required: true
      },
      quantityCollected: {
        type: Number,
        default: 0,
        min: 0
      },
      updatedAt: {
        type: Date,
        default: () => dayjs().format('DD-MM-YYYY')
      }
    },
    {
      recycleType: {
        type: String,
        enum: ['General', 'Paper', 'Plastic', 'Glass', 'Metal', 'Organic', 'E-waste'],
        default: 'General',
        required: true
      },
      quantityCollected: {
        type: Number,
        default: 0,
        min: 0
      },
      updatedAt: {
        type: Date,
        default:() => dayjs().format('DD-MM-YYYY')
      }
    }
  ],
  materials: [
    {
      wasteType: {
        type: String,
        enum: ['General', 'Paper', 'Plastic', 'Glass', 'Metal', 'Organic', 'E-waste'],
        required: true
      },
      quantityExpected: {
        type: Number,
        min: 0
      }
    }
  ],
  serviceArea: {
    type: String
  },
   collectionDate: {
    type: String,
    default: () => dayjs().format('YYYY-MM-DD')
  }
}, { timestamps: true });

// Indexes for performance
collectorAssaySchema.index({ user: 1 });
collectorAssaySchema.index({ assayDate: -1 });

const CollectorAssay = model("CollectorAssay", collectorAssaySchema);
export default CollectorAssay;