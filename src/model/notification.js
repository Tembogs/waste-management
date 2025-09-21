import {Schema, model} from "mongoose";

const notificationSchema = new Schema ({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'Houser',
  },
  collector: {
    type: Schema.Types.ObjectId,
    ref:'Collector',
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
})
const Notification = model("Notification", notificationSchema)
export default Notification;