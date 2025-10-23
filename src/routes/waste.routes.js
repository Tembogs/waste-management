import { Router } from "express";
import {createNewWaste,fetchAllWasteEntries, viewWasteStatusV2, editWaste,removeWasteEntry, acceptWasteRequest, rejectWasteRequest, collectorView, routeWasteRequest, collectWasteRquest, deleteAll, getWasteRequestToCollectorController, } from "../controller/waste.controllers.js";
import { admin, isCollector, isHouser, protect } from "../middlerware/auth.middleware.js";

const router = Router();

router.post("/",protect, isHouser, createNewWaste);
router.get("/",protect, fetchAllWasteEntries);
router.get("/status-v2", protect, isHouser, viewWasteStatusV2);
router.put("/:id",protect, isHouser, editWaste);
router.delete("/:id",protect, isHouser, removeWasteEntry);
router.delete('/', deleteAll)


// Collector Section
router.post("/accept",protect,isCollector,acceptWasteRequest);
router.post("/reject",protect,isCollector,rejectWasteRequest);
router.get("/collector/:id",protect,isCollector,collectorView);
router.post("/route", protect, isCollector, routeWasteRequest)
router.post("/collect", protect, isCollector, collectWasteRquest)
router.get("/:collectorAssayId", protect, isCollector, getWasteRequestToCollectorController)

export default router;