import express from 'express';
import { handleChat } from '../controllers/chatController.js';
import { spellCorrection } from '../middleware/spellCorrection.js';
import { localhostOnly, sanitizeInput } from '../middleware/security.js';
import {
  getAgentById,
  getAgentByEmail,
  getAgentsByCompany, 
  getAgentsByName,
  getAgentLastLogin,
  getAgentNationality, 
  getAgentLoginCount,
  getAgentLoginHistory,
  getAgentFirstLogin,
  getLoginById,
  getAgentsByNationality,
  getAgentFullProfile,
  getLoginsInDateRange,
  getLoginsThisMonth,
  getMostActiveAgent,
  getLeastActiveAgent,
  getAgentsWithNoLogins,
  getTotalAgentCount,
  getTopAgentsByLogin
} from '../controllers/internalController.js';

const router = express.Router();

// PUBLIC API
router.post('/chat', spellCorrection, sanitizeInput, handleChat);

// INTERNAL API - Localhost only
router.use('/internal/*', localhostOnly, sanitizeInput);

router.post('/internal/agent/by-id', getAgentById);
router.post('/internal/agent/by-email', getAgentByEmail);
router.post('/internal/agent/by-company', getAgentsByCompany);
router.post('/internal/agent/by-name', getAgentsByName);
router.post('/internal/agent/last-login', getAgentLastLogin);
router.post('/internal/agent/nationality', getAgentNationality);
router.post('/internal/agent/login-count', getAgentLoginCount);
router.post('/internal/agent/login-history', getAgentLoginHistory);
router.post('/internal/agent/first-login', getAgentFirstLogin);
router.post('/internal/login/by-id', getLoginById);
router.post('/internal/agent/by-nationality', getAgentsByNationality);
router.post('/internal/agent/full-profile', getAgentFullProfile);
router.post('/internal/login/date-range', getLoginsInDateRange);
router.get('/internal/login/this-month', getLoginsThisMonth);
router.get('/internal/agent/most-active', getMostActiveAgent);
router.get('/internal/agent/least-active', getLeastActiveAgent);
router.get('/internal/agent/no-logins', getAgentsWithNoLogins);
router.get('/internal/agent/count', getTotalAgentCount);
router.get('/internal/agent/top-by-login', getTopAgentsByLogin);

export default router;
