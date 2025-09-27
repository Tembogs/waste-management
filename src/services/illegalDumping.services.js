import IllegalDump from "../model/illegalDump.js";
import User from "../model/user.js";
import { sendEmail } from "./email.services.js";


export const reportIllegalDump = async (illegalData) => {
  try {
    const user = await User.findById(illegalData.userId).select("name email phoneNumber");
    if (!user) throw new Error("User not found");

    const illegalRequest = new IllegalDump({
      location: illegalData.location,
      reporter: user._id,
      description: illegalData.description,
      status: illegalData.status || "Pending",
      reportDate: new Date()
    });

    await illegalRequest.save();

    const materialSummary = illegalData.materials.map((item, index) => {
      return `${index + 1}. ${item.quantity} ${item.unit} of ${item.wasteType}`;
    }).join('<br>');

    // 📧 Email to user
    const subject = "🚨 Illegal Dump Report Received";
    const html = `
      <h1>Hello ${user.gender === "Male" ? "Mr" : user.gender === "Female" ? "Mrs/Miss" : 'Mx'} ${user.name},</h1>
      <p>Thanks for reporting an illegal dumping incident. Here's what we received:</p>
      <p><strong>Location:</strong> ${illegalRequest.location}</p>
      <p><strong>Description:</strong> ${illegalRequest.description}</p>
      <p><strong>Materials:</strong><br>${materialSummary}</p>
      <p><strong>Status:</strong> ${illegalRequest.status}</p>
      <p><em>Reported on: ${illegalRequest.reportDate.toLocaleString()}</em></p>
      <p>We'll notify you once a collector is assigned.</p>
    `;

    await sendEmail(user.email, subject, html);
    console.log(`Email sent to ${user.email}`);

    return illegalRequest;
  } catch (error) {
    console.error("Illegal dump report failed:", error.message);
    throw error;
  }
};

export const getAllIllegalEntries = async () => {
  const IllegalEntries = await IllegalDump.find().populate('user', 'name email phoneNumber');
  return IllegalEntries;
}

export const getIllegalEntryById = async (id) => {
  const IllegalEntry = await IllegalDump.findById(id).populate('user', 'name email phoneNumber');
  return IllegalEntry;
}

export const updateIllegalEntryById = async (id, status) => {
  const illegalEntry = await IllegalDump.findByIdAndUpdate(id, { status }, { new: true });
  return illegalEntry;
}

export const getillegalStatus = async (userId) => {
  const illegalEntry = await IllegalDump.find({ user: userId }).populate('user', 'name email phoneNumber');

  if (!illegalEntry || illegalEntry.length === 0) {
    throw new Error('illegalDump request not found or access denied.');
  }
  return  illegalEntry.map(entry => ({
    name: entry.user.name,
    email: entry.user.email,
    phoneNumber: entry.user.phoneNumber,
    materials: entry.materials,
    status: entry.status,
    requestDate: entry.requestDate,
  }))
}

export const deleteIllegalEntry = async (id) => {
  const illegalEntry = await IllegalDump.findByIdAndDelete(id);
  return illegalEntry;
} 
