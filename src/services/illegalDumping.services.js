import IllegalDump from "../model/illegalDump.js";
import Reward from "../model/rewards.js";
import User from "../model/user.js";
import { sendEmail } from "./email.services.js";
import CollectorAssay from "../model/collectorAssay.js";
import mongoose from "mongoose";


const genTitle = (gender) => gender === "Male" ? "Mr" : gender === "Female" ? "Mrs/Miss" : 'Mx'

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
            const basePoints = materialPoints[item.dumpType] || 0;
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
      rewardItem: "Illegal Dumping Report Request Bonus 💫✨",
      activityType: "IllegalDumpReport"
    });
    
    await reward.save();

     const normalizedLocation = illegalData.location?.trim().toLowerCase();
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

    const illegalRequest = new IllegalDump({
      reporter: user._id,
      materials:illegalData.materials,
      description: illegalData.description,
      location: illegalData.location,
      status: illegalData.status || "Pending",
      reportDate: new Date(),
      Reward:reward._id,
      collector: assignedCollector?._id || null
    });

    await illegalRequest.save();
   const genTitle = (gender) => gender === "Male" ? "Mr" : gender === "Female" ? "Mrs/Miss" : 'Mx'
    const materialSummary = illegalData.materials.map((item, index) => {
      return `${index + 1}. ${item.quantity} ${item.unit} of ${item.dumpType}`;
    }).join('<br>');

    // 📧 Email to user
    const subject = "🚨 Illegal Dump Report Received";
    const html = `
      <h1>Hello ${genTitle(user.gender)} ${user.name},</h1>
      <p>Thanks for reporting an illegal dumping incident. Here's what we received:</p>
      <p><strong>Location:</strong> ${illegalRequest.location}</p>
      <p><strong>Description:</strong> ${illegalRequest.description}</p>
      <p><strong>Materials:</strong><br>${materialSummary}</p>
      <p><strong>Status:</strong> ${illegalRequest.status}</p>
      <p><em>Reported on: ${illegalRequest.reportDate.toLocaleString()}</em></p>
       <p>Points-Earned: ${reward.pointsEarned} pts </p>
           <p>Total Points-Earned: ${user.Reward} </p>
       <p>Collector-Assigned: ${
      collectorUser
        ? `${ genTitle(collectorUser.gender)} ${collectorUser.name}`
        : "Not yet assigned"
    }.</p>
    `;

    await sendEmail(user.email, subject, html);
    console.log(`Email sent to ${user.email}`);

     // 📧 Email to assigned collector
         if (collectorUser?.email) {
            const collectorSubject = "New illegal dumping report Request Assigned 🚛";
            const collectorHtml = `
              <h1>Hi ${ genTitle(collectorUser.gender)} ${collectorUser.name},</h1>
              <p>A new dumping report request has been assigned to you in <strong>${assignedCollector.serviceArea}</strong>.</p>
              <p>Please check your dashboard for details.</p>
            `;
            await sendEmail(collectorUser.email, collectorSubject, collectorHtml);
          }

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
            const basePoints = materialPoints[item.dumpType] || 0;
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
      const materialSummary =updates.materials?.map((item, index) => {
          return `${index + 1}. ${item.quantity} ${item.unit || 'units'} of ${item.dumpType}`;
        }).join('<br>') || 'No materials listed';

    
      // Compose email
      const genTitle = (gender)=> gender === "Male" ? "Mr" : gender ==="Female" ? "Mrs/Miss" : "Mx"
      const subject = "New Illegal Request ♻️";
      const html = `
        <h1>Hi ${genTitle(illegalEntry.reporter.gender)} ${illegalEntry.reporter.name} 👋</h1>
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
      if (!illegalEntry) return null;
    
      if (illegalEntry.Reward) {
        await Reward.findByIdAndDelete(illegalEntry.Reward);
      }
      await IllegalDump.findByIdAndDelete(id);
  return illegalEntry;
} 


// Collector- Section
export const acceptDumpRequestService = async (dumpId, collectorAssayId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let committed = false;

  try {
    const dump = await IllegalDump.findById(dumpId).session(session);
    if (!dump) throw new Error("IllegalDump report request not found");

    if (["InReview", "Resolved", "Rejected"].includes(dump.status)) {
      throw new Error("IllegalDump report request has already been processed");
    }

    const user = await User.findById(dump.reporter)
      .select("name email gender")
      .session(session);
    if (!user) throw new Error("User not found");

    const assay = await CollectorAssay.findById(collectorAssayId).session(session);
    if (!assay) throw new Error("Collector assay not found");

    // Update dump
    dump.status = "InReview";
    dump.collector = collectorAssayId;
    await dump.save({ session });

    // Update assay
    assay.status = "Accepted";
    assay.acceptedRequests += 1;

    dump.materials.forEach(({ dumpType, quantity }) => {
      const stat = assay.collectionStats.find(s => s.dumpType === dumpType);
      if (stat) {
        stat.quantityCollected += quantity;
        stat.updatedAt = new Date();
      } else {
        assay.collectionStats.push({
          dumpType,
          quantityCollected: quantity,
          updatedAt: new Date()
        });
      }
    });

    assay.totalQuantityCollected += dump.materials.reduce((sum, m) => sum + m.quantity, 0);
    await assay.save({ session });

    await session.commitTransaction();
    committed = true;
    session.endSession();

    // Compose and send email after transaction
    const subject = "IllegalDump Report Request Under Review 🔍";
    const html = `
      <h1>Hi ${genTitle(user.gender)} ${user.name},</h1>
      <p>We’ve received your illegal dumping report and it's currently under review by our team.</p>
      <p>We appreciate your effort in helping maintain a cleaner environment! 🌍♻️</p>
      <p>If you have any questions or additional details to share, feel free to reply to this email 📩.</p>
    `;
    await sendEmail(user.email, subject, html);

    return dump;
  } catch (error) {
    if (!committed) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error(`Error accepting dump request ${dumpId} with assay ${collectorAssayId}:`, error.message);
    throw new Error("Failed to accept dumping report request. Please try again.");
  }
};


export const rejectDumpRequestService = async (dumbId, collectorAssayId, rejectionReason = "") => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let committed = false

  try {
    const dumb = await IllegalDump.findById(dumbId).session(session);
    if (!dumb) throw new Error("illegal dumbing report request not found");
    if (dumb.status === "In Review" || dumb.status === "Resolved") {
      throw new Error("illegal dumbing report request has already been processed");
    }
    if (!rejectionReason || rejectionReason.trim() === "") {
      throw new Error("Rejection reason is required when rejecting a illegal dumbing report");
    }

    const user = await User.findById(dumb.reporter).select("name email gender").session(session);
    if (!user) throw new Error("User not found");

    const assay = await CollectorAssay.findById(collectorAssayId ).session(session);
    if (!assay) throw new Error("Collector assay not found");

    // Update dumb
    dumb.status = "Rejected";
    dumb.collector = null;
    dumb.rejectionReason = rejectionReason;
    await dumb.save({ session });

    // Update assay
    assay.status = "Rejected";
    assay.rejectedRequests += 1;
    await assay.save({ session });

    await session.commitTransaction();
    committed = true
    session.endSession();

    // Compose and send email after transaction
    const genTitle = (gender)=> gender === "Male" ? "Mr" : gender === "Female" ? "Mrs/Miss" : 'Mx'
    const subject = "Illegal dumping report  Request Rejected ❌";
    const html = `
      <h1>Hi ${genTitle(user.gender)} ${user.name},</h1>
      <p>We're sorry to inform you that your recent illegal dumbing report request has been rejected.</p>
      <p><strong>Reason:</strong> ${rejectionReason}</p>
      <p>You can review your request and submit a new one if needed.</p>
      <p>Thank you for your continued efforts toward a cleaner environment 🌍.</p>
    `;
    await sendEmail(user.email, subject, html);

    return dump;
  } catch (error) {
   if (!committed)  {
      await session.abortTransaction()
    };
    session.endSession();
    console.error("Error rejecting illegal dumping report request:", error.message);
    throw new Error("Failed to reject illegal dumping report request. Please try again.");
  }
};

export const resolveDumpRequestService = async (dumbId, collectorAssayId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  let committed = false

  try {
     const dump = IllegalDump.findById(dumbId).session(session)
     if(!dump) throw new Error ("dump request not found ")
    if(!dump) throw new Error ("Recycle Not Found")
    if (!["InReview"].includes(dump.status)) 
      {
        throw new Error("Dump hasn't been review");
      }

    if (["Resolved", "Rejected"].includes(dump.status)) {
      throw new Error("Dump request has already been processed");
    }
    
    const user = User.findById(dump.reporter).select("name email gender").session(session)
    if(!user) throw new Error('User not found')

    const assay = CollectorAssay.findById(collectorAssayId).session(session)
    if(!assay) throw new Error("Collector not Fouund")

    dump.status = "Resolved";
    dump.collector = collectorAssayId;
    await dump.save({session})

    assay.status = "Collected";
    await assay.save({session})

    await session.commitTransaction();
    committed = true
    session.endSession();

    const subject = "IllegalDump Report Request Resolved ✅";
    const html = `
      <h1>Hi ${genTitle(user.gender)} ${user.name},</h1>
      <p>Great news! Your illegal dumping report has been successfully resolved. The reported materials have been collected and properly disposed of.</p>
      <p>Thank you for taking action to keep our environment clean and safe! 🌍♻️</p>
      <p>If you have any further concerns or need assistance, feel free to reply to this email 📩.</p>
    `;
    await sendEmail(user.email, subject, html);
    
  } catch (error) {
      if(!committed){
        await session.abortTransaction();
      }
    session.endSession();
    console.error("Error in resolving dumping report request:", error.message);
    throw new Error("Failed resolving dumping report request. Please try again.");
    
  }
}
