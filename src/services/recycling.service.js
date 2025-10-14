import mongoose from "mongoose";
import CollectorAssay from "../model/collectorAssay.js";
import Recycling from "../model/recycling.js";
import Reward from "../model/rewards.js";
import User from "../model/user.js";
import { sendEmail } from "./email.services.js";

const genTitle = (gender) => gender === "Male" ? "Mr" : gender === "Female" ? "Mrs/Miss" : 'Mx'

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
      "E-waste": 5
    };
    console.log("Incoming materials:", JSON.stringify(recycleData.materials, null, 2));
     const calculatePoints = (materials) => {
      let totalPoints = 0;
      materials.forEach(item => {
        const basePoints = materialPoints[item.recycleType] || 0;
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
      rewardItem: "Recycle Request Bonus 💫✨",
      activityType: "Recycling"
    });
    
    await reward.save();
    

     const normalizedLocation = recycleData.location?.trim().toLowerCase();
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
    const recycleRequest = new Recycling({
      user: user._id,
      materials: recycleData.materials,
      location: recycleData.location,
      recyclingDate: recycleData.recyclingDate,
      status: recycleData.status || "Pending",
      Reward:reward._id,
      collector: assignedCollector?._id || null
    });
  
    await recycleRequest.save();
      const genTitle = (gender) => gender === "Male" ? "Mr" : gender === "Female" ? "Mrs/Miss" : 'Mx'
    const materialSummary = recycleData.materials.map((item, index) => {
      console.log(`Material ${index + 1}:`, item.recycleType);
      return `${index + 1}. ${item.quantity} ${item.unit} of ${item.recycleType}`;
    }).join('<br>');

    // 📧 Email to user
    const subject = "New Recycling Request ♻️";
    const html = `
      <h1>Hi ${ genTitle(user.gender)} ${user.name},</h1>
      <p>Thank you for submitting your recycling request. Here's a summary of your materials:</p>
      <p>${materialSummary}</p>
      <p><strong>Location:</strong> ${recycleRequest.location}</p>
      <p><strong>Recycle Date:</strong> ${recycleRequest.recyclingDate}</p>
      <p><strong>Status:</strong> ${recycleRequest.status}</p>
      <p>Points-Earned: ${reward.pointsEarned} pts </p>
     <p>Total Points-Earned: ${user.Reward} </p>
    <p>Collector-Assigned: ${
      collectorUser
        ? `${ genTitle(collectorUser.gender)} ${collectorUser.name}`
        : "Not yet assigned"
    }.</p>
    `;

    await sendEmail(user.email, subject, html);

    // 📧 Email to assigned collector
     if (collectorUser?.email) {
        const collectorSubject = "New Recycle Request Assigned 🚛";
        const collectorHtml = `
          <h1>Hi ${ genTitle(collectorUser.gender)} ${collectorUser.name},</h1>
          <p>A new waste request has been assigned to you in <strong>${assignedCollector.serviceArea}</strong>.</p>
          <p>Please check your dashboard for details.</p>
        `;
        await sendEmail(collectorUser.email, collectorSubject, collectorHtml);
      }

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
    if (!recycleEntry) return null;
  
    if (recycleEntry.Reward) {
      await Reward.findByIdAndDelete(recycleEntry.Reward);
    }
    await Recycling.findByIdAndDelete(id);
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
          const basePoints = materialPoints[item.recycleType] || 0;
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
      return `${index + 1}. ${item.quantity} ${item.unit || 'units'} of ${item.recycleType}`;
    }).join('<br>');
    const genTitle = (gender)=> gender === "Male" ? "Mr" : gender ==="Female" ? "Mrs/Miss" : "Mx"
    // Compose email
    const subject = "New Recycling Request ♻️";
    const html = `
      <h1>Hi ${genTitle(recycleEntry.user.gender)} ${recycleEntry.user.name} 👋</h1>
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

// Collector- Section
export const acceptRecycleRequestService = async (recycleId, collectorAssayId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let committed = false

  try {
    const recycle = await Recycling.findById(recycleId).session(session);
    if (!recycle) throw new Error("Recycle request not found");
    if (recycle.status === "Accepted" || recycle.status === "Rejected" || recycle.status === "En Route" || recycle.status === "Collected") {
      throw new Error("Recycle request has already been processed");
    }

    const user = await User.findById(recycle.user).select("name email gender").session(session);
    if (!user) throw new Error("User not found");

    const assay = await CollectorAssay.findById(collectorAssayId).session(session);
    if (!assay) throw new Error("Collector assay not found");

    // Update waste
    recycle.status = "Accepted";
    recycle.collector = collectorAssayId;
    await recycle.save({ session });

    // Update assay
    assay.status = "Accepted";
    assay.acceptedRequests += 1;

    recycle.materials.forEach(({ recycleType, quantity }) => {
  
      const stat = assay.collectionStats.find(s => s.recycleType === recycleType);

      if (stat) {
        stat.quantityCollected += quantity;
        stat.updatedAt = new Date();
      } else {
        assay.collectionStats.push({
          recycleType: recycleType,
          quantityCollected: quantity,
          updatedAt: new Date()
        });
      }
    });

    assay.totalQuantityCollected += recycle.materials.reduce((sum, m) => sum + m.quantity, 0);
    await assay.save({ session });

    await session.commitTransaction();
    committed = true
    session.endSession();

    // Compose and send email after transaction
    const subject = "Recycle Request Accepted ✅";
    const html = `
      <h1>Hi ${user.gender === "Male" ? "Mr" : user.gender === "Female" ? "Mrs/Miss" : 'Mx'} ${user.name},</h1>
      <p>Your recycle request has been accepted! A collector is on the way to pick up your materials.</p>
      <p>Thank you for contributing to a cleaner environment! 🌍♻️</p>
      <p>If you have any questions, feel free to reply to this email 📩.</p>
    `;
    await sendEmail(user.email, subject, html);

    return recycle;
  } catch (error) {
    if(!committed){
      await session.abortTransaction();
    }
    session.endSession();
    console.error("Error accepting recycle request:", error.message);
    throw new Error("Failed to accept recycle request. Please try again.");
  }
};


export const rejectRecycleRequestService = async (recycleId, collectorAssayId, rejectionReason = "") => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let committed = false
  try {
    const recycle = await Recycling.findById(recycleId).session(session);
    if (!recycle) throw new Error("Waste request not found");

    if (["Collected", "Rejected", "Accepted" ,"En Route"].includes(recycle.status)) {
      throw new Error("Recycle request has already been processed");
    }
    
    if (!rejectionReason || rejectionReason.trim() === "") {
      throw new Error("Rejection reason is required when rejecting a recycle request");
    }

    const user = await User.findById(recycle.user).select("name email gender").session(session);
    if (!user) throw new Error("User not found");

    const assay = await CollectorAssay.findById(collectorAssayId ).session(session);
    console.log("Looking for CollectorAssay ID:", collectorAssayId);

    if (!assay) throw new Error("Collector assay not found");

    // Update recycle
    recycle.status = "Rejected";
    recycle.collector = null;
    recycle.rejectionReason = rejectionReason;
    await recycle.save({ session });

    // Update assay
    assay.status = "Rejected";
    assay.rejectedRequests += 1;
    await assay.save({ session });

    await session.commitTransaction();
    committed = true
    session.endSession();

    // Compose and send email after transaction
    const subject = "Recycle Request Rejected ❌";
    const html = `
      <h1>Hi ${user.gender === "Male" ? "Mr" : user.gender === "Female" ? "Mrs/Miss" : 'Mx'} ${user.name},</h1>
      <p>We're sorry to inform you that your recent recycle request has been rejected.</p>
      <p><strong>Reason:</strong> ${rejectionReason}</p>
      <p>You can review your request and submit a new one if needed.</p>
      <p>Thank you for your continued efforts toward a cleaner environment 🌍.</p>
    `;
    await sendEmail(user.email, subject, html);

    return recycle;
  } catch (error) {
    if(!committed){
      await session.abortTransaction();
    }
    session.endSession();
    console.error("Error rejecting recycle request:", error.message);
    throw new Error("Failed to reject recycle request. Please try again.");
  }
};

export const routecollectorService = async (recycleId, collectorAssayId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let committed = false
 
  try{
     const recycle = await Recycling.findById(recycleId).session(session)
      console.log("Recycle status:", recycle.status);
     if(!recycle) throw new Error ("Recycle Not Found")
      if (!["Accepted"].includes(recycle.status)) {
      throw new Error("Recycle hasn't been accepted");
    }

    if (["Collected", "Rejected", "En Route"].includes(recycle.status)) {
      throw new Error("Recycle request has already been processed");
    }
    
     const user = await User.findById(recycle.user).select("name email gender").session(session);
     if(!user) throw new Error("User not found");

     const assay = await CollectorAssay.findById(collectorAssayId).session(session);
     if(!assay) throw new Error("Collector not found");

     recycle.status ="En Route"
     recycle.collector = collectorAssayId
     await recycle.save({session});

     assay.status = "En Route"
    await assay.save({ session });

    await session.commitTransaction();
    committed = true
    session.endSession();
   
    const subject = "Recycle Request En Route 🚚";
    const html = `
      <h1>Hi ${genTitle(user.gender)} ${user.name},</h1>
      <p>Good news! Your recycle request is currently en route and will be handled shortly.</p>
      <p><strong>Status:</strong> ${recycle.status}</p>
      <p>Please ensure the recycle is accessible for collection at the specified location.</p>
      <p>Thank you for your commitment to a cleaner and healthier environment 🌍.</p>
    `;
    await sendEmail(user.email, subject, html);

    return recycle;

  
  }catch(error){
    if(!committed){
      await session.abortTransaction();
    }
    session.endSession();
    console.error("Error en routing recycle request:", error.message);
    throw new Error("Failed to route recycle request. Please try again.");
  }
}

export const collectRecycleRequest = async (recycleId, collectorAssayId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let committed = false
  try{
    const recycle = await Recycling.findById(recycleId).session(session);
    if(!recycle) throw new Error("Recycle not found");
    if (["Accepted"].includes(recycle.status)) {
      throw new Error("Recycle hasn't been en route");
    }

    if (["Collected", "Rejected"].includes(recycle.status)) {
      throw new Error("Recycle request has already been processed");
    }
    const user = await User.findById(recycle.user).select("name email gender").session(session)
    if(!user) throw new Error("User not found")

    const assay = await CollectorAssay.findById(collectorAssayId).session(session)
    if(!assay) throw new Error("Collector not found")

    recycle.status ="Collected"
    recycle.collector = collectorAssayId
    await recycle.save({session})

    assay.status = "Collected"

    recycle.materials.forEach(({ recycleType, quantity }) => {
  
      const stat = assay.collectionStats.find(s => s.recycleType === recycleType);

      if (stat && recycle.status === "Collected") {
        stat.quantityCollected += quantity;
        stat.updatedAt = new Date();
      } else {
        assay.collectionStats.push({
          recycleType: recycleType,
          quantityCollected: quantity,
          updatedAt: new Date()
        });
      }
    });
   assay.totalQuantityCollected += recycle.materials.reduce((sum, m) => sum + m.quantity, 0);
   await assay.save({session})

  await session.commitTransaction();
  committed = true
  session.endSession();

  const subject = "Recycle Request Collected ✅";
  const html = `
    <h1>Hi ${genTitle(user.gender)} ${user.name},</h1>
    <p>We're pleased to inform you that your recycle request has been successfully collected.</p>
    <p><strong>Status:</strong> ${recycle.status}</p>
    <p><strong>Collection Time:</strong> ${new Date(assay.collectionDate).toLocaleString()}</p>
    <p><strong>Location:</strong> ${assay.serviceArea}</p>
    <p>We appreciate your commitment to a cleaner and healthier environment 🌍.</p>
    <p>If you have a moment, we'd love to hear your feedback to help us improve our service.</p>
    <p>You can submit a new request anytime through your dashboard.</p>
  `;
  await sendEmail(user.email, subject, html);

  return recycle;

  }catch(error){
  if (!committed) { 
    await session.abortTransaction()
  }
    session.endSession();
    console.error("Error collecting recycle request:", error.message);
    throw new Error("Failed to collect recycle request. Please try again.")
  }
}




  