import jwt from "jsonwebtoken";
import User from "../model/user.js";
import { createUser } from "./user.services.js";
import bcrypt from "bcrypt";
import { sendEmail } from './email.services.js';

export const register = async (name, email, password,phoneNumber, role, location, gender) => {
    try{
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        const user = createUser(
            name,
            email,
            hashedPassword,
            phoneNumber,
            role,
            location,
            gender
        )
        const subject = "Welcome to WasteWise! System Nigeria";
        const html = `<h1>Hi ${gender === "Male" ? "Mr" : gender === "Female" ? "Mrs/Miss" : 'Mx'} ${name},</h1><p>Thank you for registering. We're excited to have you.</p>`;
        await sendEmail(email, subject, html);
        return user;
    }catch(error){
        console.log(error);
        return error;
    }
};

export const login = async (email, password) => {
    try{
        const user = await User.findOne({email: email})
        if(!user){
            return null
        }

        const isMatch = await bcrypt.compare(password, user.password)
        console.log(isMatch);
        
        if(!isMatch){
            return null;
        };

        const token = jwt.sign({id: user.id, role: user.role}, process.env.JWT_SECRET, {
            expiresIn: "1hr"
        })
        const subject = `Welcome back ${user.gender === "Male" ? "Mr" : user.gender === "Female" ? "Mrs/Miss" : 'Mx'} ${user.name}`;
        const html = `<h1>Hi ${user.name},</h1><p>Thank you for getting back into the app with the intention to make our environment clean. We're excited to have you.</p>`;
        await sendEmail(user.email, subject, html);
        return { user, token }
    }catch(error){
        console.log(error)
        return error
    }
};
