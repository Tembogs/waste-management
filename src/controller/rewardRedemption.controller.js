import { createRewardRedemption } from "../services/rewardRedemptionService.js";

export const createRewardRedemptionController = async (
  req,
  res
) => {
  try {
    const userId = req.user._id;

    const {
      points,
      paymentMethod,
      accountName,
      accountNumber,
      bankName,
    } = req.body;

    const redemption = await createRewardRedemption(
      userId,
      points,
      paymentMethod,
      accountName,
      accountNumber,
      bankName
    );

    return res.status(201).json({
      success: true,
      message:
        "Reward redemption request submitted successfully",
      data: redemption,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};