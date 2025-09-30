import User from "../model/user.js";

export const createUser = async (name, email, password,phoneNumber, role, location,gender) => {
  const user = new User({
    name,
    email,
    password,
    phoneNumber,
    role,
    location,
    gender
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
 export const signOutUser = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new Error("User not found");
  } 
}
