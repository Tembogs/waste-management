import express from "express";

import { protect } from "../middlerware/auth.middleware.js";
import { getMyNotificationsController, getMyUnreadNotificationCountController, markAllNotificationsAsReadController, markNotificationAsReadController } from "../controller/notification.controller.js";


const router = express.Router();

router.get("/",protect, getMyNotificationsController);

router.get("/unread-count", protect, getMyUnreadNotificationCountController);

router.patch("/:notificationId/read",protect, markNotificationAsReadController);

router.patch("/read-all",protect, markAllNotificationsAsReadController);

export default router;