import { Router } from "express";
import { fetchAllUsers, fetchUserById, editUser,removeUser, deleteAll, updateProfilePicture } from "../controller/user.controller.js";
import { protect, admin, isHouser, isCollector, upload, } from "../middlerware/auth.middleware.js";

const router = Router();

router.get("/", protect, fetchAllUsers)
router.get("/:id", protect,fetchUserById)
router.put("/:id", protect,isHouser, editUser)
router.delete("/:id",protect, removeUser)
router.delete('/', protect, deleteAll)
router.put('/users/:id/profile-picture', upload.single('profilePicture'), updateProfilePicture);
export default router;