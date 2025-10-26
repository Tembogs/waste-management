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
    bio:String,
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
    Reward: {
      type: Number,
      default: 0
    },
    requestStats: [
        {
          category: {
            type: String,
            enum: ["waste", "recycle", "illegal"],
          },
          material: {
            type: String,
            enum: ["General", "Paper", "Plastic", "Glass", "Metal", "Organic", "E-waste"],
          },
          quantityCollected: {
            type: Number,
            default: 0,
            min: 0
          },
          updatedAt: {
            type: Date,
            default: Date.now
          }
        }
      ],
      Waste: {
          type: Number,
          default: 0
        },
    Recycling: {
      type: Number,
      default: 0
        },
    Dump: {
      type: Number,
      default: 0
    },

    createdAt:{
        type: Date,
        default: Date.now
      }

}, {timestamps: true})
const User = model("User", userSchema)
export default User;