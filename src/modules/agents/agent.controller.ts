import { Request, Response } from 'express';
import * as AgentService from './agent.service';

export const getAllAgents = async (req: Request, res: Response) => {
  try {
    const agents = await AgentService.getAllAgents();
    res.status(200).json({ success: true, data: agents });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des agents.' });
  }
};


export const getAgentById = async (req: Request, res: Response) => {
    try {
      console.log('🟢 [Controller] ID reçu:', req.params.id);
  
      const agent = await AgentService.getAgentById(req.params.id);
      console.log('🟢 [Controller] Réponse du modèle:', agent);
  
      // Si aucun agent trouvé
      if (!agent) {
        console.log('🔴 Aucun agent trouvé');
        return res.status(404).json({ success: false, message: 'Agent introuvable.' });
      }
  
      // ✅ Si tout est bon, renvoyer le résultat dans la bonne structure
      return res.status(200).json({
        success: true,
        data: agent,
      });
    } catch (error) {
      console.error('🔴 [Controller] Erreur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l’agent.',
      });
    }
  };
  
  
  
  

export const createAgent = async (req: Request, res: Response) => {
  try {
    const agent = await AgentService.createAgent(req.body);
    res.status(201).json({ success: true, message: 'Agent créé avec succès.', data: agent });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la création de l’agent.' });
  }
};

export const updateAgent = async (req: Request, res: Response) => {
  try {
    const agent = await AgentService.updateAgent(req.params.id, req.body);
    if (!agent) return res.status(404).json({ success: false, message: 'Agent introuvable.' });
    res.status(200).json({ success: true, message: 'Agent mis à jour avec succès.', data: agent });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de l’agent.' });
  }
};

export const deleteAgent = async (req: Request, res: Response) => {
  try {
    const success = await AgentService.deleteAgent(req.params.id);
    if (!success) return res.status(404).json({ success: false, message: 'Agent introuvable.' });
    res.status(200).json({ success: true, message: 'Agent supprimé avec succès.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression de l’agent.' });
  }
};
