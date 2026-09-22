import mongoose from "mongoose";
import RewardSetting from "../model/RewardSetting.js";
import RewardRedemption from "../model/redemptionReward.js";
import User from "../model/user.js";
;

export const createRewardRedemption = async (
  userId,
  points,
  paymentMethod = "BankTransfer",
  accountName = null,
  accountNumber = null,
  bankName = null
) => {
  const session = await mongoose.startSession();

  let committed = false;

  try {
    session.startTransaction();

    /*
     * Validate points.
     */
    const requestedPoints = Number(points);

    if (!Number.isInteger(requestedPoints) || requestedPoints <= 0) {
      throw new Error(
        "Redemption points must be a positive whole number"
      );
    }

    /*
     * Get the user.
     */
    const user = await User.findById(userId).session(session);

    if (!user) {
      throw new Error("User not found");
    }

    /*
     * Get the active reward setting.
     */
    const setting = await RewardSetting.findOne({
      isActive: true,
    })
      .sort({ updatedAt: -1 })
      .session(session);

    if (!setting) {
      throw new Error(
        "Reward redemption is currently unavailable"
      );
    }

    /*
     * Check minimum redemption.
     */
    if (
      requestedPoints <
      setting.minimumRedemptionPoints
    ) {
      throw new Error(
        `Minimum redemption is ${setting.minimumRedemptionPoints} points`
      );
    }

    /*
     * Check available balance.
     */
    const availablePoints =
      user.rewardPointsBalance || 0;

    if (requestedPoints > availablePoints) {
      throw new Error(
        `Insufficient reward points. Available balance: ${availablePoints} points`
      );
    }

    /*
     * Validate payment method.
     */
    const allowedPaymentMethods = [
      "BankTransfer",
      "Airtime",
      "Data",
      "Voucher",
    ];

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      throw new Error("Invalid payment method");
    }

    /*
     * Bank transfer requires payment details.
     */
    if (paymentMethod === "BankTransfer") {
      if (!accountName?.trim()) {
        throw new Error(
          "Account name is required for bank transfer"
        );
      }

      if (!accountNumber?.trim()) {
        throw new Error(
          "Account number is required for bank transfer"
        );
      }

      if (!bankName?.trim()) {
        throw new Error(
          "Bank name is required for bank transfer"
        );
      }
    }

    /*
     * Calculate cash value.
     *
     * Example:
     * 100 points = ₦100
     * 500 points = ₦500
     */
    const cashValue =
      (requestedPoints / setting.pointsPerUnit) *
      setting.cashPerUnit;

    /*
     * Reserve the points.
     */
    user.rewardPointsBalance =
      availablePoints - requestedPoints;

    user.rewardPointsReserved =
      (user.rewardPointsReserved || 0) +
      requestedPoints;

    await user.save({ session });

    /*
     * Create the redemption request.
     */
    const redemption = new RewardRedemption({
      user: user._id,
      points: requestedPoints,
      cashValue,
      status: "Pending",
      paymentMethod,
      accountName: accountName?.trim() || null,
      accountNumber: accountNumber?.trim() || null,
      bankName: bankName?.trim() || null,
      rejectionReason: null,
      reviewedBy: null,
      reviewedAt: null,
      paidAt: null,
    });

    await redemption.save({ session });

    /*
     * Commit both operations together.
     */
    await session.commitTransaction();
    committed = true;

    return redemption;
  } catch (error) {
    if (!committed && session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(
      "Reward redemption creation failed:",
      error.message
    );

    throw new Error(error.message);
  } finally {
    await session.endSession();
  }
};