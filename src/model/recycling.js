import {Schema, model} from "mongoose";

const recyclingSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  materials:[
    {
      type: { 
        type: String, 
         enum: ['General','Paper', 'Plastic', 'Glass', 'Metal', 'Organic', 'E-waste'], 
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
  pointsEarned: { 
    type: Number, 
    default: 0 },
  recyclingDate: { 
    type: Date, 
    default: Date.now
  },
  location: String
})
const Recycling = model("Recycling", recyclingSchema)
export default Recycling;
