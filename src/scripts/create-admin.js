import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../model/user.js";
import bcrypt from "bcryptjs";



dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const email = "admin@ecocycle.com";
    const password = "Admin@12345";

    const existingAdmin = await User.findOne({
      email,
    });

    if (existingAdmin) {
      console.log(
        `User already exists: ${existingAdmin.email}`
      );
      console.log(`Role: ${existingAdmin.role}`);
      return;
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const admin = await User.create({
      name: "EcoCycle Admin",
      email,
      password: hashedPassword,
      phoneNumber: 8000000000,
      role: "Community_admin",
      location: "ibadan",
      gender: "Other",
      profilePicture: null,
      bio: "EcoCycle Community Administrator",
    });

    console.log("Admin created successfully");
    console.log({
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });
  } catch (error) {
    console.error(
      "Admin creation failed:",
      error.message
    );
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

createAdmin();