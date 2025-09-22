import { Schema,model } from "mongoose";


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
  
  description: {
    type:String,
    required: true
  },
  
  photos: [String],
  
  reportDate: {
    type: Date,
    default: Date.now
  },

  status: {
    type: String,
    enum: ['Pending', 'In Review', 'Resolved'],
    default: 'Pending'
  }
}, {timestamps: true})
const IllegalDump = model("IllegalDump", illegalDumpSchema)
export default IllegalDump;