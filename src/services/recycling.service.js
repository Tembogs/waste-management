import Recycling from "../model/recycling.js";
import User from "../model/user.js";

export const createRequestRequest = async (recycleData) => {
  const user = await User.findById(recycleData.userId).select("name email phoneNumber");
  if (!user) throw new Error("User not found");

  if (!recycleData.materials || !recycleData.materials.length) return null;

  const recycleRequest = new Recycling({
    user: user._id,
    materials: recycleData.materials,
    location: recycleData.location,
    recyclingDate: recycleData.collectionDate,
    status: 'Pending'
  });

  await recycleRequest.save();
  return recycleRequest;
};


export const getAllRecycleEntries = async () => {
  const recycleEntries = await Recycling.find().populate('user', 'name email phoneNumber');
  return recycleEntries;
}

export const getRecycleEntryById = async (id) => {
  const recycleEntry = await Recycling.findById(id).populate('user', 'name email phoneNumber');
  return recycleEntry;
}

export const getRecycleStatus = async (userId) => {
  const requestEntry = await Recycling.find({ user: userId }).populate('user', 'name email phoneNumber');

  if (!requestEntry || requestEntry.length === 0) {
    throw new Error('Recycle request not found or access denied.');
  }
  return  requestEntry.map(entry => ({
    name: entry.user.name,
    email: entry.user.email,
    phoneNumber: entry.user.phoneNumber,
    materials: entry.materials,
    status: entry.status,
    requestDate: entry.requestDate,
  }))
};

export const deleteReycleEntry = async (id) => {
  const recycleEntry = await Recycling.findByIdAndDelete(id);
  return recycleEntry;
}

export const updateRecycle = async (id, updateData) => { 
  const allowedUpdates = ['materials', 'collectionDate', 'notes', 'images', "location"];
  const updates = {};

  for (const key in updateData) {
    if (allowedUpdates.includes(key)) {
      updates[key] = updateData[key];
    }
  }

  const recycleEntry = await Recycling.findByIdAndUpdate(id, { $set: updates }, { new: true });
  return recycleEntry;
}




  