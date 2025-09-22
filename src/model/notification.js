import {Schema, model} from "mongoose";

const notificationSchema = new Schema ({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  collector: {
    type: Schema.Types.ObjectId,
    ref:'User',
  },
  message: {
    type:String,
    required:true
  },
  date:{
    type: Date,
    default:Date.now
  },
  read:{
    type:Boolean,
    default:false
  },
  type:{
    type:String,
    enum:[
      'CollectionUpdate',
      'NewRequest',
      'Announcement',
      'Reminder',
      'RewardEarned',
      'IllegalDumpReport',
      'AdminAlert'
],
    default:'NewRequest'
  },
}, {timestamps: true})
const Notification = model("Notification", notificationSchema)
export default Notification;