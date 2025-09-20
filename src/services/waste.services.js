import {Waste} from "../model/wastecollection.js";

export const createWasteEntry = async (user, wasteType, quantity, collectionDate, location) => {
  const wasteEntry = new Waste({
    user,
    wasteType,
    quantity,
    collectionDate,
    location
  });
  await wasteEntry.save();
  return wasteEntry;
}
export const getAllWasteEntries = async () => {
  const wasteEntries = await Waste.find().populate('user', 'name email phoneNumber location');
  return wasteEntries;
}
export const getWasteEntryById = async (id) => {
  const wasteEntry = await Waste.findById(id).populate('user', 'name email phoneNumber location');
  return wasteEntry;
}
  