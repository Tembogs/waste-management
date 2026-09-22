import User from "../model/user.js";
import jwt from "jsonwebtoken";
import multer from 'multer';

const storage = multer.memoryStorage(); // Store file in memory
export const upload = multer({ storage });
 

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      message: "Not authorized, no token",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        message: "Could not find user",
      });
    }

    if (req.user.isActive === false) {
      return res.status(403).json({
        message: "Account is deactivated. Please contact an administrator.",
      });
    }

    return next();
  } catch (error) {
    console.log("Token verification failed", error);

    return res.status(401).json({
      message: "Not authorized, token failed",
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Not authorized",
    });
  }

  if (req.user.role !== "Community_admin") {
    return res.status(403).json({
      message: "Access denied. Admin privileges are required.",
    });
  }

  next();
};

export const isCollector = (req, res, next) => {
  if (req.user.role !== "Collector") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

export const isHouser =(req, res, next) => {
  if (req.user.role !== "Houser"){
   return res.status(403).json({message: "Access denied"});
  }
   next();
}

export const isBoth = (req, res, next) => {
    if (req.user.role === "Houser" || req.user.role === "Collector") {
      return next();
    } else {
      return res.status(403).json({ message: "Access denied" });
    }
  };

  
