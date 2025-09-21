import {Schema, model} from "mongoose";

const collectorAssaySchema = new Schema({
  collector: {
    type: Schema.Types.ObjectId,
    ref: "Collector",
    required: true
  },
  assayDate: {
    type: Date,
    default: Date.now
  },
   status:{
    type: String,
    enum: [ 'Accept', 'Reject', 'En Route', 'Collected'],
    default: "Reject"
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
        enum: ['general', 'paper', 'plastic', 'glass', 'metal', 'organic', 'e-waste'],
        default: 'general'
      },
      quantityCollected: Number,
      lastCollectedAt: Date
    }
  ],
   serviceArea: String
})
const CollectorAssay = model("CollectorAssay", collectorAssaySchema)
export default CollectorAssay;