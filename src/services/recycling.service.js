import Recycling from "../model/recycling.js";
import User from "../model/user.js";
import { sendEmail } from "./email.services.js";

export const createRecycleRequest = async (recycleData) => {
  try {
    const user = await User.findById(recycleData.userId).select("name email phoneNumber");
    if (!user) throw new Error("User not found");

    if (!recycleData.materials || !recycleData.materials.length) {
      console.warn("No materials provided for recycling.");
      return null;
    }

    const recycleRequest = new Recycling({
      user: user._id,
      materials: recycleData.materials,
      location: recycleData.location,
      recyclingDate: recycleData.recyclingDate,
      status: recycleData.status || "Pending"
    });

    await recycleRequest.save();

    const materialSummary = recycleData.materials.map((item, index) => {
      return `${index + 1}. ${item.quantity} ${item.unit} of ${item.wasteType}`;
    }).join('<br>');

    // 📧 Email to user
    const subject = "New Recycling Request ♻️";
    const html = `
      <h1>Hi ${user.name},</h1>
      <p>Thank you for submitting your recycling request. Here's a summary of your materials:</p>
      <p>${materialSummary}</p>
      <p><strong>Location:</strong> ${recycleRequest.location}</p>
      <p><strong>Recycle Date:</strong> ${recycleRequest.recyclingDate}</p>
      <p><strong>Status:</strong> ${recycleRequest.status}</p>
      <p>We'll notify you once a collector is assigned.</p>
    `;

    await sendEmail(user.email, subject, html);

    return recycleRequest;
  } catch (error) {
    console.error("Recycling request creation failed:", error.message);
    throw error;
  }
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




  