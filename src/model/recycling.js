import {Schema, model} from "mongoose";

const recyclingSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "Houser",
    required: true
  },
  materials:[
    {
      type: { 
        type: String,
        enum: ['General','Paper', 'Plastic', 'Glass', 'Metal', 'Organic', 'E-waste'], 
        default: 'General', 
        quantity: Number, 
        unit: 'kg', 
        required: true 
      },
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
})
const Recycling = model("Recycling", recyclingSchema)
export default Recycling;
