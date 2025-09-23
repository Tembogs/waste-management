
import { Router } from "express";
import {createNewWaste,fetchAllWasteEntries,fetchWasteEntryById,viewWasteStatus,editWaste,removeWasteEntry} from "../controller/waste.controllers.js";
import { protect } from "../middlerware/auth.middleware.js";

const router = Router();

router.post("/", createNewWaste);
router.get("/", fetchAllWasteEntries);
router.get("/:id", fetchWasteEntryById);
router.get("/status/:id", protect,viewWasteStatus);
router.put("/:id", editWaste);
router.delete("/:id", removeWasteEntry);

export default router;
