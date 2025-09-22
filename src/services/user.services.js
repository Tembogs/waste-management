import User from "../model/user.js";
import Waste from "../model/wastecollection.js";

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

export const createWasteRequest = async (user, materials, collector) => {
  const wasteRequest = new Waste({
    user,
    materials,
    collector,
    status: 'Pending'
  });

  await wasteRequest.save();
  return wasteRequest;
};

export const getAllWasteEntries = async () => {
  const wasteEntries = await Waste.find().populate('user', 'name email phoneNumber location');
  return wasteEntries;
}
export const getWasteEntryById = async (id) => {
  const wasteEntry = await Waste.findById(id).populate('user', 'name email phoneNumber location');
  return wasteEntry;
}