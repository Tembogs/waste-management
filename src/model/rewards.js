import { Schema, model } from "mongoose";

export const rewardSchema = new Schema({
  user:{
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  points:[
    {
      pointsEarned: { 
        type: Number, 
        default: 0 
      },
      pointsRedeemed: { 
        type: Number, 
        default: 0 
      },
      rewardItem: String, // Optional: name of item or benefit redeemed
      redeemedAt: Date,
    }
  ],
  lastUpdated:{
    type:Date,
    default:Date.now
  },
  status: {
    type: String,
    enum: ['Earned', 'Redeemed', 'Expired'],
    default: 'Earned'
  },
  activityType: {
    type: String,
    enum: ['Recycling', 'WasteRequest', 'IllegalDumpReport'],
    required: true
  }
})
const Reward = model("Reward", rewardSchema)
export default Reward;