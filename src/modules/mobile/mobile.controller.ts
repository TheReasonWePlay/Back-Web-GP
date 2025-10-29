import { Request, Response } from 'express';
import { MobileDashboardService, MobileInfoService, MobilePointageService } from './mobile.service';

export const MobileDashboardController = async (req: Request, res: Response) => {
    try {
      const result = await MobileDashboardService.getDashboardData();
      res.status(200).json(result.data); // ⚠️ renvoie exactement { present, late, agent, percent }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur serveur' });
    }

};

export const MobileInfoController = async (req: Request, res: Response) => {
  try {
    const { matricule } = req.query;
    const result = await MobileInfoService.getInfo(matricule as string);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// --- Pointage (sortie/rentrée)
export const MobilePointageController = async (req: Request, res: Response) => {
  try {
    const { type, matricule, description, idSortie} = req.body; // type = "sortie" ou "rentree"
    const result = await MobilePointageService.addPointage(type, matricule, description, idSortie);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
