import CollectorAssay from "../model/collectorAssay.js";
import User from "../model/user.js";
import Waste from "../model/wastecollection.js";
import Recycling from "../model/recycling.js";
import IllegalDump from "../model/illegalDump.js";


const requestModels = {
  Waste,
  Recycling,
  IllegalDump,
};

export const reassignRequestService = async ({
  requestType,
  requestId,
  collectorUserId,
}) => {
  const Model = requestModels[requestType];

  if (!Model) {
    throw new Error("Invalid request type");
  }

  const request = await Model.findById(requestId);

  if (!request) {
    throw new Error(`${requestType} request not found`);
  }

  const allowedStatuses = ["Pending", "Rejected"];

  if (!allowedStatuses.includes(request.status)) {
    throw new Error(
      `Request cannot be reassigned while status is ${request.status}`
    );
  }

  const collector = await User.findOne({
    _id: collectorUserId,
    role: "Collector",
  });

  if (!collector) {
    throw new Error("Collector not found");
  }

  if (collector.isActive === false) {
    throw new Error("Cannot assign request to an inactive collector");
  }

  const collectorAssay = await CollectorAssay.findOne({
    collector: collector._id,
  });

  if (!collectorAssay) {
    throw new Error("Collector profile not found");
  }

  request.collector = collectorAssay._id;

  await request.save();

  return {
    request,
    collector: {
      id: collector._id,
      name: collector.name,
      email: collector.email,
      serviceArea: collectorAssay.serviceArea,
    },
  };
};

// ==============================
// GET ALL ADMIN REQUESTS
// ==============================

export const getAllAdminRequests = async (requestType) => {
  const Model = requestModels[requestType];

  if (!Model) {
    throw new Error("Invalid request type");
  }

  const requests = await Model.find({})
    .sort({ createdAt: -1 })
    .lean();

  return requests;
};


// ==============================
// GET ONE ADMIN REQUEST
// ==============================

export const getAdminRequestById = async (
  requestType,
  requestId
) => {
  const Model = requestModels[requestType];

  if (!Model) {
    throw new Error("Invalid request type");
  }

  const request = await Model.findById(requestId).lean();

  if (!request) {
    throw new Error(`${requestType} request not found`);
  }

  return request;
};


export const cancelWasteRequestByAdmin = async (requestId) => {
  const waste = await Waste.findById(requestId);

  if (!waste) {
    throw new Error("Waste request not found");
  }

  const allowedStatuses = ["Pending", "Accepted"];

  if (!allowedStatuses.includes(waste.status)) {
    throw new Error(
      `Waste request cannot be cancelled while status is ${waste.status}`
    );
  }

  const user = await User.findById(waste.user).select(
    "_id name email"
  );

  if (!user) {
    throw new Error("User not found");
  }

  waste.status = "Cancelled";

  await waste.save();

  await createNotification({
    recipient: user._id,
    type: "REQUEST_CANCELLED",
    title: "Waste Request Cancelled",
    message: "Your waste collection request has been cancelled by an administrator.",
    link: `/dashboard/waste/${waste._id}`,
    metadata: {
      requestId: waste._id,
      requestType: "Waste",
    },
  });

  return waste;
};

export const cancelRecyclingRequestByAdmin = async (requestId) => {
  const recycle = await Recycling.findById(requestId);

  if (!recycle) {
    throw new Error("recycle request not found");
  }

  const allowedStatuses = ["Pending", "Accepted"];

  if (!allowedStatuses.includes(recycle.status)) {
    throw new Error(
      `Recycle request cannot be cancelled while status is ${recycle.status}`
    );
  }

  const user = await User.findById(recycle.user).select(
    "_id name email"
  );

  if (!user) {
    throw new Error("User not found");
  }

  recycle.status = "Cancelled";

  await recycle.save();

  await createNotification({
    recipient: user._id,
    type: "REQUEST_CANCELLED",
    title: "Recycle Request Cancelled",
    message: "Your recycle collection request has been cancelled by an administrator.",
    link: `/dashboard/recycle/${recycle._id}`,
    metadata: {
      requestId: recycle._id,
      requestType: "Recycling",
    },
  });

  return recycle;
};




export const cancelIllegalDumpByAdmin = async (requestId) => {
  const illegalDump = await IllegalDump.findById(requestId);

  if (!illegalDump) {
    throw new Error("illegalDump request not found");
  }

  const allowedStatuses =["Pending", "InReview"];

  if (!allowedStatuses.includes(illegalDump.status)) {
    throw new Error(
      `illegalDump request cannot be cancelled while status is ${illegalDump.status}`
    );
  }

  const user = await User.findById(waste.user).select(
    "_id name email"
  );

  if (!user) {
    throw new Error("User not found");
  }

  illegalDump.status = "Cancelled";

  await illegalDump.save();

  await createNotification({
    recipient: user._id,
    type: "REQUEST_CANCELLED",
    title: "Illegal-Dump Report Cancelled",
    message: "Your Illegal-Dump Report request has been cancelled by an administrator.",
    link: `/dashboard/waste/${illegalDump._id}`,
    metadata: {
      requestId: illegalDump._id,
      requestType: "IllegalDump",
    },
  });

  return illegalDump;
};