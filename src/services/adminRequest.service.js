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

  waste.status = "Cancelled";

  await waste.save();

  return waste;
};

export const cancelRecyclingRequestByAdmin = async (requestId) => {
  const recycling = await Recycling.findById(requestId);

  if (!recycling) {
    throw new Error("Recycling request not found");
  }

  const allowedStatuses = ["Pending", "Accepted"];

  if (!allowedStatuses.includes(recycling.status)) {
    throw new Error(
      `Recycling request cannot be cancelled while status is ${recycling.status}`
    );
  }

  recycling.status = "Cancelled";

  await recycling.save();

  return recycling;
};


export const cancelIllegalDumpByAdmin = async (requestId) => {
  const illegalDump = await IllegalDump.findById(requestId);

  if (!illegalDump) {
    throw new Error("Illegal dump report not found");
  }

  const allowedStatuses = ["Pending", "InReview"];

  if (!allowedStatuses.includes(illegalDump.status)) {
    throw new Error(
      `Illegal dump report cannot be cancelled while status is ${illegalDump.status}`
    );
  }

  illegalDump.status = "Cancelled";

  await illegalDump.save();

  return illegalDump;
};