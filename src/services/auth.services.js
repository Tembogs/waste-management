import jwt from "jsonwebtoken";
import User from "../model/user.js";
import { createUser } from "./user.services.js";
import bcrypt from "bcrypt";
import { sendEmail } from './email.services.js';
import CollectorAssay from "../model/collectorAssay.js";

export const register = async (name, email, password, phoneNumber, role, location, gender) => {
  try {
    const existingUser = await User.findOne({ email });
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

    await user.save();

    if (role === 'Collector') {
      const collectorAssay = new CollectorAssay({
        user: user._id,
        collector: user._id,
        serviceArea: normalizedLocation
      });
      await collectorAssay.save();
    }

    const subject = "Welcome to WasteWise! System Nigeria";
    const html = `
      <h1>Hi ${gender === "Male" ? "Mr" : gender === "Female" ? "Mrs/Miss" : 'Mx'} ${name},</h1>
      <p>Thank you for registering. We're excited to have you.</p>
    `;
    await sendEmail(email, subject, html);

    return user;
  } catch (error) {
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

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const subject = `Welcome back ${user.gender === "Male" ? "Mr" : user.gender === "Female" ? "Mrs/Miss" : 'Mx'} ${user.name}`;
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
