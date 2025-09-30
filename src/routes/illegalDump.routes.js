import { Router } from "express";

import {reportNewILLegalDump, fetchAllIllegalEntries ,fetchAllIllegalEntryById,viewIllegalStatus,editIllegalEntryById,removeIllegalEntry} from "../controller/illegalDump.controller.js";
import { admin, isHouser, protect } from "../middlerware/auth.middleware.js";

const router = Router();

router.post("/", reportNewILLegalDump);
router.get("/", protect, admin, fetchAllIllegalEntries);
router.get("/:id",protect, isHouser,  fetchAllIllegalEntryById);
router.get("/status/:id", protect, viewIllegalStatus);
router.put("/:id",protect, isHouser,  editIllegalEntryById);
router.delete("/:id",protect, isHouser,  removeIllegalEntry);
export default router;