
import { Router } from "express";
import {createNewWaste,fetchAllWasteEntries,fetchWasteEntryById,viewWasteStatus,editWaste,removeWasteEntry, acceptWasteRequest, rejectWasteRequest, collectorView} from "../controller/waste.controllers.js";
import { admin, isCollector, isHouser, protect } from "../middlerware/auth.middleware.js";

const router = Router();

router.post("/",protect, isHouser, createNewWaste);
router.get("/",protect, fetchAllWasteEntries);
router.get("/:id",protect, isHouser, fetchWasteEntryById);
router.get("/status/:id", protect,isHouser, viewWasteStatus);
router.put("/:id",protect, isHouser, editWaste);
router.delete("/:id",protect, isHouser, removeWasteEntry);

// Collector Section
router.post("/accept",protect,isCollector,acceptWasteRequest);
router.post("/reject",protect,isCollector,rejectWasteRequest);
router.get("/collector/:id",protect,isCollector,collectorView);

export default router;
