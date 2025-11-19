// modules/report/report.routes.ts
import { Router } from "express";
import { ReportController } from "./report.controller";

const router = Router();

router.get("/monthly/json", ReportController.getMonthlyJSON);
router.get("/monthly/pdf", ReportController.getMonthlyPDF);

export default router;
