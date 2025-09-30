import { Router } from "express";
import {createNewRecycle, fetchAllRecycleEntries ,fetchRecycleEntryById,viewRecycleStatus,editRecycle,removeRecycleEntry} from "../controller/recycling.controllers.js";
import { admin, isHouser, protect } from "../middlerware/auth.middleware.js";  

const router = Router();

router.post("/", createNewRecycle);
router.get("/",protect, admin, fetchAllRecycleEntries);
router.get("/:id",protect, isHouser, fetchRecycleEntryById);
router.get("/status/:id",protect, isHouser,  viewRecycleStatus);
router.put("/:id",protect, isHouser,  editRecycle);
router.delete("/:id",protect, isHouser,  removeRecycleEntry);
export default router;