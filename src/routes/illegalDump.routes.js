import { Router } from "express";

import {reportNewILLegalDump, fetchAllIllegalEntries ,fetchAllIllegalEntryById,viewIllegalStatus,editIllegalEntryById,removeIllegalEntry} from "../controller/illegalDump.controller.js";
import { protect } from "../middlerware/auth.middleware.js";

const router = Router();

router.post("/", reportNewILLegalDump);
router.get("/", fetchAllIllegalEntries);
router.get("/:id", fetchAllIllegalEntryById);
router.get("/status/:id", protect, viewIllegalStatus);
router.put("/:id", editIllegalEntryById);
router.delete("/:id", removeIllegalEntry);
export default router;