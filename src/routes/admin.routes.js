import express from "express";
import { requireAdmin , protect, isCollector} from "../middlerware/auth.middleware.js";
import { approveRewardRedemptionController, cancelIllegalDumpController, cancelRecyclingRequestController, cancelWasteRequestController, createAdminController, createManagedUserController, getAdminDashboardStatsController, getAdminRequestByIdController, getAllAdminRequestsController, getAllCollectorsController, getAllManagedUsersController, getAllRewardRedemptionsController, getCollectorDetailsController, getCurrentRewardSettingController, getRewardRedemptionByIdController, markRewardRedemptionAsPaidController, reassignRequestController, rejectRewardRedemptionController, setUserActiveStatusController, updateCollectorServiceAreaController, updateRewardSettingController } from "../controller/admin.controller.js";

const router = express.Router();

router.post("/admins", protect, requireAdmin, createAdminController);

router.post( "/users", protect, requireAdmin, createManagedUserController);

router.get("/users", protect, requireAdmin, getAllManagedUsersController);

router.patch( "/users/:userId/status", protect, requireAdmin, setUserActiveStatusController);

// admin to collector only
router.get("/collectors", protect, requireAdmin, getAllCollectorsController);

router.get("/collectors/:collectorUserId",protect, requireAdmin, getCollectorDetailsController);

router.patch("/collectors/:collectorUserId/service-area", protect, requireAdmin, updateCollectorServiceAreaController);

// admin to request
router.patch("/requests/:requestType/:requestId/reassign", protect, requireAdmin, reassignRequestController);

router.get("/requests/:requestType", protect, requireAdmin, getAllAdminRequestsController);

router.get("/requests/:requestType/:requestId",protect, requireAdmin, getAdminRequestByIdController);

router.patch("/requests/waste/:requestId/cancel",protect, requireAdmin, cancelWasteRequestController);

router.patch("/requests/recycling/:requestId/cancel", protect, requireAdmin,cancelRecyclingRequestController);

router.patch("/requests/illegal/:requestId/cancel", protect, requireAdmin, cancelIllegalDumpController);

// admin to reward redemption
router.get("/rewards/redemptions", protect, requireAdmin, getAllRewardRedemptionsController);

router.get("/rewards/redemptions/:redemptionId", protect, requireAdmin, getRewardRedemptionByIdController);

router.patch("/rewards/redemptions/:redemptionId/approve", protect, requireAdmin, approveRewardRedemptionController);

router.patch("/rewards/redemptions/:redemptionId/reject", protect, requireAdmin, rejectRewardRedemptionController);

router.patch( "/rewards/redemptions/:redemptionId/pay", protect, requireAdmin, markRewardRedemptionAsPaidController);

// admin to reward settings
router.get("/rewards/settings", protect, requireAdmin, getCurrentRewardSettingController);

router.patch("/rewards/settings", protect, requireAdmin, updateRewardSettingController);

// admin dashboard
router.get("/dashboard/stats", protect, requireAdmin, getAdminDashboardStatsController);

export default router;