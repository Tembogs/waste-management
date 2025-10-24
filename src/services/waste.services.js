import Waste from "../model/wastecollection.js";
import User from "../model/user.js";
import { sendEmail } from "./email.services.js";
import Reward from "../model/rewards.js";
import CollectorAssay from "../model/collectorAssay.js";
import mongoose from "mongoose";

 const genTitle = (gender) => gender === "Male" ? "Mr" : gender === "Female" ? "Mrs/Miss" : 'Mx'
 
export const createWasteRequest = async (wasteData) => {
  const user = await User.findById(wasteData.userId).select("name email phoneNumber gender Reward");
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

  console.log("wdl", wasteData.location);
  
   

  const normalizedLocation = wasteData.location?.trim().toLowerCase();
  const assignedCollector = await CollectorAssay.findOne({
    serviceArea: normalizedLocation
  });


  let collectorUser = null;
  if (assignedCollector) {
    collectorUser = await User.findById(assignedCollector.user).select("email name gender serviceArea");
  }
   const rewardArray = [user.Reward || 0, pointsEarned];
    user.Reward = rewardArray.reduce((total, value) => total + value, 0);
    await user.save();

    console.log("wdl",wasteData.location)


  const wasteRequest = new Waste({
    user: user._id,
    materials: wasteData.materials,
    location: wasteData.location,
    // images: wasteData.images,
    requestDate: wasteData.requestDate,
    notes: wasteData.notes, 
    status: wasteData.status,
    Reward: reward._id,
    collector:assignedCollector?._id || null,
    createdAt:wasteData.createdAt
  });
  
  await wasteRequest.save();
//   const responsePayload = {
//   ...wasteRequest.toObject(), // converts Mongoose doc to plain object
//   collector: collectorUser || null, // replaces the ID with full user info
// };

// return responsePayload;



 
  const materialSummary = wasteData.materials.map((item, i) =>
    `${i + 1}. ${item.quantity} ${item.unit} of ${item.wasteType}`
  ).join('<br>');
  
  const subject = "New Waste Product Request 🚮🗑️";
  const html = `
    <h1>Hi ${genTitle(user.gender)} ${user.name},</h1>
    <p>Thank you for submitting your waste request. Here's a summary of your materials:</p>
    <p>${materialSummary}</p>
    <p>Status: <strong>${wasteRequest.status}</strong></p>
    <p>Points-Earned: ${reward.pointsEarned} pts</p>
    <p>Total Points-Earned: ${user.Reward} </p>
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


export const getWasteStatusV2 = async (userId) => {
  const wasteEntries = await Waste.find({ user: userId })
  .populate('user', 'name email phoneNumber')
  .populate({
      path: 'collector',
      populate: {
        path: 'user',
        select: 'name email phoneNumber' 
      }
    });

  if (!wasteEntries || wasteEntries.length === 0) {
      return []; 
  }

  return wasteEntries.map(entry => {
    if (!entry.user) {
      return {
         id: entry._id, 
        name: 'Unknown User',
        email: 'N/A',
        phoneNumber: 'N/A',
        materials: entry.materials,
        status: entry.status,
        requestDate: entry.requestDate,
        error: 'Associated user not found'
      };
    }
    const collectorUser = entry.collector ? entry.collector.user : null;
    return {
       id: entry._id, 
      name: entry.user.name,
      email: entry.user.email,
      phoneNumber: entry.user.phoneNumber,
      collectorId: entry.collector ? entry.collector._id : null,
      collectorName: collectorUser ? collectorUser.name : 'N/A',
      materials: entry.materials,
      status: entry.status,
      requestDate: entry.requestDate,
    };
  });
};


export const deleteWasteEntry = async (id) => {
  const wasteEntry = await Waste.findByIdAndDelete(id);
  if (!wasteEntry) return null;
  if (wasteEntry.Reward) {
    await Reward.findByIdAndDelete(wasteEntry.Reward);
  }
  return wasteEntry;
};


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
  const session = await mongoose.startSession();
  session.startTransaction();
  let committed = true
  try {
    const waste = await Waste.findById(wasteId).session(session);
    if (!waste) throw new Error("Waste request not found");
    if (waste.status === "Accepted" || waste.status === "Rejected"|| waste.status === "En Route" || waste.status === 'Collected') {
      throw new Error("Waste request has already been processed");
    }

    const user = await User.findById(waste.user).select("name email gender").session(session);
    if (!user) throw new Error("User not found");

    const assay = await CollectorAssay.findById(collectorAssayId).session(session);
    if (!assay) throw new Error("Collector assay not found");

    // Update waste
    waste.status = "Accepted";
    waste.collector = collectorAssayId;
    await waste.save({ session });

    // Update assay
    assay.status = "Accepted";
    assay.acceptedRequests += 1;
    await assay.save({ session });

    await session.commitTransaction();
    committed= true
    session.endSession();

    // Compose and send email after transaction
    const subject = "Waste Request Accepted ✅";
    const html = `
      <h1>Hi ${genTitle(user.gender)} ${user.name},</h1>
      <p>Your waste request has been accepted! A collector is on the way to pick up your materials.</p>
      <p>Thank you for contributing to a cleaner environment! 🌍♻️</p>
      <p>If you have any questions, feel free to reply to this email 📩.</p>
    `;
    await sendEmail(user.email, subject, html);

    return waste;
  } catch (error) {
    if(!committed){
      await session.abortTransaction()
    }
    session.endSession();
    console.error("Error accepting waste request:", error.message);
    throw new Error("Failed to accept waste request. Please try again.");
  }
};


export const rejectWasteRequestService = async (wasteId, collectorAssayId, rejectionReason = "") => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let committed = false

  try {
    const waste = await Waste.findById(wasteId).session(session);
    if (!waste) throw new Error("Waste request not found");

    if (["Collected", "Rejected", "Accepted", "En Route"].includes(waste.status)) {
      throw new Error("Waste request has already been processed");
    }
    if (!rejectionReason || rejectionReason.trim() === "") {
      throw new Error("Rejection reason is required when rejecting a waste request");
    }

    const user = await User.findById(waste.user).select("name email gender").session(session);
    if (!user) throw new Error("User not found");

    const assay = await CollectorAssay.findById(collectorAssayId ).session(session);
    console.log("Looking for CollectorAssay ID:", collectorAssayId);

    if (!assay) throw new Error("Collector assay not found");

    // Update waste
    waste.status = "Rejected";
    waste.collector = collectorAssayId;
    waste.rejectionReason = rejectionReason;
    await waste.save({ session });

    // Update assay
    assay.status = "Rejected";
    assay.rejectedRequests += 1;
    await assay.save({session});

    await session.commitTransaction();
    committed= true
    session.endSession();

    // Compose and send email after transaction
    const subject = "Waste Request Rejected ❌";
    const html = `
      <h1>Hi ${genTitle(user.gender)} ${user.name},</h1>
      <p>We're sorry to inform you that your recent waste request has been rejected.</p>
      <p><strong>Reason:</strong> ${rejectionReason}</p>
      <p>You can review your request and submit a new one if needed.</p>
      <p>Thank you for your continued efforts toward a cleaner environment 🌍.</p>
    `;
    await sendEmail(user.email, subject, html);

    return waste;
  } catch (error) {
    if(!committed){
      await session.abortTransaction()
    }
    session.endSession();
    console.error("Error rejecting waste request:", error.message);
    throw new Error("Failed to reject waste request. Please try again.");
  }
};


export const getCollectorStat = async (collectorAssayId) => {
  const collector = await CollectorAssay.findById(collectorAssayId).select(
    "assayDate totalQuantityCollected acceptedRequests rejectedRequests"
  );

  if (!collector) return null;

  const { assayDate, totalQuantityCollected, acceptedRequests, rejectedRequests } = collector;

  return {
    assayDate,
    totalQuantityCollected,
    acceptedRequests,
    rejectedRequests
  };
};

export const routecollectorService = async (wasteId, collectorAssayId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
   let committed = false;

  try{
     const waste = await Waste.findById(wasteId).session(session)
     if(!waste) throw new Error ("Waste Not Found")
       if (!["Accepted"].includes(waste.status)) {
      throw new Error("Waste hasn't been accepted");
    }

    if (["Collected", "Rejected", "En Route"].includes(waste.status)) {
      throw new Error("Waste request has already been processed");
    }
    

     const user = await User.findById(waste.user).select("name email gender").session(session);
     if(!user) throw new Error("User not found");

     const assay = await CollectorAssay.findById(collectorAssayId).session(session);
     if(!assay) throw new Error("Collector not found");

     waste.status ="En Route"
     waste.collector = collectorAssayId
     await waste.save({session});

     assay.status = "En Route"
    await assay.save({ session });

    await session.commitTransaction();
    committed = true;
    session.endSession();
   
    const subject = "Waste Request En Route 🚚";
    const html = `
      <h1>Hi ${genTitle(user.gender)} ${user.name},</h1>
      <p>Good news! Your waste request is currently en route and will be handled shortly.</p>
      <p><strong>Status:</strong> ${waste.status}</p>
      <p>Please ensure the waste is accessible for collection at the specified location.</p>
      <p>Thank you for your commitment to a cleaner and healthier environment 🌍.</p>
    `;
    await sendEmail(user.email, subject, html);

    return waste;

  
  }catch(error){
    if (!committed) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error("Error en routing waste request:", error.message);
    throw new Error("Failed to route waste request. Please try again.");
  }
}

export const collectWasteRequest = async (wasteId, collectorAssayId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
    let committed = false;
  try{
    const waste = await Waste.findById(wasteId).session(session);
    if(!waste) throw new Error("Waste not found");
      if (["Accepted"].includes(waste.status)) {
      throw new Error("Waste hasn't been en route");
    }

    if (["Collected", "Rejected"].includes(waste.status)) {
      throw new Error("Waste request has already been processed");
    }

    
    const user = await User.findById(waste.user).select("name email gender").session(session)
    if(!user) throw new Error("User not found")

    const assay = await CollectorAssay.findById(collectorAssayId).session(session)
    if(!assay) throw new Error("Collector not found")

    waste.status ="Collected"
    waste.collector = collectorAssayId
    await waste.save({session})

    assay.status = "Collected"

    waste.materials.forEach(({ wasteType, quantity }) => {
  
      const stat = assay.collectionStats.find(s => s.wasteType === wasteType);

      if (stat && waste.status === "Collected") {
        stat.quantityCollected += quantity;
        stat.updatedAt = new Date();
      } else {
        assay.collectionStats.push({
          wasteType: wasteType,
          quantityCollected: quantity,
          updatedAt: new Date()
        });
      }
    });
   assay.totalQuantityCollected += waste.materials.reduce((sum, m) => sum + m.quantity, 0);
   await assay.save({session})

  await session.commitTransaction();
  committed = true;
  session.endSession();

  const subject = "Waste Request Collected ✅";
  const html = `
    <h1>Hi ${genTitle(user.gender)} ${user.name},</h1>
    <p>We're pleased to inform you that your waste request has been successfully collected.</p>
    <p><strong>Status:</strong> ${waste.status}</p>
    <p><strong>Collection Time:</strong> ${new Date(assay.collectionDate).toLocaleString()}</p>
    <p><strong>Location:</strong> ${assay.serviceArea}</p>
    <p>We appreciate your commitment to a cleaner and healthier environment 🌍.</p>
    <p>If you have a moment, we'd love to hear your feedback to help us improve our service.</p>
    <p>You can submit a new request anytime through your dashboard.</p>
  `;
  await sendEmail(user.email, subject, html);

  return waste;

  }catch(error){
     if (!committed) {
      await session.abortTransaction();
    }

    session.endSession();
    console.error("Error collecting waste request:", error.message);
    throw new Error("Failed to collect waste request. Please try again.")
  }
}


export const deleteAllUser = async () =>{
  const user = await Waste.deleteMany()
  return user
}



export const getWasteRequestToCollector = async (collectorAssayId) => {
  const wasteRequests = await Waste.find({ collector: collectorAssayId })
    .populate('user', 'name email phoneNumber')
    .populate({
      path: 'collector',
      populate: {
        path: 'user',
        select: 'name email phoneNumber' 
      }
    });

  if (!wasteRequests || wasteRequests.length === 0) {
    return [];
  }

  return wasteRequests.map(entry => {
    if (!entry.user) {
      return {
        id: entry._id,
        name: 'Unknown User',
        email: 'N/A',
        phoneNumber: 'N/A',
        materials: entry.materials,
        status: entry.status,
        recyclingDate: entry.recyclingDate,
        error: 'Associated user not found'
      };
    }

    const collectorUser = entry.collector ? entry.collector.user : null;

    return {
      wasteId: entry._id,
      userId: entry.user._id,
      userName: entry.user.name,
      userEmail: entry.user.email,
      userPhoneNumber: entry.user.phoneNumber,
      collectorId: entry.collector ? entry.collector._id : null,
      collectorName: collectorUser ? collectorUser.name : 'N/A',
      collectorPhoneNumber: collectorUser ? collectorUser.phoneNumber : 'N/A',
      rejectionReason:entry.collector.rejectionReason,
      materials: entry.materials,
      status: entry.status,
      requestDate: entry.requestDate,
      location: entry.location,
      serviceArea: entry.collector ? entry.collector.serviceArea : 'N/A',
      collectionDate: entry.collector ? entry.collector.collectionDate : null,
      totalQuantityCollected:entry.collector.totalQuantityCollected,
      notes: entry.notes
    };
  });
};


