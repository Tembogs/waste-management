import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../model/user.js";
import CollectorAssay from "../model/collectorAssay.js";



export const createAdmin = async (
  name,
  email,
  password,
  phoneNumber,
  location,
  gender,
  profilePicture = null,
  bio = ""
) => {
  const session = await mongoose.startSession();

  let committed = false;

  try {
    session.startTransaction();

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedLocation = location.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { phoneNumber },
      ],
    }).session(session);

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        throw new Error("Email already registered");
      }

      throw new Error("Phone number already registered");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(
      password,
      salt
    );

    const admin = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phoneNumber,
      role: "Community_admin",
      location: normalizedLocation,
      gender,
      profilePicture,
      bio,
    });

    await admin.save({ session });

    await session.commitTransaction();
    committed = true;

    return admin;
  } catch (error) {
    if (!committed && session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(
      "Admin creation failed:",
      error.message
    );

    throw new Error(error.message);
  } finally {
    await session.endSession();
  }
};


export const createManagedUser = async ({
  name,
  email,
  password,
  phoneNumber,
  role,
  location,
  gender,
  profilePicture = null,
  bio = "",
}) => {
  const session = await mongoose.startSession();

  let committed = false;

  try {
    session.startTransaction();

    const allowedRoles = [
      "Houser",
      "Collector",
      "Community_admin",
    ];

    if (!allowedRoles.includes(role)) {
      throw new Error("Invalid user role");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedLocation = location.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { phoneNumber },
      ],
    }).session(session);

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        throw new Error("Email already registered");
      }

      throw new Error("Phone number already registered");
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phoneNumber,
      role,
      location: normalizedLocation,
      gender,
      profilePicture,
      bio,
    });

    await user.save({ session });

    // Automatically create collector profile
    if (role === "Collector") {
      const collectorAssay = new CollectorAssay({
        collector: user._id,
        serviceArea: normalizedLocation,
      });

      await collectorAssay.save({ session });
    }

    await session.commitTransaction();
    committed = true;

    return user;
  } catch (error) {
    if (!committed && session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(
      "Managed user creation failed:",
      error.message
    );

    throw new Error(error.message);
  } finally {
    await session.endSession();
  }
};

export const getAllManagedUsers = async () => {
  const users = await User.find({})
    .select("-password")
    .sort({ createdAt: -1 });

  return users;
};

export const setUserActiveStatus = async (
  userId,
  isActive
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  user.isActive = Boolean(isActive);

  await user.save();

  return user;
};

// admin to collectors only

export const getAllCollectors = async () => {
  const collectors = await User.find({
    role: "Collector",
  })
    .select("-password")
    .sort({ createdAt: -1 });

  return collectors;
};

export const getCollectorDetails = async (
  collectorUserId
) => {
  const collector = await User.findOne({
    _id: collectorUserId,
    role: "Collector",
  })
    .select("-password");

  if (!collector) {
    throw new Error("Collector not found");
  }

  const assay = await CollectorAssay.findOne({
    collector: collector._id,
  });

  if (!assay) {
    throw new Error(
      "Collector profile not found"
    );
  }

  return {
    user: collector,
    collectorAssay: assay,
  };
};

export const updateCollectorServiceArea = async (
  collectorUserId,
  serviceArea
) => {
  const normalizedLocation =
    serviceArea?.trim().toLowerCase();

  if (!normalizedLocation) {
    throw new Error("Service area is required");
  }

  const collector = await User.findOne({
    _id: collectorUserId,
    role: "Collector",
  });

  if (!collector) {
    throw new Error("Collector not found");
  }

  const assay = await CollectorAssay.findOne({
    collector: collector._id,
  });

  if (!assay) {
    throw new Error(
      "Collector profile not found"
    );
  }

  collector.location = normalizedLocation;
  assay.serviceArea = normalizedLocation;

  await collector.save();
  await assay.save();

  return {
    user: collector,
    collectorAssay: assay,
  };
};