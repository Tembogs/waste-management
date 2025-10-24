import CollectorAssay from "../model/collectorAssay.js";
import User from "../model/user.js";


export const createUser = async (name, email, password,phoneNumber, role, location,gender, profilePicture,bio) => {
  const user = new User({
    name,
    email,
    password,
    phoneNumber,
    role,
    location,
    gender,
    profilePicture,
    bio
  })
  await user.save();
  return user;
}

export const getAllUsers = async () => {
  const user = await User.find()
  return user;
}

export const getUserbyId = async (id) => {
  const user = await User.findById(id)
  return user;
}
export  const deleteUser =  async (id) => {
  const user = await User.findByIdAndDelete(id)
  return user;
}

export const deleteAllUser = async () =>{
  const user = await User.deleteMany()
  return user
}
export const updateUser = async (id, updateInfo) => {
  // Find the user
  let user = await User.findById(id);
  if (!user) throw new Error("User not found");

  // If the user is a Collector, sync collector data
  if (user.role === "Collector") {
    // Check if collectorAssay already exists for this user
    let collectorAssay = await CollectorAssay.findOne({ collector: user._id });

    if (collectorAssay) {
      // Update existing record
      collectorAssay.serviceArea = updateInfo.location || collectorAssay.serviceArea;
      await collectorAssay.save();
    } else {
      // Create a new record if none exists
      collectorAssay = new CollectorAssay({
        user: user._id,
        collector: user._id,
        serviceArea: updateInfo.location,
      });
      await collectorAssay.save();
    }
  }

  // Update the user itself
  const updatedUser = await User.findByIdAndUpdate(id, updateInfo, { new: true });
  return updatedUser;
};


export const signOutUser = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new Error("User not found");
  } 
}

export const uploadProfilePicture = async (id, profilePictureUrl) => {
  const user = await User.findByIdAndUpdate(id, { profilePicture: profilePictureUrl }, { new: true });
  return user;
}


