import {Schema, model} from "mongoose";

const collectorAssaySchema = new Schema({
  collector: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  assayDate: {
    type: Date,
    default: Date.now
  },
  totalCollected: {
    type: Number,
    required: true,
    default: 0
  },
  acceptedRequests: { 
    type: Number, 
    default: 0 
  },
  rejectedRequests: { 
    type: Number, 
    default: 0 
  },
  collectionStats: [
    {
      wasteType: { 
        type: String, 
        enum: ['general', 'paper', 'plastic', 'glass', 'metal', 'organic', 'e-waste'] 
      },
      quantityCollected: Number,
      lastCollectedAt: Date
    }
  ],
   serviceArea: String
})
const CollectorAssay = model("CollectorAssay", collectorAssaySchema)
export default CollectorAssay;