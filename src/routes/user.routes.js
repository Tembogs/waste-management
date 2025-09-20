import { Router } from "express";
import { createNewUser, fetchAllUsers, fetchUserById, editUser,removeUser } from "../controller/user.controller.js";

const router = Router();
router.post("/createuser", createNewUser)
router.get("/", fetchAllUsers)
router.get("/:id", fetchUserById)
router.put("/:id", editUser)
router.delete("/:id", removeUser)
export default router;