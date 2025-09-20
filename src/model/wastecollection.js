import {Schema, model} from "mongoose";

const wasteSchema = new Schema({
  user:{
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
        default: 'kg' }
    }
  ],

  status:{
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'En Route', 'Collected'],
    default: "Pending"
  },

 collector: { 
  type:Schema.Types.ObjectId, 
  ref: 'User' 
}

})
const Waste = model("Waste", wasteSchema)
export default Waste;