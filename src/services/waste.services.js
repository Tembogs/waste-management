import Waste from "../model/wastecollection.js";
import User from "../model/user.js";

export const createWasteRequest = async (wasteData) => {
  const user = await User.findById(wasteData.userId).select("name email phoneNumber");
  if (!user) throw new Error("User not found");

  if (!wasteData.materials || !wasteData.materials.length) return null;

  const wasteRequest = new Waste({
    user: user._id,
    materials: wasteData.materials,
    location: wasteData.location,
    collectionDate: wasteData.collectionDate,
    notes: wasteData.notes,
    images: wasteData.images,
    status: 'Pending'
  });

  await wasteRequest.save();
  return wasteRequest;
};


export const getAllWasteEntries = async () => {
  const wasteEntries = await Waste.find().populate('user', 'name email phoneNumber');
  return wasteEntries;
}

export const getWasteEntryById = async (id) => {
  const wasteEntry = await Waste.findById(id).populate('user', 'name email phoneNumber');
  return wasteEntry;
}

export const getWasteStatus = async (wasteId, userId) => {
  const wasteEntry = await Waste.findOne({ _id: wasteId, user: userId });

  if (!wasteEntry) {
    throw new Error('Waste request not found or access denied.');
  }

  return {
    status: wasteEntry.status,
    collectionDate: wasteEntry.collectionDate,
    rejectionReason: wasteEntry.rejectionReason || null,
    notes: wasteEntry.notes || null,
  };
};


export const deleteWasteEntry = async (id) => {
  const wasteEntry = await Waste.findByIdAndDelete(id);
  return wasteEntry;
}

export const updatewaste = async (id, updateData) => { 
  const allowedUpdates = ['materials', 'collectionDate', 'notes', 'images', "location"];
  const updates = {};

  for (const key in updateData) {
    if (allowedUpdates.includes(key)) {
      updates[key] = updateData[key];
    }
  }

  const wasteEntry = await Waste.findByIdAndUpdate(id, { $set: updates }, { new: true });
  return wasteEntry;
}




  