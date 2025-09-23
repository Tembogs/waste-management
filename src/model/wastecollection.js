import {Schema, model} from "mongoose";

const wasteSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  materials: {
    type: [
      {
        wasteType: {
          type: String,
          enum: ['General', 'Paper', 'Plastic', 'Glass', 'Metal', 'Organic', 'E-waste'],
          default: 'General',
          required: true
        },
        quantity: Number,
        unit: {
          type: String,
          enum: ['kg', 'items', 'liters'],
          default: 'kg'
        }
      }
    ],
    required: true,
    validate: [val => val.length > 0, 'At least one material is required']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      
    },
    coordinates: {
      type: [Number],
    },
    address: String
  },
  collectionDate: {
    type: Date,
  },
  notes: String,
  images: [String],
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'En Route', 'Collected'],
    default: "Pending",
    index: true
  },
  rejectionReason: String,
  collector: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }
}, { timestamps: true });
const Waste = model("Waste", wasteSchema)
export default Waste;