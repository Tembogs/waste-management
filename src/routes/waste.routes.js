
import { Router } from "express";
import {createNewWaste,fetchAllWasteEntries,fetchWasteEntryById,viewWasteStatus,editWaste,removeWasteEntry} from "../controller/waste.controllers.js";

const router = Router();

router.post("/", createNewWaste);
router.get("/", fetchAllWasteEntries);
router.get("/:id", fetchWasteEntryById);
router.get("/status/:id", viewWasteStatus);
router.put("/:id", editWaste);
router.delete("/:id", removeWasteEntry);

export default router;
