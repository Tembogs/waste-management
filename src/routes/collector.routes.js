import { Router } from "express";
import { createCollector } from "../services/collector.js";

const router = Router();

router.post('/', createCollector);

export default router;