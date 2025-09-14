import Session from '../models/Session.js';

// Create a new proctoring session
export const createSession = async (req, res) => {
  try {
    const { candidateName, candidateEmail, interviewTitle } = req.body;
    
    const session = new Session({
      candidateName,
      candidateEmail,
      interviewTitle,
      startTime: new Date()
    });
    
    await session.save();
    
    res.status(201).json({
      success: true,
      data: session,
      message: 'Session created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Add event to session
export const addEvent = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { id, timestamp, type, description, severity } = req.body;
    
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Add event
    session.events.push({
      id,
      timestamp: new Date(timestamp),
      type,
      description,
      severity
    });
    
    // Update violation counts based on event type
    if (type === 'violation') {
      if (description.includes('looking away')) {
        session.violations.lookingAway += 1;
      } else if (description.includes('No face detected')) {
        session.violations.noFaceDetected += 1;
      } else if (description.includes('Multiple faces')) {
        session.violations.multipleFaces += 1;
      } else if (description.includes('Suspicious objects')) {
        session.violations.suspiciousObjects += 1;
      }
    }
    
    // Recalculate integrity score
    session.calculateIntegrityScore();
    
    await session.save();
    
    res.json({
      success: true,
      data: session,
      message: 'Event added successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// End session
export const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { videoRecorded } = req.body;
    
    // Validate sessionId format
    if (!sessionId || !sessionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format'
      });
    }
    
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Check if session is already ended
    if (session.status === 'completed') {
      return res.json({
        success: true,
        data: session,
        message: 'Session already ended'
      });
    }
    
    const endTime = new Date();
    const duration = Math.floor((endTime - session.startTime) / 1000);
    
    session.endTime = endTime;
    session.duration = duration;
    session.status = 'completed';
    session.videoRecorded = videoRecorded || false;
    
    // Final integrity score calculation
    session.calculateIntegrityScore();
    
    await session.save();
    
    res.json({
      success: true,
      data: session,
      message: 'Session ended successfully'
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      message: `Failed to end session: ${error.message}`
    });
  }
};

// Get session report
export const getSessionReport = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    const report = session.generateReport();
    
    res.json({
      success: true,
      data: report,
      message: 'Report generated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all sessions
export const getAllSessions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = status ? { status } : {};
    
    const sessions = await Session.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Session.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        sessions,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      },
      message: 'Sessions retrieved successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get session by ID
export const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      data: session,
      message: 'Session retrieved successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Bulk add events (for better performance)
export const bulkAddEvents = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { events } = req.body;
    
    // Validate input
    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Events array is required and must not be empty'
      });
    }
    
    // Validate sessionId format
    if (!sessionId || !sessionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format'
      });
    }
    
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Filter out duplicate events and system events to prevent spam
    const existingEventIds = new Set(session.events.map(e => e.id));
    const newEvents = events.filter(event => 
      event.id && 
      !existingEventIds.has(event.id) &&
      !(event.type === 'system' && event.description.includes('AI models loaded'))
    );
    
    if (newEvents.length === 0) {
      return res.json({
        success: true,
        data: session,
        message: 'No new events to add'
      });
    }
    
    // Add new events
    newEvents.forEach(event => {
      session.events.push({
        id: event.id,
        timestamp: new Date(event.timestamp),
        type: event.type,
        description: event.description,
        severity: event.severity
      });
      
      // Update violation counts
      if (event.type === 'violation') {
        if (event.description.includes('looking away')) {
          session.violations.lookingAway += 1;
        } else if (event.description.includes('No face detected')) {
          session.violations.noFaceDetected += 1;
        } else if (event.description.includes('Multiple faces')) {
          session.violations.multipleFaces += 1;
        } else if (event.description.includes('Suspicious objects')) {
          session.violations.suspiciousObjects += 1;
        }
      }
    });
    
    // Recalculate integrity score
    session.calculateIntegrityScore();
    
    await session.save();
    
    res.json({
      success: true,
      data: session,
      message: `${newEvents.length} events added successfully`
    });
  } catch (error) {
    console.error('Error adding bulk events:', error);
    res.status(500).json({
      success: false,
      message: `Failed to add events: ${error.message}`
    });
  }
};
