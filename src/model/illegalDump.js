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
  
  description: {
    type:String,
    required: true
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
  }
}, {timestamps: true})
const IllegalDump = model("IllegalDump", illegalDumpSchema)
export default IllegalDump;