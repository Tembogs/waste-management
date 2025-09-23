import { Router } from "express";
import { createNewUser, fetchAllUsers, fetchUserById, editUser,removeUser } from "../controller/user.controller.js";
import { protect, admin } from "../middlerware/auth.middleware.js";

const router = Router();
router.post("/createuser", createNewUser)
router.get("/", protect, admin, fetchAllUsers)
router.get("/:id", protect, fetchUserById)
router.put("/:id", protect, editUser)
router.delete("/:id",protect, admin, removeUser)
export default router;