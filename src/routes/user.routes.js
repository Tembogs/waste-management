import { Router } from "express";
import { createNewUser, fetchAllUsers, fetchUserById, editUser,removeUser } from "../controller/user.controller.js";
import { protect, admin, isHouser, isCollector, } from "../middlerware/auth.middleware.js";

const router = Router();
router.post("/createuser", createNewUser)
router.get("/", protect, fetchAllUsers)
router.get("/:id", protect,fetchUserById)
router.put("/:id", protect,isHouser, editUser)
router.delete("/:id",protect, admin, removeUser)
export default router;