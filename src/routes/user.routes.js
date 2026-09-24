import { Router } from "express";
import { fetchAllUsers, fetchUserById, editUser,removeUser, deleteAll, updateProfilePicture } from "../controller/user.controller.js";
import { protect, requireAdmin } from "../middlerware/auth.middleware.js";

const router = Router();

router.get("/", protect, requireAdmin, fetchAllUsers)
router.get("/:id", protect,fetchUserById)
router.put("/:id", protect, editUser)
router.delete("/:id",protect, removeUser)
router.delete('/', protect, deleteAll)
router.put('/:id/profile-picture', updateProfilePicture);

export default router;