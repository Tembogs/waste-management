import { Router } from "express";
import {createNewRecycle, fetchAllRecycleEntries ,editRecycle,removeRecycleEntry, acceptRecycleRequest, rejectRecycleRequest, collectrecycleRquest, routeRecycleRequest, deleteAll,  viewRecycleStatusV2, getRecycleRequestToCollectorController} from "../controller/recycling.controllers.js";
import { admin, isCollector, isHouser,protect } from "../middlerware/auth.middleware.js";  

const router = Router();

router.post("/",protect, isHouser, createNewRecycle);
router.get("/",protect, fetchAllRecycleEntries);
router.get("/status-v2", protect, isHouser, viewRecycleStatusV2);
router.put("/:id",protect, isHouser,  editRecycle);
router.delete("/:id",protect, isHouser,  removeRecycleEntry);
router.delete('/', deleteAll)

// Collector Section
router.post("/accept",protect,isCollector,acceptRecycleRequest);
router.post("/reject",protect,isCollector,rejectRecycleRequest);
router.post("/route", protect, isCollector, routeRecycleRequest)
router.post("/collect", protect, isCollector, collectrecycleRquest)
router.get("/:collectorAssayId", protect, isCollector, getRecycleRequestToCollectorController)
export default router;