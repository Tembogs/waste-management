import {Schema, model} from "mongoose";

const recyclingSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
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
  recyclingDate: { 
    type: Date, 
    default: Date.now
  },
   status:{
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'En Route', 'Collected'],
    default: "Pending"
  },
  location: String
}, {timestamps: true})
const Recycling = model("Recycling", recyclingSchema)
export default Recycling;
