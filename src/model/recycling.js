import {Schema, model} from "mongoose";
import dayjs from "dayjs";
const recyclingSchema = new Schema({
  collector: {
      type: Schema.Types.ObjectId,
      ref: 'CollectorAssay',
      index: true
    },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  materials:[
    {
       recycleType: {
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
  images: String,
  recyclingDate: {
      type: Date,
      default: () => dayjs().format('YYYY-MM-DD')
    },
  status:{
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'En Route', 'Collected'],
    default: "Pending"
    },
  location: String,
   Reward:{ 
      type: Schema.Types.ObjectId, 
      ref: "Reward" 
    },
    rejectionReason: String,
}, {timestamps: true})
const Recycling = model("Recycling", recyclingSchema)
export default Recycling;
