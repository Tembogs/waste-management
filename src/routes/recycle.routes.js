import { Router } from "express";
import {createNewRecycle, fetchAllRecycleEntries ,fetchRecycleEntryById,viewRecycleStatus,editRecycle,removeRecycleEntry, acceptRecycleRequest, rejectRecycleRequest, collectrecycleRquest, routeRecycleRequest} from "../controller/recycling.controllers.js";
import { admin, isCollector, isHouser,protect } from "../middlerware/auth.middleware.js";  

const router = Router();

router.post("/",protect, isHouser, createNewRecycle);
router.get("/",protect, admin, fetchAllRecycleEntries);
router.get("/:id",protect, isHouser, fetchRecycleEntryById);
router.get("/status/:id",protect, isHouser,  viewRecycleStatus);
router.put("/:id",protect, isHouser,  editRecycle);
router.delete("/:id",protect, isHouser,  removeRecycleEntry);

// Collector Section
router.post("/accept",protect,isCollector,acceptRecycleRequest);
router.post("/reject",protect,isCollector,rejectRecycleRequest);
router.post("/route", protect, isCollector, routeRecycleRequest)
router.post("/collect", protect, isCollector, collectrecycleRquest)
export default router;