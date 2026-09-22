import mongoose from "mongoose";
import RewardRedemption from "../model/redemptionReward.js";
import User from "../model/user.js";
import RewardSetting from "../model/RewardSetting.js";


export const getAllRewardRedemptions = async () => {
  const redemptions = await RewardRedemption.find({})
    .populate("user", "name email phoneNumber")
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 });

  return redemptions;
};

export const getRewardRedemptionById = async (redemptionId) => {
  const redemption = await RewardRedemption.findById(redemptionId)
    .populate("user", "name email phoneNumber")
    .populate("reviewedBy", "name email");

  if (!redemption) {
    throw new Error("Reward redemption not found");
  }

  return redemption;
};

export const approveRewardRedemption = async (
  redemptionId,
  adminUserId
) => {
  const session = await mongoose.startSession();
  let committed = false;

  try {
    session.startTransaction();

    const redemption = await RewardRedemption.findById(
      redemptionId
    ).session(session);

    if (!redemption) {
      throw new Error("Reward redemption not found");
    }

    if (redemption.status !== "Pending") {
      throw new Error(
        `Only pending redemptions can be approved. Current status: ${redemption.status}`
      );
    }

    redemption.status = "Approved";
    redemption.reviewedBy = adminUserId;
    redemption.reviewedAt = new Date();
    redemption.rejectionReason = null;

    await redemption.save({ session });

    await session.commitTransaction();
    committed = true;

    return redemption;
  } catch (error) {
    if (!committed && session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(
      "Reward redemption approval failed:",
      error.message
    );

    throw new Error(error.message);
  } finally {
    await session.endSession();
  }
};

export const rejectRewardRedemption = async (
  redemptionId,
  adminUserId,
  rejectionReason
) => {
  const session = await mongoose.startSession();
  let committed = false;

  try {
    session.startTransaction();

    if (!rejectionReason?.trim()) {
      throw new Error("Rejection reason is required");
    }

    const redemption = await RewardRedemption.findById(
      redemptionId
    ).session(session);

    if (!redemption) {
      throw new Error("Reward redemption not found");
    }

    if (redemption.status !== "Pending") {
      throw new Error(
        `Only pending redemptions can be rejected. Current status: ${redemption.status}`
      );
    }

    const user = await User.findById(redemption.user).session(session);

    if (!user) {
      throw new Error("User associated with redemption not found");
    }

    const points = redemption.points;

    const reservedPoints = user.rewardPointsReserved || 0;

    if (reservedPoints < points) {
      throw new Error(
        "User reserved reward points are insufficient for this rejection"
      );
    }

    user.rewardPointsBalance =
      (user.rewardPointsBalance || 0) + points;

    user.rewardPointsReserved =
      reservedPoints - points;

    await user.save({ session });

    redemption.status = "Rejected";
    redemption.reviewedBy = adminUserId;
    redemption.reviewedAt = new Date();
    redemption.rejectionReason = rejectionReason.trim();

    await redemption.save({ session });

    await session.commitTransaction();
    committed = true;

    return {
      redemption,
      user: {
        id: user._id,
        rewardPointsBalance: user.rewardPointsBalance,
        rewardPointsReserved: user.rewardPointsReserved,
      },
    };
  } catch (error) {
    if (!committed && session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(
      "Reward redemption rejection failed:",
      error.message
    );

    throw new Error(error.message);
  } finally {
    await session.endSession();
  }
};

export const markRewardRedemptionAsPaid = async (
  redemptionId,
  adminUserId
) => {
  const session = await mongoose.startSession();
  let committed = false;

  try {
    session.startTransaction();

    const redemption = await RewardRedemption.findById(
      redemptionId
    ).session(session);

    if (!redemption) {
      throw new Error("Reward redemption not found");
    }

    if (redemption.status !== "Approved") {
      throw new Error(
        `Only approved redemptions can be marked as paid. Current status: ${redemption.status}`
      );
    }

    const user = await User.findById(redemption.user).session(session);

    if (!user) {
      throw new Error("User associated with redemption not found");
    }

    const points = redemption.points;
    const reservedPoints = user.rewardPointsReserved || 0;

    if (reservedPoints < points) {
      throw new Error(
        "User reserved reward points are insufficient to complete this payment"
      );
    }

    user.rewardPointsReserved = reservedPoints - points;

    await user.save({ session });

    redemption.status = "Paid";
    redemption.paidAt = new Date();

    // Keep the admin who approved/processed the redemption.
    // If no reviewer exists for any reason, record the current admin.
    if (!redemption.reviewedBy) {
      redemption.reviewedBy = adminUserId;
      redemption.reviewedAt = new Date();
    }

    await redemption.save({ session });

    await session.commitTransaction();
    committed = true;

    return {
      redemption,
      user: {
        id: user._id,
        rewardPointsBalance: user.rewardPointsBalance,
        rewardPointsReserved: user.rewardPointsReserved,
      },
    };
  } catch (error) {
    if (!committed && session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(
      "Reward redemption payment failed:",
      error.message
    );

    throw new Error(error.message);
  } finally {
    await session.endSession();
  }
};

export const getCurrentRewardSetting = async () => {
  const setting = await RewardSetting.findOne({})
    .sort({ updatedAt: -1 })
    .populate("updatedBy", "name email");

  if (!setting) {
    throw new Error("Reward setting not found");
  }

  return setting;
};

export const updateRewardSetting = async (
  adminUserId,
  {
    pointsPerUnit,
    cashPerUnit,
    minimumRedemptionPoints,
    isActive,
  }
) => {
  const session = await mongoose.startSession();
  let committed = false;

  try {
    session.startTransaction();

    const parsedPointsPerUnit = Number(pointsPerUnit);
    const parsedCashPerUnit = Number(cashPerUnit);
    const parsedMinimumRedemptionPoints = Number(
      minimumRedemptionPoints
    );

    if (
      !Number.isFinite(parsedPointsPerUnit) ||
      parsedPointsPerUnit <= 0
    ) {
      throw new Error("pointsPerUnit must be greater than 0");
    }

    if (
      !Number.isFinite(parsedCashPerUnit) ||
      parsedCashPerUnit < 0
    ) {
      throw new Error("cashPerUnit cannot be negative");
    }

    if (
      !Number.isInteger(parsedMinimumRedemptionPoints) ||
      parsedMinimumRedemptionPoints <= 0
    ) {
      throw new Error(
        "minimumRedemptionPoints must be a positive whole number"
      );
    }

    if (typeof isActive !== "boolean") {
      throw new Error("isActive must be a boolean");
    }

    const setting = await RewardSetting.findOne({})
      .sort({ updatedAt: -1 })
      .session(session);

    if (!setting) {
      throw new Error("Reward setting not found");
    }

    setting.pointsPerUnit = parsedPointsPerUnit;
    setting.cashPerUnit = parsedCashPerUnit;
    setting.minimumRedemptionPoints =
      parsedMinimumRedemptionPoints;
    setting.isActive = isActive;
    setting.updatedBy = adminUserId;

    await setting.save({ session });

    await session.commitTransaction();
    committed = true;

    return setting;
  } catch (error) {
    if (!committed && session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(
      "Reward setting update failed:",
      error.message
    );

    throw new Error(error.message);
  } finally {
    await session.endSession();
  }
};