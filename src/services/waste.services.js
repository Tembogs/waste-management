import Waste from "../model/wastecollection.js";
import User from "../model/user.js";
import { sendEmail } from "./email.services.js";


export const createWasteRequest = async (wasteData) => {
  const user = await User.findById(wasteData.userId).select("name email phoneNumber");
  if (!user) throw new Error("User not found");

  if (!wasteData.materials || !wasteData.materials.length) return null;

  const wasteRequest = new Waste({
    user: user._id,
    materials: wasteData.materials,
    location: wasteData.location,
    requestDate: wasteData.requestDate,
    notes: wasteData.notes,
    images: wasteData.images,
    status: wasteData.status
  });

  await wasteRequest.save();

  // 🧾 Format material summary
  const materialSummary = wasteData.materials.map((item, index) => {
    return `${index + 1}. ${item.quantity} ${item.unit} of ${item.wasteType}`;
  }).join('<br>');

  // 📧 Email to user
  const subject = "New Waste Product Request 🚮🗑️";
  const html = `
    <h1>Hi ${user.name},</h1>
    <p>Thank you for submitting your waste request. Here's a summary of your materials:</p>
    <p>${materialSummary}</p>
    <p>Status: <strong>${wasteRequest.status}</strong></p>
    <p>We'll notify you once a collector is assigned.</p>
  `;
  try {
  await sendEmail(user.email, subject, html);
} catch (error) {
  console.error('Email sending failed:', error.message);
}
  return wasteRequest;
};


export const getAllWasteEntries = async () => {
  const wasteEntries = await Waste.find().populate('user', 'name email phoneNumber');
  return wasteEntries;
}

export const getWasteEntryById = async (id) => {
  const wasteEntry = await Waste.findById(id).populate('user', 'name email phoneNumber');

  if (!wasteEntry || !wasteEntry.materials) {
    throw new Error("Waste entry or materials not found.");
  }

  // 🧾 Format material summary
  const materialSummary = wasteEntry.materials.map((item, index) => {
    return `${index + 1}. ${item.quantity} ${item.unit} of ${item.wasteType}`;
  }).join('<br>');

  // 📧 Email to user
  const subject = "Waste Product Request 🚮🗑️";
  const html = `
    <h1>Hi ${wasteEntry.user.name} 👋</h1>
    <p>Thanks for submitting another waste request! ♻️ We're thrilled to see your continued commitment to a cleaner environment 🌍.</p>
    <p>Here’s a quick summary of your latest request:</p>
    <p>${materialSummary}</p>
    <p>Status: <strong>${wasteEntry.status} ⏳</strong></p>
    <p>🛠 Our team is reviewing your request and will notify you once a collector is assigned.</p>
    <p>If you have any updates or questions, feel free to reply to this email 📩.</p>
    <p>You're making a difference—thank you for being part of the solution 💚!</p>
  `;
  await sendEmail(wasteEntry.user.email, subject, html);

  return wasteEntry;
};

export const getWasteStatus = async (userId) => {
  const wasteEntries = await Waste.find({ user: userId }).populate('user', 'name email phoneNumber');

  if (!wasteEntries || wasteEntries.length === 0) {
    throw new Error('No waste requests found for this user.');
  }

  // 🧾 Format material summary
   const latestEntry = wasteEntries[0];

  const materialSummary = latestEntry.materials.map((item, index) => {
    return `${index + 1}. ${item.quantity} ${item.unit} of ${item.wasteType}`;
  }).join('<br>');

  // 📧 Email to user
  const subject = "Waste Product Status Request 🚮🗑️";
  const html = `
    <h1>Hi ${latestEntry.user.name} 👋</h1>
    <p>Thanks for submitting another waste request! ♻️ We're thrilled to see your continued commitment to a cleaner environment 🌍.</p>
    <p>Here’s a quick summary of your latest request:</p>
    <p>${materialSummary}</p>
    <p>Status: <strong>${latestEntry.status} ⏳</strong></p>
    <p>🛠 Our team is reviewing your request and will notify you once a collector is assigned.</p>
    <p>If you have any updates or questions, feel free to reply to this email 📩.</p>
    <p>You're making a difference—thank you for being part of the solution 💚!</p>
  `;
  await sendEmail(latestEntry.user.email, subject, html);

  return wasteEntries.map(entry => ({
    name: entry.user.name,
    email: entry.user.email,
    phoneNumber: entry.user.phoneNumber,
    materials: entry.materials,
    status: entry.status,
    requestDate: entry.requestDate,
  }));
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




  