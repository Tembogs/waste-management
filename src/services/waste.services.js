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

  