import { createAdmin, createManagedUser, getAllCollectors, getAllManagedUsers, getCollectorDetails, setUserActiveStatus, updateCollectorServiceArea } from "../services/admin.service.js";
import { getAdminDashboardStats } from "../services/adminDashboard.service.js";
import { cancelIllegalDumpByAdmin, cancelRecyclingRequestByAdmin, cancelWasteRequestByAdmin, getAdminRequestById, getAllAdminRequests, reassignRequestService } from "../services/adminRequest.service.js";
import { approveRewardRedemption, getAllRewardRedemptions, getCurrentRewardSetting, getRewardRedemptionById, markRewardRedemptionAsPaid, rejectRewardRedemption, updateRewardSetting } from "../services/adminReward.Service.js";


export const createAdminController = async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      password,
      phoneNumber,
      location,
      gender,
      profilePicture,
      bio,
    } = req.body;

    const admin = await createAdmin(
      name,
      email,
      password,
      phoneNumber,
      location,
      gender,
      profilePicture,
      bio
    );

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
        role: admin.role,
        location: admin.location,
        gender: admin.gender,
        profilePicture: admin.profilePicture,
        bio: admin.bio,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const createManagedUserController = async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      password,
      phoneNumber,
      role,
      location,
      gender,
      profilePicture,
      bio,
    } = req.body;

    const user = await createManagedUser({
      name,
      email,
      password,
      phoneNumber,
      role,
      location,
      gender,
      profilePicture,
      bio,
    });

    return res.status(201).json({
      success: true,
      message: `${role} created successfully`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        location: user.location,
        gender: user.gender,
        profilePicture: user.profilePicture,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllManagedUsersController = async (
  req,
  res
) => {
  try {
    const users = await getAllManagedUsers();

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const setUserActiveStatusController = async (
  req,
  res
) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean",
      });
    }

    const user = await setUserActiveStatus(
      userId,
      isActive
    );

    return res.status(200).json({
      success: true,
      message: isActive
        ? "User activated successfully"
        : "User deactivated successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// admin to collectors only
export const getAllCollectorsController = async (
  req,
  res
) => {
  try {
    const collectors = await getAllCollectors();

    return res.status(200).json({
      success: true,
      count: collectors.length,
      data: collectors,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCollectorDetailsController = async (
  req,
  res
) => {
  try {
    const { collectorUserId } = req.params;

    const collector = await getCollectorDetails(
      collectorUserId
    );

    return res.status(200).json({
      success: true,
      data: collector,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCollectorServiceAreaController =
  async (req, res) => {
    try {
      const { collectorUserId } = req.params;
      const { serviceArea } = req.body;

      const result =
        await updateCollectorServiceArea(
          collectorUserId,
          serviceArea
        );

      return res.status(200).json({
        success: true,
        message:
          "Collector service area updated successfully",
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };


  // admin to request
  export const reassignRequestController = async (req, res) => {
  try {
    const { requestType, requestId } = req.params;
    const { collectorUserId } = req.body;

    if (!collectorUserId) {
      return res.status(400).json({
        success: false,
        message: "collectorUserId is required",
      });
    }

    const result = await reassignRequestService({
      requestType,
      requestId,
      collectorUserId,
    });

    return res.status(200).json({
      success: true,
      message: `${requestType} request reassigned successfully`,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllAdminRequestsController = async (req, res) => {
  try {
    const { requestType } = req.params;

    const requests = await getAllAdminRequests(requestType);

    return res.status(200).json({
      success: true,
      requestType,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const getAdminRequestByIdController = async (req, res) => {
  try {
    const { requestType, requestId } = req.params;

    const request = await getAdminRequestById(
      requestType,
      requestId
    );

    return res.status(200).json({
      success: true,
      requestType,
      data: request,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancelWasteRequestController = async (req, res) => {
  try {
    const { requestId } = req.params;

    const waste = await cancelWasteRequestByAdmin(requestId);

    return res.status(200).json({
      success: true,
      message: "Waste request cancelled successfully",
      data: waste,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancelRecyclingRequestController = async (req, res) => {
  try {
    const { requestId } = req.params;

    const recycling = await cancelRecyclingRequestByAdmin(requestId);

    return res.status(200).json({
      success: true,
      message: "Recycling request cancelled successfully",
      data: recycling,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const cancelIllegalDumpController = async (req, res) => {
  try {
    const { requestId } = req.params;

    const illegalDump = await cancelIllegalDumpByAdmin(requestId);

    return res.status(200).json({
      success: true,
      message: "Illegal dump report cancelled successfully",
      data: illegalDump,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// admin to rewards redemption

export const getAllRewardRedemptionsController = async (req, res) => {
  try {
    const redemptions = await getAllRewardRedemptions();

    return res.status(200).json({
      success: true,
      count: redemptions.length,
      data: redemptions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const getRewardRedemptionByIdController = async (req, res) => {
  try {
    const { redemptionId } = req.params;

    const redemption = await getRewardRedemptionById(redemptionId);

    return res.status(200).json({
      success: true,
      data: redemption,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const approveRewardRedemptionController = async (req, res) => {
  try {
    const { redemptionId } = req.params;

    const redemption = await approveRewardRedemption(
      redemptionId,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      message: "Reward redemption approved successfully",
      data: redemption,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectRewardRedemptionController = async (req, res) => {
  try {
    const { redemptionId } = req.params;
    const { rejectionReason } = req.body;

    const result = await rejectRewardRedemption(
      redemptionId,
      req.user._id,
      rejectionReason
    );

    return res.status(200).json({
      success: true,
      message: "Reward redemption rejected successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const markRewardRedemptionAsPaidController = async (
  req,
  res
) => {
  try {
    const { redemptionId } = req.params;

    const result = await markRewardRedemptionAsPaid(
      redemptionId,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      message: "Reward redemption marked as paid successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// admin to reward settings
export const getCurrentRewardSettingController = async (
  req,
  res
) => {
  try {
    const setting = await getCurrentRewardSetting();

    return res.status(200).json({
      success: true,
      data: setting,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateRewardSettingController = async (
  req,
  res
) => {
  try {
    const {
      pointsPerUnit,
      cashPerUnit,
      minimumRedemptionPoints,
      isActive,
    } = req.body;

    const setting = await updateRewardSetting(req.user._id, {
      pointsPerUnit,
      cashPerUnit,
      minimumRedemptionPoints,
      isActive,
    });

    return res.status(200).json({
      success: true,
      message: "Reward setting updated successfully",
      data: setting,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// admin dashboard


export const getAdminDashboardStatsController = async (req,res) => {
  try {
    const stats = await getAdminDashboardStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error(
      "Admin dashboard stats error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};