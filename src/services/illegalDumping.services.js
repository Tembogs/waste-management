import IllegalDump from "../model/illegalDump.js";
import Reward from "../model/rewards.js";
import User from "../model/user.js";
import { sendEmail } from "./email.services.js";


export const reportIllegalDump = async (illegalData) => {
  try {
    const user = await User.findById(illegalData.userId).select("name email phoneNumber gender");
    if (!user) throw new Error("User not found");
    if (!illegalData.materials || !illegalData.materials.length) {
          console.warn("No description provided for recycling.");
          return null;
        }
          const materialPoints = {
          General: 1,
          Paper: 2,
          Plastic: 3,
          Glass: 2,
          Metal: 4,
          Organic: 2,
          'E-waste': 5
        };
         const calculatePoints = (materials) => {
          let totalPoints = 0;
          materials.forEach(item => {
            const basePoints = materialPoints[item.wasteType] || 0;
            const itemPoints = basePoints * item.quantity;
            const bonusMultiplier = item.quantity > 50 ? 1.1 : 1;
            totalPoints += itemPoints * bonusMultiplier;
          });
        
          return Math.round(totalPoints); 
        };
        const pointsEarned = calculatePoints(illegalData.materials);
        
        const reward = new Reward({
          user: user._id,
          pointsEarned,
          rewardItem: "Waste Request Bonus 💫✨",
          activityType: "WasteRequest"
        });
        
        await reward.save();

    const illegalRequest = new IllegalDump({
      reporter: user._id,
      materials:illegalData.materials,
      description: illegalData.description,
      location: illegalData.location,
      status: illegalData.status || "Pending",
      reportDate: new Date(),
      Reward:reward._id
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
  const IllegalEntries = await IllegalDump.find().populate('reporter', 'name email phoneNumber');
  return IllegalEntries;
}

export const getIllegalEntryById = async (id) => {
  const IllegalEntry = await IllegalDump.findById(id).populate('reporter', 'name email phoneNumber');
  return IllegalEntry;
}

export const updateIllegalEntryById = async (id, status) => {
  const allowedUpdates = ['materials', 'description','photos', "location"];
  const updates = {};

  for (const key in status) {
    if (allowedUpdates.includes(key)) {
      updates[key] = status[key];
    }
  }
  const illegalEntry = await IllegalDump.findByIdAndUpdate(id, { $set: updates }, { new: true })
        .populate('Reward')
        .populate('reporter', 'name email phoneNumber gender materials');
    
      // Recalculate reward if materials were updated
      if (status.materials && status.materials.length && illegalEntry.Reward) {
        const materialPoints = {
          General: 1,
          Paper: 2,
          Plastic: 3,
          Glass: 2,
          Metal: 4,
          Organic: 2,
          'E-waste': 5
        };
    
        const calculatePoints = (materials) => {
          let totalPoints = 0;
          materials.forEach(item => {
            const basePoints = materialPoints[item.wasteType] || 0;
            const itemPoints = basePoints * item.quantity;
            const bonusMultiplier = item.quantity > 50 ? 1.1 : 1;
            totalPoints += itemPoints * bonusMultiplier;
          });
          return Math.round(totalPoints);
        };
    
        const newPoints = calculatePoints(status.materials);
    
        await Reward.findByIdAndUpdate(illegalEntry.Reward._id, {
          $set: { pointsEarned: newPoints }
        });
    
        // Update local reference for email
        illegalEntry.Reward.pointsEarned = newPoints;
      }
    
      // Format material summary
      const materialSummary = updates.materials?.map((item, index) => {
  return `${index + 1}. ${item.quantity} ${item.unit || 'units'} of ${item.wasteType}`;
}).join('<br>') || 'No materials listed';
    
      // Compose email
      const subject = "New Illegal Request ♻️";
      const html = `
        <h1>Hi ${illegalEntry.reporter.gender === "Male" ? "Mr" : illegalEntry.reporter.gender === "Female" ? "Mrs/Miss" : 'Mx'} ${illegalEntry.reporter.name} 👋</h1>
        <p>Thanks for updating your Illegal request! ♻️ We're thrilled to see your continued commitment to a cleaner environment 🌍.</p>
        <p>Here’s a quick summary of your latest request:</p>
        <p>${materialSummary}</p>
        <p>Status: <strong>${illegalEntry.status} ⏳</strong></p>
        <p>Points-Earned: ${illegalEntry.Reward.pointsEarned} pts </p>
        <p>We'll notify you once a collector is assigned.</p>
        <p>If you have any updates or questions, feel free to reply to this email 📩.</p>
        <p>You're making a difference—thank you for being part of the solution 💚!</p>
      `;
    
      // Send email
      try {
        await sendEmail(illegalEntry.reporter.email, subject, html);
      } catch (error) {
        console.error('Email sending failed:', error.message);
      }
  return illegalEntry;
}

export const getillegalStatus = async (userId) => {
  const illegalEntry = await IllegalDump.find({ user: userId }).populate('reporter', 'name email phoneNumber');

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
