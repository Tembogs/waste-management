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

export const uploadProfilePicture = async (id, profilePictureUrl) => {
  const user = await User.findByIdAndUpdate(id, { profilePicture: profilePictureUrl }, { new: true });
  return user;
}


