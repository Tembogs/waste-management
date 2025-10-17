import { Router } from "express";

import {reportNewILLegalDump, fetchAllIllegalEntries,viewIllegalStatus,editIllegalEntryById,removeIllegalEntry, 
        acceptIllegalDumpRequest, rejectIllegalDumpRequest, resolveDumpingRequest,
        fetchIllegalEntriesByUserId
      } from "../controller/illegalDump.controller.js";
import { admin, isCollector, isHouser, protect } from "../middlerware/auth.middleware.js";


const router = Router();

router.post("/",protect, isHouser, reportNewILLegalDump);
router.get("/", protect, fetchAllIllegalEntries);
router.get("/:id",protect, isHouser,  fetchIllegalEntriesByUserId);
router.get("/status/:id", protect, viewIllegalStatus);
router.put("/:id",protect, isHouser,  editIllegalEntryById);
router.delete("/:id",protect, isHouser,  removeIllegalEntry);

// Collector Section
router.post("/accept",protect,isCollector,acceptIllegalDumpRequest);
router.post("/reject",protect,isCollector, rejectIllegalDumpRequest);
router.post("/resolve",protect,isCollector, resolveDumpingRequest)
export default router;