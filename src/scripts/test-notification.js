import dotenv from "dotenv";
import mongoose from "mongoose";

import {
  createNotification,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notification.service.js";
import User from "../model/user.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const user = await User.findOne({});

    if (!user) {
      throw new Error("No user found in database");
    }

    console.log("Testing with user:", user.name);

    // 1. Create notification
    const created = await createNotification({
      recipient: user._id,
      type: "REQUEST_CREATED",
      title: "Test notification",
      message:
        "This is a test notification from the EcoCycle backend.",
      link: "/dashboard",
      metadata: {
        test: true,
        source: "notification-service-test",
      },
    });

    console.log("\n1. CREATED:");
    console.log(created);

    // 2. Get notifications
    const notifications = await getUserNotifications(
      user._id
    );

    console.log("\n2. USER NOTIFICATIONS:");
    console.log(notifications);

    // 3. Count unread
    const unreadBefore =
      await getUnreadNotificationCount(user._id);

    console.log("\n3. UNREAD COUNT BEFORE:");
    console.log(unreadBefore);

    // 4. Mark one as read
    const marked = await markNotificationAsRead(
      created._id,
      user._id
    );

    console.log("\n4. MARKED AS READ:");
    console.log({
      id: marked._id,
      read: marked.read,
      readAt: marked.readAt,
    });

    // 5. Count unread again
    const unreadAfter =
      await getUnreadNotificationCount(user._id);

    console.log("\n5. UNREAD COUNT AFTER:");
    console.log(unreadAfter);

    // 6. Create two more test notifications
    await createNotification({
      recipient: user._id,
      type: "REWARD_EARNED",
      title: "Reward earned",
      message: "You earned 200 reward points.",
      metadata: {
        pointsEarned: 200,
      },
    });

    await createNotification({
      recipient: user._id,
      type: "REQUEST_COLLECTED",
      title: "Waste collected",
      message:
        "Your waste collection has been completed successfully.",
      metadata: {
        requestType: "Waste",
      },
    });

    // 7. Mark all as read
    const markedAll = await markAllNotificationsAsRead(
      user._id
    );

    console.log("\n6. MARK ALL AS READ:");
    console.log(markedAll);

    const finalUnread =
      await getUnreadNotificationCount(user._id);

    console.log("\n7. FINAL UNREAD COUNT:");
    console.log(finalUnread);

    console.log("\nNotification service test passed.");
  } catch (error) {
    console.error(
      "\nNotification service test failed:",
      error
    );
  } finally {
    await mongoose.disconnect();
  }
};

run();