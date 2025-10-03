import { Router } from "express";
import { register, login } from "../controller/auth.controller.js";
import { protect, admin, isHouser, isCollector, } from "../middlerware/auth.middleware.js";
import { logout } from "../services/auth.services.js";

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post("/logout", protect, logout);


export default router;