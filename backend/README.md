# Video Proctoring System - Backend

A comprehensive backend API for the Video Proctoring System built with Node.js, Express, and MongoDB.

## 🚀 Features

- **Session Management**: Create, track, and manage proctoring sessions
- **Event Logging**: Real-time event storage with violation tracking
- **Integrity Scoring**: Automated scoring based on violation patterns
- **Report Generation**: Comprehensive proctoring reports with recommendations
- **RESTful API**: Clean, documented API endpoints
- **Security**: Rate limiting, CORS, and security headers

## 📋 Prerequisites

- Node.js 16+ 
- MongoDB 4.4+
- npm or yarn

## 🛠️ Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/video-proctoring
   NODE_ENV=development
   JWT_SECRET=your-secret-key-here
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Endpoints

### Health Check
- `GET /api/health` - Check API status

### Sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions` - Get all sessions (paginated)
- `GET /api/sessions/:sessionId` - Get specific session
- `PUT /api/sessions/:sessionId/end` - End session

### Events
- `POST /api/sessions/:sessionId/events` - Add single event
- `POST /api/sessions/:sessionId/events/bulk` - Add multiple events

### Reports
- `GET /api/sessions/:sessionId/report` - Generate session report

## 📊 Database Schema

### Session Model
```javascript
{
  candidateName: String,
  candidateEmail: String,
  interviewTitle: String,
  startTime: Date,
  endTime: Date,
  duration: Number,
  events: [EventSchema],
  violations: {
    lookingAway: Number,
    noFaceDetected: Number,
    multipleFaces: Number,
    suspiciousObjects: Number
  },
  integrityScore: Number,
  status: String,
  videoRecorded: Boolean
}
```

### Event Schema
```javascript
{
  id: String,
  timestamp: Date,
  type: String,
  description: String,
  severity: String
}
```

## 🎯 Integrity Scoring

The system calculates integrity scores based on violations:

- **Looking Away**: -5 points per incident
- **No Face Detected**: -10 points per incident  
- **Multiple Faces**: -15 points per incident
- **Suspicious Objects**: -20 points per incident

**Score Ranges:**
- 80-100: PASS (High integrity)
- 60-79: REVIEW (Medium integrity)
- 0-59: FAIL (Low integrity)

## 📈 Usage Examples

### Create Session
```javascript
POST /api/sessions
{
  "candidateName": "John Doe",
  "candidateEmail": "john@example.com",
  "interviewTitle": "Software Engineer Interview"
}
```

### Add Event
```javascript
POST /api/sessions/:sessionId/events
{
  "id": "event-123",
  "timestamp": "2023-12-07T10:30:00Z",
  "type": "violation",
  "description": "Candidate looking away for more than 5 seconds",
  "severity": "warning"
}
```

### Get Report
```javascript
GET /api/sessions/:sessionId/report

Response:
{
  "success": true,
  "data": {
    "candidateInfo": {...},
    "sessionDetails": {...},
    "violations": {...},
    "integrityScore": 75,
    "recommendation": "REVIEW"
  }
}
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for protection
- **Input Validation**: Request validation and sanitization
- **Error Handling**: Comprehensive error responses

## 🚀 Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start server.js --name "proctoring-api"
pm2 startup
pm2 save
```

### Using Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/video-proctoring |
| `NODE_ENV` | Environment mode | development |
| `JWT_SECRET` | JWT signing secret | - |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:5173 |

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📊 Monitoring

The API includes built-in monitoring endpoints:

- Health checks at `/api/health`
- Request logging with timestamps
- Error tracking and reporting
- Performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
