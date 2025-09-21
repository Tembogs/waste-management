import { Schema,model } from "mongoose";


const illegalDumpSchema = new Schema({
  reporter: {
    type: Schema.Types.ObjectId,
    ref: "Houser",
    required: true
  },
  
  location: {
    type: String,
    required: true
  },
  
  description: String,
  
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
})
const IllegalDump = model("IllegalDump", illegalDumpSchema)
export default IllegalDump;