import{Schema, model} from 'mongoose';

const userSchema = new Schema({
  name :{
      type: String,
      required: true
    },
  email: {
      type:String,
      required: true,
      unique: true
    },
  password:{
      type : String,
      required: true
    },
  phoneNumber:{
      type:Number,
      required:true,
      unique: true
    },
  role:{
      type:String,
      enum:["Houser", "Collector", "Community_admin"],
      default:"Houser"
    },

  location: {
      type:String,
      required: true
    },
  profilePicture: {
      type: String,
      default: 'https://yourdomain.com/default-profile.png'
    },
    gender:{
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Other",
      required: true
    },
    materials: [
      {
        type: String,
        enum: ['General','Paper', 'Plastic', 'Glass', 'Metal', 'Organic', 'E-waste'],
        default: 'General'
      }
    ],
}, {timestamps: true})
const User = model("User", userSchema)
export default User;