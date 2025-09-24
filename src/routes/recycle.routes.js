import { Router } from "express";
import {createNewRecycle, fetchAllRecycleEntries ,fetchRecycleEntryById,viewRecycleStatus,editRecycle,removeRecycleEntry} from "../controller/recycling.controllers.js";
import { protect } from "../middlerware/auth.middleware.js";  

const router = Router();

router.post("/", createNewRecycle);
router.get("/", fetchAllRecycleEntries);
router.get("/:id", fetchRecycleEntryById);
router.get("/status/:id", protect, viewRecycleStatus);
router.put("/:id", editRecycle);
router.delete("/:id", removeRecycleEntry);
export default router;