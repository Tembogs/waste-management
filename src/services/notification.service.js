import Notification from "../model/Notification.js";


export const createNotification = async ({
  recipient,
  type,
  title,
  message,
  link = null,
  metadata = {},
}) => {
  if (!recipient) {
    throw new Error("Notification recipient is required");
  }

  if (!type) {
    throw new Error("Notification type is required");
  }

  if (!title?.trim()) {
    throw new Error("Notification title is required");
  }

  if (!message?.trim()) {
    throw new Error("Notification message is required");
  }

  const notification = await Notification.create({
    recipient,
    type,
    title: title.trim(),
    message: message.trim(),
    link,
    metadata,
  });

  return notification;
};

export const getUserNotifications = async (
  userId,
  { unreadOnly = false, limit = 20 } = {}
) => {
  const parsedLimit = Number(limit);

  const safeLimit =
    Number.isInteger(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 100)
      : 20;

  const query = {
    recipient: userId,
  };

  if (unreadOnly === true) {
    query.read = false;
  }

  return await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();
};

export const getUnreadNotificationCount = async (userId) => {
  return await Notification.countDocuments({
    recipient: userId,
    read: false,
  });
};

export const markNotificationAsRead = async (
  notificationId,
  userId
) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    recipient: userId,
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  if (!notification.read) {
    notification.read = true;
    notification.readAt = new Date();

    await notification.save();
  }

  return notification;
};

export const markAllNotificationsAsRead = async (userId) => {
  const result = await Notification.updateMany(
    {
      recipient: userId,
      read: false,
    },
    {
      $set: {
        read: true,
        readAt: new Date(),
      },
    }
  );

  return {
    modifiedCount: result.modifiedCount,
  };
};