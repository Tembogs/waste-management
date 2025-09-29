import { Schema,model } from "mongoose";
import dayjs from "dayjs";


const illegalDumpSchema = new Schema({
  reporter: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  location: {
    type: String,
    required: true
  },
  materials:[
    {
      wasteType: {
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
  photos: [String],
  
  reportDate: {
     type: String,
    default: () => dayjs().format('YYYY-MM-DD')
  },

  status: {
    type: String,
    enum: ['Pending', 'In Review', 'Resolved'],
    default: 'Pending'
  },
   Reward:{ 
      type: Schema.Types.ObjectId, 
      ref: "Reward" 
    },
}, {timestamps: true})
const IllegalDump = model("IllegalDump", illegalDumpSchema)
export default IllegalDump;