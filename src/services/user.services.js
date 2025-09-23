import User from "../model/user.js";
// import Waste from "../model/wastecollection.js";

export const createUser = async (name, email, password,phoneNumber, role, location, profilePicture) => {
  const user = new User({
    name,
    email,
    password,
    phoneNumber,
    role,
    location,
    profilePicture
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
export const updateUser = async(id, updateInfo) => {
  const user = await User.findByIdAndUpdate(id, updateInfo, {new: true})
  return user;
}

