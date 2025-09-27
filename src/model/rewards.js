import { Schema, model } from "mongoose";

export const rewardSchema = new Schema({
  user:{
    type: Schema.Types.ObjectId,
    ref: "User",
  },
   collector:{
    type: Schema.Types.ObjectId,
    ref: "CollectorAssay",
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  rewardItem: String,
  status: {
    type: String,
    default: 'Earned'
  },
  activityType: {
    type: String,
    enum: ['Recycling', 'WasteRequest', 'IllegalDumpReport'],
    required: true
  }
}, {timestamps: true})
const Reward = model("Reward", rewardSchema)
export default Reward;