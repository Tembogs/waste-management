
import { Router } from "express";
import {createNewWaste,fetchAllWasteEntries,fetchWasteEntryById,viewWasteStatus,editWaste,removeWasteEntry, acceptWasteRequest, rejectWasteRequest} from "../controller/waste.controllers.js";
import { isCollector, protect } from "../middlerware/auth.middleware.js";

const router = Router();

router.post("/", createNewWaste);
router.get("/", fetchAllWasteEntries);
router.get("/:id", fetchWasteEntryById);
router.get("/status/:id", protect,viewWasteStatus);
router.put("/:id", editWaste);
router.delete("/:id", removeWasteEntry);

// Collector Section
router.post("/accept",protect,isCollector,acceptWasteRequest);
router.post("/reject",protect,isCollector,rejectWasteRequest);

export default router;
