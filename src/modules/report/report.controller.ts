// modules/report/report.controller.ts
import { Request, Response } from "express";
import { ReportService } from "./report.service";
import { ReportTemplate } from "./report.template";
import puppeteer from "puppeteer";

export const ReportController = {
  // GET /api/report/monthly/json?month=10&year=2025
  getMonthlyJSON: async (req: Request, res: Response) => {
    try {
      const month = Number(req.query.month);
      const year = Number(req.query.year);
      if (!month || !year) return res.status(400).json({ message: "month and year required" });

      const data = await ReportService.generateMonthlyReport(month, year);
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur serveur" });
    }
  },

  // GET /api/report/monthly/pdf?month=10&year=2025
  getMonthlyPDF: async (req: Request, res: Response) => {
    try {
      const month = Number(req.query.month);
      const year = Number(req.query.year);
      if (!month || !year) return res.status(400).json({ message: "month and year required" });

      const data = await ReportService.generateMonthlyReport(month, year);
      const html = ReportTemplate.generateMonthlyHTML(data);

      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ format: "A4", printBackground: true, margin: { top: "20mm", bottom: "20mm", left: "10mm", right: "10mm" } });
      await browser.close();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=rapport-${year}-${String(month).padStart(2,"0")}.pdf`);
      res.send(pdfBuffer);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur génération PDF" });
    }
  }
};
