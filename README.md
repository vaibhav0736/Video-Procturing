# Video Proctoring System

A comprehensive real-time video proctoring system built with React, Vite, and advanced AI models for monitoring online interviews and exams.

## 🚀 Features

### Core Functionality
- **Real-time Video Monitoring**: Live candidate video feed with AI-powered analysis
- **Face Detection**: Uses MediaPipe for accurate face detection and tracking
- **Focus Detection**: Monitors if candidate is looking away for >5 seconds
- **Multiple Face Detection**: Alerts when multiple people are detected
- **Object Detection**: Uses TensorFlow.js COCO-SSD to detect suspicious items
- **Video Recording**: Records and saves interview sessions
- **Event Logging**: Comprehensive logging with timestamps
- **Real-time Alerts**: Immediate notifications for violations

### Detected Violations
- **Looking Away**: Candidate not focused on screen for >5 seconds
- **No Face Detected**: No face visible for >10 seconds  
- **Multiple Faces**: More than one person in frame
- **Suspicious Objects**: Detection of phones, books, notes, electronic devices

### Technology Stack
- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS
- **AI/ML**: 
  - MediaPipe Face Detection (Google's state-of-the-art face detection)
  - TensorFlow.js with COCO-SSD (industry-standard object detection)
- **Recording**: RecordRTC for video capture
- **Real-time Processing**: Canvas API for overlay rendering

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd video-proctoring-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 🎯 Usage

1. **Grant Camera Permissions**: Allow browser access to camera and microphone
2. **Start Monitoring**: The system automatically begins face detection and monitoring
3. **Start Recording**: Click "Start Recording" to save the session
4. **Monitor Events**: Watch the real-time event log and alerts panel
5. **Download Recording**: Stop recording to automatically download the video file

## 🔧 Configuration

### Detection Sensitivity
You can adjust detection parameters in `src/components/VideoProctoring.jsx`:

```javascript
// Face detection confidence
minDetectionConfidence: 0.5

// Timing thresholds
const LOOKING_AWAY_THRESHOLD = 5000 // 5 seconds
const NO_FACE_THRESHOLD = 10000 // 10 seconds

// Object detection interval
const DETECTION_INTERVAL = 2000 // 2 seconds
```

### Suspicious Items
Modify the detected items list in `src/utils/detectionUtils.js`:

```javascript
export const suspiciousItems = [
  'cell phone', 'phone', 'mobile', 'smartphone',
  'book', 'notebook', 'paper', 'document',
  'laptop', 'computer', 'tablet', 'ipad',
  // Add more items as needed
]
```

## 🏗️ Project Structure

```
src/
├── components/
│   └── VideoProctoring.jsx    # Main proctoring component
├── utils/
│   └── detectionUtils.js      # Detection utility functions
├── App.jsx                    # Main app component
├── index.css                  # Tailwind CSS imports
└── main.jsx                   # App entry point
```

## 🔍 How It Works

### Face Detection Pipeline
1. **MediaPipe Integration**: Utilizes Google's MediaPipe for robust face detection
2. **Landmark Analysis**: Extracts facial landmarks for gaze direction estimation
3. **Real-time Processing**: Processes video frames at 30fps for smooth detection
4. **Canvas Overlay**: Draws detection boxes and status indicators

### Object Detection Pipeline  
1. **TensorFlow.js COCO-SSD**: Pre-trained model for 80+ object classes
2. **Suspicious Item Filtering**: Filters detections for prohibited items
3. **Confidence Scoring**: Only alerts on high-confidence detections
4. **Visual Feedback**: Highlights detected objects with red bounding boxes

### Event System
- **Real-time Logging**: All events logged with precise timestamps
- **Severity Levels**: Info, Warning, Error classifications
- **Alert Management**: Active alerts panel for immediate attention
- **Export Capability**: Events can be exported for review

## 🚨 Security & Privacy

- **Local Processing**: All AI processing happens locally in the browser
- **No Data Transmission**: Video and detection data never leaves the user's device
- **Secure Recording**: Videos saved locally with user control
- **Permission-based**: Requires explicit camera/microphone permissions

## 🎨 UI Features

- **Responsive Design**: Works on desktop and tablet devices
- **Real-time Status**: Live indicators for all detection metrics
- **Professional Interface**: Clean, interviewer-friendly design
- **Color-coded Alerts**: Visual severity indicators
- **Smooth Animations**: Loading states and transitions

## 🔧 Browser Requirements

- **Modern Browser**: Chrome 88+, Firefox 85+, Safari 14+
- **WebRTC Support**: Required for camera access
- **WebGL Support**: Required for TensorFlow.js
- **Sufficient RAM**: 4GB+ recommended for smooth AI processing

## 📊 Performance

- **Lightweight**: Optimized for real-time performance
- **Efficient AI**: Models loaded once and cached
- **Low Latency**: Sub-100ms detection response time
- **Resource Management**: Automatic cleanup and memory management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Camera Not Working
- Check browser permissions
- Ensure camera is not used by other applications
- Try refreshing the page

### AI Models Not Loading
- Check internet connection (models downloaded from CDN)
- Clear browser cache
- Disable ad blockers temporarily

### Performance Issues
- Close other browser tabs
- Ensure sufficient system resources
- Lower video resolution if needed

## 🔮 Future Enhancements

- Eye tracking for more precise gaze detection
- Audio analysis for suspicious sounds
- Integration with learning management systems
- Advanced reporting and analytics
- Mobile device support
