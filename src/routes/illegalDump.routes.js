import { Router } from "express";

import {reportNewILLegalDump, fetchAllIllegalEntries,editIllegalEntryById,removeIllegalEntry, acceptIllegalDumpRequest, rejectIllegalDumpRequest, resolveDumpingRequest,viewIllegalStatusV2, deleteAll, getDumpRequestToCollectorController} from "../controller/illegalDump.controller.js";
import { admin, isCollector, isHouser, protect } from "../middlerware/auth.middleware.js";


const router = Router();

router.post("/",protect, isHouser, reportNewILLegalDump);
router.get("/", protect, fetchAllIllegalEntries);
router.get("/status-v2", protect, isHouser, viewIllegalStatusV2);
router.put("/:id",protect, isHouser,  editIllegalEntryById);
router.delete("/:id",protect, isHouser,  removeIllegalEntry);
router.delete('/', deleteAll)

// Collector Section
router.post("/accept",protect,isCollector,acceptIllegalDumpRequest);
router.post("/reject",protect,isCollector, rejectIllegalDumpRequest);
router.post("/resolve",protect,isCollector, resolveDumpingRequest)
router.get("/:collectorAssayId", protect, isCollector, getDumpRequestToCollectorController)
export default router;