import jwt from "jsonwebtoken";
import User from "../model/user.js";
import bcrypt from "bcrypt";
import { sendEmail } from './email.services.js';
import CollectorAssay from "../model/collectorAssay.js";
import mongoose from "mongoose";

 const genTitle = (gender) => gender === 'Male' ? "Mr" : gender === "Female" ?"Mrs/Miss" : "Mx"

export const register = async (
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
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phoneNumber,
      role: "Houser",
      location: normalizedLocation,
      gender,
      profilePicture,
      bio,
    });

    await user.save({ session });

    await session.commitTransaction();

    return user;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Registration error:", error.message);

    throw new Error(error.message);
  } finally {
    await session.endSession();
  }
};



export const login = async (email, password) => {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) return { error: "User not found" };

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return { error: "Invalid password" };

    // ...rest of your existing login code

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    let collectorAssay = null;

    if (user.role === "Collector") {
      collectorAssay = await CollectorAssay.findOne({ collector: user._id })
        .select("_id")
        .lean();
    }
     console.log("CollectorAssay found:", collectorAssay);

    // const subject = `Welcome back ${genTitle(user.gender)} ${user.name}`;
    // const html = `
    //   <h1>Hi ${user.name},</h1>
    //   <p>Thank you for getting back into the app with the intention to make our environment clean. We're excited to have you.</p>
    // `;
    // await sendEmail(user.email, subject, html);

    const userData = {
      ...user.toObject(),
      collectorAssayId: collectorAssay?._id || null,
    };

    return { user: userData, token };
  } catch (error) {
    console.error("Login error:", error.message);
    return { error: "Login failed" };
  }
};


export const logout = async (req, res) => {
  try {
    // If you're using cookies to store JWT
    res.clearCookie("token");
    res.status(200).json({ message: "Successfully signed out" });

    // Optionally, send a goodbye email
    const user = req.user; 
    const subject = `Goodbye ${genTitle(user.gender)} ${user.name}`;
    const html = `
      <h1>Hi ${user.name},</h1>
      <p>You've successfully signed out. We hope to see you again soon!</p>
    `;
    await sendEmail(user.email, subject, html);
  } catch (error) {
    console.error("Logout error:", error.message);
    res.status(500).json({ error: "Logout failed" });
  }
};
