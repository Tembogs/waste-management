import Recycling from "../model/recycling.js";
import Reward from "../model/rewards.js";
import User from "../model/user.js";
import { sendEmail } from "./email.services.js";

export const createRecycleRequest = async (recycleData) => {
  try {
    const user = await User.findById(recycleData.userId).select("name email phoneNumber gender");
    if (!user) throw new Error("User not found");

    if (!recycleData.materials || !recycleData.materials.length) {
      console.warn("No materials provided for recycling.");
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
    const pointsEarned = calculatePoints(recycleData.materials);
    
    const reward = new Reward({
      user: user._id,
      pointsEarned,
      rewardItem: "Waste Request Bonus 💫✨",
      activityType: "WasteRequest"
    });
    
    await reward.save();

    const recycleRequest = new Recycling({
      user: user._id,
      materials: recycleData.materials,
      location: recycleData.location,
      recyclingDate: recycleData.recyclingDate,
      status: recycleData.status || "Pending",
      Reward:reward._id
    });

    await recycleRequest.save();

    const materialSummary = recycleData.materials.map((item, index) => {
      return `${index + 1}. ${item.quantity} ${item.unit} of ${item.wasteType}`;
    }).join('<br>');

    // 📧 Email to user
    const subject = "New Recycling Request ♻️";
    const html = `
      <h1>Hi ${user.gender === "Male" ? "Mr" : user.gender === "Female" ? "Mrs/Miss" : 'Mx'} ${user.name},</h1>
      <p>Thank you for submitting your recycling request. Here's a summary of your materials:</p>
      <p>${materialSummary}</p>
      <p><strong>Location:</strong> ${recycleRequest.location}</p>
      <p><strong>Recycle Date:</strong> ${recycleRequest.recyclingDate}</p>
      <p><strong>Status:</strong> ${recycleRequest.status}</p>
      <p>Points-Earned: ${reward.pointsEarned} pts </p>
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

  const recycleEntry = await Recycling.findByIdAndUpdate(id, { $set: updates }, { new: true })
      .populate('Reward')
      .populate('user', 'name email phoneNumber gender');
  
    // Recalculate reward if materials were updated
    if (updateData.materials && updateData.materials.length && recycleEntry.Reward) {
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
  
      const newPoints = calculatePoints(updateData.materials);
  
      await Reward.findByIdAndUpdate(recycleEntry.Reward._id, {
        $set: { pointsEarned: newPoints }
      });
  
      // Update local reference for email
      recycleEntry.Reward.pointsEarned = newPoints;
    }
  
    // Format material summary
    const materialSummary = recycleEntry.materials.map((item, index) => {
      return `${index + 1}. ${item.quantity} ${item.unit || 'units'} of ${item.wasteType}`;
    }).join('<br>');
  
    // Compose email
    const subject = "New Recycling Request ♻️";
    const html = `
      <h1>Hi ${recycleEntry.user.gender === "Male" ? "Mr" : recycleEntry.user.gender === "Female" ? "Mrs/Miss" : 'Mx'} ${recycleEntry.user.name} 👋</h1>
      <p>Thanks for updating your recycling request! ♻️ We're thrilled to see your continued commitment to a cleaner environment 🌍.</p>
      <p>Here’s a quick summary of your latest request:</p>
      <p>${materialSummary}</p>
      <p>Status: <strong>${recycleEntry.status} ⏳</strong></p>
      <p>Points-Earned: ${recycleEntry.Reward.pointsEarned} pts </p>
      <p>We'll notify you once a collector is assigned.</p>
      <p>If you have any updates or questions, feel free to reply to this email 📩.</p>
      <p>You're making a difference—thank you for being part of the solution 💚!</p>
    `;
  
    // Send email
    try {
      await sendEmail(recycleEntry.user.email, subject, html);
    } catch (error) {
      console.error('Email sending failed:', error.message);
    }
  
  return recycleEntry;
}




  