import jwt from "jsonwebtoken";
import User from "../model/user.js";
import bcrypt from "bcrypt";
import { sendEmail } from './email.services.js';
import CollectorAssay from "../model/collectorAssay.js";
import mongoose from "mongoose";

 const genTitle = (gender) => gender === 'Male' ? "Mr" : gender === "Female" ?"Mrs/Miss" : "Mx"

export const register = async (name, email, password, phoneNumber, role, location, gender) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) throw new Error("Email already registered");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const normalizedLocation = location.trim().toLowerCase();

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      role,
      location: normalizedLocation,
      gender
    });

    await user.save({ session });

    if (role === 'Collector') {
      const collectorAssay = new CollectorAssay({
        user: user._id,
        collector: user._id,
        serviceArea: normalizedLocation
      });
      await collectorAssay.save({ session });
    }

    const subject = "Welcome to WasteWise! System Nigeria";
    const html = `
      <h1>Hi ${genTitle(gender)} ${name},</h1>
      <p>Thank you for registering. We're excited to have you.</p>
    `;
    await sendEmail(email, subject, html);

    await session.commitTransaction();
    session.endSession();

    return user;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Registration error:", error.message);
    return null;
  }
};



export const login = async (email, password) => {
  try {
    const user = await User.findOne({ email });
    if (!user) return { error: "User not found" };

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return { error: "Invalid password" };

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const subject = `Welcome back ${genTitle(user.gender)} ${user.name}`;
    const html = `
      <h1>Hi ${user.name},</h1>
      <p>Thank you for getting back into the app with the intention to make our environment clean. We're excited to have you.</p>
    `;
    await sendEmail(user.email, subject, html);

    return { user, token };
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
