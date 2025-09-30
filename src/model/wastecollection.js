import {Schema, model} from "mongoose";

const wasteSchema = new Schema({
  user:{
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  materials:[
    {
      wasteType: {
        type: String,
        enum: ['General','Paper', 'Plastic', 'Glass', 'Metal', 'Organic', 'E-waste'],
        default: 'General',
        required: true
      },
      quantity: Number,
      unit: {
        type: String,
        enum: ['kg', 'items', 'liters'],
        default: 'kg'
      }
<<<<<<< Updated upstream
    ],
    required: true,
    validate: [val => val.length > 0, 'At least one material is required']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      
    },
    coordinates: {
      type: [Number],
    },
    address: String
  },
requestDate: {
  type: String,
  default: () => dayjs().format('YYYY-MM-DD')
}
,
=======
    }
  ],
>>>>>>> Stashed changes

  status:{
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'En Route', 'Collected'],
    default: "Pending"
  },
  rejectionReason: String,
  Reward:{ 
    type: Schema.Types.ObjectId, 
    ref: "Reward" 
  },

 collector: { 
  type:Schema.Types.ObjectId, 
  ref: 'User' 
}

}, {timestamps: true})
const Waste = model("Waste", wasteSchema)
export default Waste;