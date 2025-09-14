# Video Proctoring System - Deployment Guide

## 🚀 Complete System Setup

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- Modern web browser (Chrome 88+, Firefox 85+, Safari 14+)

### Quick Start

1. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Start MongoDB**
   ```bash
   # Local MongoDB
   mongod
   
   # Or Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

3. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Backend will run on `http://localhost:5000`

4. **Install Frontend Dependencies**
   ```bash
   cd ..
   npm install
   ```

5. **Start Frontend**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   MongoDB       │
│   React + Vite  │◄──►│   Express.js    │◄──►│   Database      │
│   Port: 5173    │    │   Port: 5000    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Features Implemented

#### ✅ Frontend Features
- **Candidate Information Form**: Collects name, email, interview title
- **Real-time Video Monitoring**: Live video feed with AI analysis
- **Face Detection**: BlazeFace model for accurate face tracking
- **Object Detection**: COCO-SSD for suspicious item detection
- **Focus Tracking**: Monitors looking away >5s, no face >10s
- **Video Recording**: Local recording with download capability
- **Event Logging**: Real-time violation tracking
- **Report Generation**: Comprehensive integrity reports
- **Backend Integration**: Automatic session sync and data persistence

#### ✅ Backend Features
- **Session Management**: Create, track, end proctoring sessions
- **Event Storage**: MongoDB storage for all proctoring events
- **Integrity Scoring**: Automated scoring based on violations:
  - Looking Away: -5 points per incident
  - No Face Detected: -10 points per incident
  - Multiple Faces: -15 points per incident
  - Suspicious Objects: -20 points per incident
- **Report API**: Generate detailed proctoring reports
- **Real-time Sync**: Bulk event synchronization every 5 seconds

#### ✅ Reporting System
- **Candidate Details**: Name, email, interview title
- **Session Metrics**: Duration, start/end times
- **Violation Summary**: Categorized violation counts
- **Integrity Score**: 0-100 scale with recommendations:
  - 80-100: PASS (High integrity)
  - 60-79: REVIEW (Medium integrity)
  - 0-59: FAIL (Low integrity)
- **Event Timeline**: Detailed violation history
- **Export Capability**: JSON report download

### API Endpoints

#### Sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions` - List all sessions
- `GET /api/sessions/:id` - Get specific session
- `PUT /api/sessions/:id/end` - End session
- `GET /api/sessions/:id/report` - Generate report

#### Events
- `POST /api/sessions/:id/events` - Add single event
- `POST /api/sessions/:id/events/bulk` - Add multiple events

### Database Schema

#### Session Collection
```javascript
{
  _id: ObjectId,
  candidateName: "John Doe",
  candidateEmail: "john@example.com",
  interviewTitle: "Software Engineer Interview",
  startTime: ISODate,
  endTime: ISODate,
  duration: 3600, // seconds
  events: [EventSchema],
  violations: {
    lookingAway: 2,
    noFaceDetected: 1,
    multipleFaces: 0,
    suspiciousObjects: 1
  },
  integrityScore: 75,
  status: "completed",
  videoRecorded: true,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### Usage Flow

1. **Start System**: Launch backend and frontend servers
2. **Enter Candidate Info**: Fill out the candidate form
3. **Begin Session**: System creates database session and starts monitoring
4. **AI Monitoring**: Real-time face and object detection
5. **Event Logging**: Violations automatically logged to database
6. **Generate Report**: View comprehensive integrity report
7. **End Session**: Finalize session with integrity scoring

### Configuration

#### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/video-proctoring
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (src/services/api.js)
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

### Security Features

- **CORS Protection**: Configurable origin restrictions
- **Rate Limiting**: 100 requests per 15 minutes
- **Input Validation**: Request sanitization
- **Local Processing**: AI models run in browser
- **No Video Upload**: Videos stay on client device

### Performance Optimizations

- **Event Batching**: Bulk sync every 5 seconds
- **Model Caching**: AI models loaded once
- **Efficient Detection**: 1-second intervals for real-time response
- **Memory Management**: Automatic cleanup on session end

### Troubleshooting

#### Backend Issues
- Ensure MongoDB is running
- Check port 5000 availability
- Verify environment variables

#### Frontend Issues
- Grant camera/microphone permissions
- Check browser compatibility
- Ensure backend is accessible

#### AI Model Issues
- Stable internet for model download
- Sufficient system resources (4GB+ RAM)
- WebGL support required

### Production Deployment

#### Backend
```bash
# Using PM2
npm install -g pm2
cd backend
pm2 start server.js --name "proctoring-api"
```

#### Frontend
```bash
npm run build
# Deploy dist/ folder to web server
```

### Monitoring

- Health check: `GET /api/health`
- Session analytics via MongoDB queries
- Real-time event tracking
- Performance metrics logging

The system is now fully functional with comprehensive proctoring capabilities, real-time AI detection, backend persistence, and detailed reporting.
