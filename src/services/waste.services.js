import Waste from "../model/wastecollection.js";
import User from "../model/user.js";
import { sendEmail } from "./email.services.js";
import Reward from "../model/rewards.js";
import CollectorAssay from "../model/collectorAssay.js";


export const createWasteRequest = async (wasteData) => {
  const user = await User.findById(wasteData.userId).select("name email phoneNumber gender");
  if (!user) throw new Error("User not found");

  if (!wasteData.materials || !wasteData.materials.length) return null;

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
    return Math.round(materials.reduce((total, item) => {
      const base = materialPoints[item.wasteType] || 0;
      const bonus = item.quantity > 50 ? 1.1 : 1;
      return total + base * item.quantity * bonus;
    }, 0));
  };

  const pointsEarned = calculatePoints(wasteData.materials);

  const reward = new Reward({
    user: user._id,
    pointsEarned,
    rewardItem: "Waste Request Bonus 💫✨",
    activityType: "WasteRequest"
  });
  await reward.save();

  const normalizedLocation = wasteData.location?.trim().toLowerCase();
  const assignedCollector = await CollectorAssay.findOne({
    serviceArea: normalizedLocation,
    status: { $in: ['EnRoute', 'Accepted'] }
  });

  let collectorUser = null;
  if (assignedCollector) {
    collectorUser = await User.findById(assignedCollector.user).select("email name gender serviceArea");
  }

  const wasteRequest = new Waste({
    user: user._id,
    materials: wasteData.materials,
    location: wasteData.location,
    requestDate: wasteData.requestDate,
    notes: wasteData.notes,
    images: wasteData.images,
    status: wasteData.status,
    Reward: reward._id,
    collector: assignedCollector?._id || null
  });
  await wasteRequest.save();

  const materialSummary = wasteData.materials.map((item, i) =>
    `${i + 1}. ${item.quantity} ${item.unit} of ${item.wasteType}`
  ).join('<br>');

  const subject = "New Waste Product Request 🚮🗑️";
  const html = `
    <h1>Hi ${user.gender === "Male" ? "Mr" : user.gender === "Female" ? "Mrs/Miss" : 'Mx'} ${user.name},</h1>
    <p>Thank you for submitting your waste request. Here's a summary of your materials:</p>
    <p>${materialSummary}</p>
    <p>Status: <strong>${wasteRequest.status}</strong></p>
    <p>Points-Earned: ${reward.pointsEarned} pts</p>
    <p>Collector-Assigned: ${
      collectorUser
        ? `${collectorUser.gender === "Male" ? "Mr" : collectorUser.gender === "Female" ? "Mrs/Miss" : 'Mx'} ${collectorUser.name}`
        : "Not yet assigned"
    }.</p>
  `;
  await sendEmail(user.email, subject, html);

  if (collectorUser?.email) {
    const collectorSubject = "New Waste Request Assigned 🚛";
    const collectorHtml = `
      <h1>Hi ${collectorUser.gender === "Male" ? "Mr" : collectorUser.gender === "Female" ? "Mrs/Miss" : 'Mx'} ${collectorUser.name},</h1>
      <p>A new waste request has been assigned to you in <strong>${assignedCollector.serviceArea}</strong>.</p>
      <p>Please check your dashboard for details.</p>
    `;
    await sendEmail(collectorUser.email, collectorSubject, collectorHtml);
  }

  return wasteRequest;
};


export const getAllWasteEntries = async () => {
  const wasteEntries = await Waste.find().populate('user', 'name email phoneNumber');
  return wasteEntries;
}

export const getWasteEntryById = async (id) => {
  const wasteEntry = await Waste.findById(id).populate('user', 'name email phoneNumber gender');

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
    <h1>Hi ${wasteEntry.user.gender === "Male" ? "Mr" : wasteEntry.user.gender === "Female" ? "Mrs/Miss" : 'Mx'} ${wasteEntry.user.name} 👋</h1>
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
  const wasteEntries = await Waste.find({ user: userId }).populate('user', 'name email phoneNumber gender');

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
    <h1>Hi ${latestEntry.user.gender === "Male" ? "Mr" : latestEntry.user.gender === "Female" ? "Mrs/Miss" : 'Mx'} ${latestEntry.user.name} 👋</h1>
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
  const allowedUpdates = ['materials', 'collectionDate', 'notes', 'images', 'location'];
  const updates = {};

  // Filter only allowed fields
  for (const key in updateData) {
    if (allowedUpdates.includes(key)) {
      updates[key] = updateData[key];
    }
  }

  // Update waste entry and populate reward and user details
  const wasteEntry = await Waste.findByIdAndUpdate(id, { $set: updates }, { new: true })
    .populate('Reward')
    .populate('user', 'name email phoneNumber gender');

  // Recalculate reward if materials were updated
  if (updateData.materials && updateData.materials.length && wasteEntry.Reward) {
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

    await Reward.findByIdAndUpdate(wasteEntry.Reward._id, {
      $set: { pointsEarned: newPoints }
    });

    // Update local reference for email
    wasteEntry.Reward.pointsEarned = newPoints;
  }

  // Format material summary
  const materialSummary = wasteEntry.materials.map((item, index) => {
    return `${index + 1}. ${item.quantity} ${item.unit || 'units'} of ${item.wasteType}`;
  }).join('<br>');

  // Compose email
  const subject = "Waste Product Request 🚮🗑️";
  const html = `
    <h1>Hi ${wasteEntry.user.gender === "Male" ? "Mr" : wasteEntry.user.gender === "Female" ? "Mrs/Miss" : 'Mx'} ${wasteEntry.user.name} 👋</h1>
    <p>Thanks for submitting another waste request! ♻️ We're thrilled to see your continued commitment to a cleaner environment 🌍.</p>
    <p>Here’s a quick summary of your latest request:</p>
    <p>${materialSummary}</p>
    <p>Status: <strong>${wasteEntry.status} ⏳</strong></p>
    <p>Points-Earned: ${wasteEntry.Reward.pointsEarned} pts </p>
    <p>We'll notify you once a collector is assigned.</p>
    <p>If you have any updates or questions, feel free to reply to this email 📩.</p>
    <p>You're making a difference—thank you for being part of the solution 💚!</p>
  `;

  // Send email
  try {
    await sendEmail(wasteEntry.user.email, subject, html);
  } catch (error) {
    console.error('Email sending failed:', error.message);
  }

  return wasteEntry;
};


// Collector Section

export const acceptWasteRequestService = async (wasteId, collectorAssayId) => {
  const waste = await Waste.findById(wasteId);
  if (!waste) throw new Error("Waste request not found");
   if (waste.status === "Accepted" || waste.status === "Rejected") {
    throw new Error("Waste request has already been processed");
  }


  waste.status = "Accepted";
  waste.collector = collectorAssayId;
  await waste.save();

  const assay = await CollectorAssay.findById(collectorAssayId);
  if (assay) {
    assay.status = "Accepted";
    assay.acceptedRequests += 1;

    waste.materials.forEach(({ wasteType, quantity }) => {
      const normalizedType = wasteType.toLowerCase();
      const stat = assay.collectionStats.find(s => s.wasteType === normalizedType);

      if (stat) {
        stat.quantityCollected += quantity;
        stat.updatedAt = new Date();
      } else {
        assay.collectionStats.push({
          wasteType: normalizedType,
          quantityCollected: quantity,
          updatedAt: new Date()
        });
      }
    });

    assay.totalQuantityCollected += waste.materials.reduce((sum, m) => sum + m.quantity, 0);
    await assay.save();
  }

  return waste;
};


export const rejectWasteRequestService = async (wasteId, collectorAssayId, rejectionReason = "") => {
  const waste = await Waste.findById(wasteId);
  if (!waste) throw new Error("Waste request not found");
   if (waste.status === "Accepted" || waste.status === "Rejected") {
    throw new Error("Waste request has already been processed");
  }
  if (!rejectionReason || rejectionReason.trim() === "") {
    throw new Error("Rejection reason is required when rejecting a waste request");
  }


  waste.status = "Rejected";
  waste.collector = null;
  waste.rejectionReason = rejectionReason;
  await waste.save();

  const assay = await CollectorAssay.findById(collectorAssayId);
  if (assay) {
    assay.status = "Rejected";
    assay.rejectedRequests += 1;
    await assay.save();
  }

  return waste;
};



export const getCollectorStat = async (collectorAssayId) => {
  const collectorStat = await Waste.find({
    collector: collectorAssayId
  }).populate('collector',"assayDate totalQuantityCollected acceptedRequests rejectedRequests materials" )
  .populate('user', 'name email phoneNumber'); 
  const filteredStat = collectorStat
    .map(item => {
      if (item.collector) {
        const {
          assayDate,
          totalQuantityCollected,
          acceptedRequests,
          rejectedRequests,
          materials
        } = item.collector;

        return {
          assayDate,
          totalQuantityCollected,
          acceptedRequests,
          rejectedRequests,
          materials
        };
      }
      return null;
    })
    .filter(stat => stat !== null); 

  return filteredStat;

};




  