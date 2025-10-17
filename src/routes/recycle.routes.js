import { Router } from "express";
import {createNewRecycle, fetchAllRecycleEntries ,viewRecycleStatus,editRecycle,removeRecycleEntry, acceptRecycleRequest, rejectRecycleRequest, collectrecycleRquest, routeRecycleRequest, deleteAll, fetchRecycleEntryByUserId} from "../controller/recycling.controllers.js";
import { admin, isCollector, isHouser,protect } from "../middlerware/auth.middleware.js";  

const router = Router();

router.post("/",protect, isHouser, createNewRecycle);
router.get("/",protect, fetchAllRecycleEntries);
router.get("/:id",protect, isHouser, fetchRecycleEntryByUserId);
router.get("/status/:id",protect, isHouser,  viewRecycleStatus);
router.put("/:id",protect, isHouser,  editRecycle);
router.delete("/:id",protect, isHouser,  removeRecycleEntry);
router.delete('/', deleteAll)

// Collector Section
router.post("/accept",protect,isCollector,acceptRecycleRequest);
router.post("/reject",protect,isCollector,rejectRecycleRequest);
router.post("/route", protect, isCollector, routeRecycleRequest)
router.post("/collect", protect, isCollector, collectrecycleRquest)
export default router;