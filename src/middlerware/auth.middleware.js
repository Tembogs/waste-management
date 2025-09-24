import User from "../model/user.js";
import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1]
    }
    if(!token){
        return res.status(401).json({message: `not authorized, no token`})
    } 
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = await User.findById(decoded.id).select("-password")

        if(!req.user){
            return res.status(401).json({message: `could not find user`})
        }
        return next()

    }catch(error){
        console.log('token verificationfailed', error);
        return res.status(401).json({message:`not authorized token failed`})
    };
};

export const admin = async (req, res, next) => {
 const allowedRoles = ["Collector", "Community-admin"];

if (req.user && allowedRoles.includes(req.user.role)) {
  return next();
} else {
  return res.status(401).json({
    message: `Access denied. Role '${req.user?.role || "Unknown"}' is not authorized to perform this action.`
  });
}
   
};