import jwt from "jsonwebtoken";
import User from "../model/user.js";
import { createUser } from "./user.services.js";
import bcrypt from "bcrypt";

export const register = async (name, email, password,phoneNumber, role, location) => {
    try{
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        const user = createUser(
            name,
            email,
            hashedPassword,
            phoneNumber,
            role,
            location

        )
        return user
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
        return { user, token }
    }catch(error){
        console.log(error)
        return error
    }
};
