import agentService from '../services/agentService.js';

export const getAgentById = async (req, res, next) => {
  try {
    const { agent_id } = req.body;
    const result = await agentService.getAgentById(agent_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getAgentByEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await agentService.getAgentByEmail(email);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getAgentsByCompany = async (req, res, next) => {
  try {
    const { company } = req.body;
    const result = await agentService.getAgentsByCompany(company);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getAgentsByName = async (req, res, next) => {
  try {
    const { agent_name } = req.body;
    const result = await agentService.getAgentsByName(agent_name);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getAgentLastLogin = async (req, res, next) => {
  try {
    const { agent_id } = req.body;
    const result = await agentService.getAgentLastLogin(agent_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getAgentNationality = async (req, res, next) => {
  try {
    const { agent_id } = req.body;
    const result = await agentService.getAgentNationality(agent_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getAgentLoginCount = async (req, res, next) => {
  try {
    const { agent_id } = req.body;
    const result = await agentService.getAgentLoginCount(agent_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getAgentLoginHistory = async (req, res, next) => {
  try {
    const { agent_id } = req.body;
    const result = await agentService.getAgentLoginHistory(agent_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getAgentFirstLogin = async (req, res, next) => {
  try {
    const { agent_id } = req.body;
    const result = await agentService.getAgentFirstLogin(agent_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getLoginById = async (req, res, next) => {
  try {
    const { login_id } = req.body;
    const result = await agentService.getLoginById(login_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getAgentsByNationality = async (req, res, next) => {
  try {
    const { nationality } = req.body;
    const result = await agentService.getAgentsByNationality(nationality);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getAgentFullProfile = async (req, res, next) => {
  try {
    const { agent_id } = req.body;
    const result = await agentService.getAgentFullProfile(agent_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getLoginsInDateRange = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.body;
    const result = await agentService.getLoginsInDateRange(start_date, end_date);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getLoginsThisMonth = async (req, res, next) => {
  try {
    const result = await agentService.getLoginsThisMonth();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getMostActiveAgent = async (req, res, next) => {
  try {
    const result = await agentService.getMostActiveAgent();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getLeastActiveAgent = async (req, res, next) => {
  try {
    const result = await agentService.getLeastActiveAgent();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getAgentsWithNoLogins = async (req, res, next) => {
  try {
    const result = await agentService.getAgentsWithNoLogins();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getTotalAgentCount = async (req, res, next) => {
  try {
    const result = await agentService.getTotalAgentCount();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getTopAgentsByLogin = async (req, res, next) => {
  try {
    const result = await agentService.getTopAgentsByLogin();
    res.json(result);
  } catch (error) {
    next(error);
  }
};
