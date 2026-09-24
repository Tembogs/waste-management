import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notification.service.js";

export const getMyNotificationsController = async (req, res) => {
  try {
    const { unreadOnly, limit } = req.query;

    const notifications = await getUserNotifications(req.user._id, {
      unreadOnly: unreadOnly === "true",
      limit,
    });

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyUnreadNotificationCountController = async (
  req,
  res
) => {
  try {
    const count = await getUnreadNotificationCount(
      req.user._id
    );

    return res.status(200).json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error) {
    console.error(
      "Get unread notification count error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const markNotificationAsReadController = async (
  req,
  res
) => {
  try {
    const notification = await markNotificationAsRead(
      req.params.notificationId,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error(
      "Mark notification as read error:",
      error.message
    );

    const statusCode =
      error.message === "Notification not found"
        ? 404
        : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export const markAllNotificationsAsReadController = async (
  req,
  res
) => {
  try {
    const result = await markAllNotificationsAsRead(
      req.user._id
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Mark all notifications as read error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};