import { AgentModel } from './agent.model';

export const getAllAgents = async () => {
  return await AgentModel.findAll();
};

export const getAgentById = async (matricule: string) => {
  return await AgentModel.findById(matricule);
};

export const createAgent = async (data: any) => {
  return await AgentModel.create(data);
};

export const updateAgent = async (matricule: string, updates: any) => {
  return await AgentModel.update(matricule, updates);
};

export const deleteAgent = async (matricule: string) => {
  return await AgentModel.delete(matricule);
};
