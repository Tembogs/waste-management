import express from "express";

import { createRewardRedemptionController } from "../controller/rewardRedemption.controller.js";
import { protect } from "../middlerware/auth.middleware.js";

const router = express.Router();

router.post(
  "/redeem", protect, createRewardRedemptionController
);

export default router;