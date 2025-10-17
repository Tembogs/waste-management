import { Schema,model } from "mongoose";
import dayjs from "dayjs";


const illegalDumpSchema = new Schema({
 reporter: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  collector: {
        type: Schema.Types.ObjectId,
        ref: 'CollectorAssay',
        index: true
      },
  
  location: {
    type: String,
    required: true
  },
  materials:[
    {
      dumpType: {
        type: String,
        enum: ['General','Paper', 'Plastic', 'Glass', 'Metal', 'Organic', 'E-waste'],
        default: 'General',
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      unit: {
        type: String,
        enum: ['kg', 'items', 'liters'],
        default: 'kg'
      }
    }
  ],
  
  description: {
    type:String,
    required: true
  },
  Reward:{ 
      type: Schema.Types.ObjectId, 
      ref: "Reward" 
    },
  images: String,
  
  reportDate: {
     type: String,
    default: () => dayjs().format('DD-MM-YYYY')
  },

  status: {
    type: String,
    enum: ['Pending', 'InReview', "Rejected", 'Resolved'],
    default: 'Pending'
  },
   Reward:{ 
      type: Schema.Types.ObjectId, 
      ref: "Reward" 
    },
    rejectionReason: String
}, {timestamps: true})
const IllegalDump = model("IllegalDump", illegalDumpSchema)
export default IllegalDump;