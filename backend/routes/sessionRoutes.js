import express from 'express';
import {
  createSession,
  addEvent,
  endSession,
  getSessionReport,
  getAllSessions,
  getSession,
  bulkAddEvents
} from '../controllers/sessionController.js';

const router = express.Router();

// Create new session
router.post('/', createSession);

// Get all sessions
router.get('/', getAllSessions);

// Get specific session
router.get('/:sessionId', getSession);

// Add single event to session
router.post('/:sessionId/events', addEvent);

// Bulk add events to session
router.post('/:sessionId/events/bulk', bulkAddEvents);

// End session
router.put('/:sessionId/end', endSession);

// Get session report
router.get('/:sessionId/report', getSessionReport);

export default router;
