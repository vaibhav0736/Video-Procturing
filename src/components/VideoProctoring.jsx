import { useState, useRef, useEffect, useCallback } from 'react'
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import * as blazeface from '@tensorflow-models/blazeface'
import ApiService from '../services/api'
import ReportViewer from './ReportViewer'

const VideoProctoring = ({ sessionData, setSessionData }) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recorder, setRecorder] = useState(null)
  const [events, setEvents] = useState([])
  const [alerts, setAlerts] = useState([])
  const [faceDetector, setFaceDetector] = useState(null)
  const [objectDetector, setObjectDetector] = useState(null)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [sessionId, setSessionId] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [backendConnected, setBackendConnected] = useState(false)
  const [reportData, setReportData] = useState(null)
  
  // Tracking states
  const [faceCount, setFaceCount] = useState(0)
  const [lookingAway, setLookingAway] = useState(false)
  const [noFaceDetected, setNoFaceDetected] = useState(false)
  const [suspiciousObjects, setSuspiciousObjects] = useState([])
  
  // Timers
  const lookingAwayTimer = useRef(null)
  const noFaceTimer = useRef(null)
  const syncTimer = useRef(null)
  const eventQueue = useRef([])
  const isInitializingSession = useRef(false)
  const cameraInitialized = useRef(false)
  
  const suspiciousItems = ['cell phone', 'book', 'laptop', 'tablet', 'remote', 'keyboard']

  const addEvent = useCallback((type, description, severity = 'info') => {
    const event = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      description,
      severity
    }
    setEvents(prev => [event, ...prev])
    
    if (severity === 'warning' || severity === 'error') {
      setAlerts(prev => [event, ...prev.slice(0, 4)])
    }
    
    // Queue event for backend sync if connected
    if (backendConnected && sessionId) {
      eventQueue.current.push(event)
    }
  }, [backendConnected, sessionId])

  // Handle view report
  const handleViewReport = useCallback(async () => {
    if (!sessionId || !backendConnected) {
      addEvent('system', 'No active session for report', 'warning')
      return
    }
    
    try {
      const response = await ApiService.getSessionReport(sessionId)
      if (response.success) {
        setReportData(response.data)
        setShowReport(true)
      } else {
        throw new Error(response.message || 'Failed to get report')
      }
    } catch (error) {
      console.error('Failed to get report:', error)
      addEvent('system', 'Failed to load report', 'error')
    }
  }, [sessionId, backendConnected, addEvent])

  const initializeModels = useCallback(async () => {
    // Prevent multiple initializations
    if (faceDetector && objectDetector) {
      setIsModelLoading(false)
      return
    }
    
    try {
      setIsModelLoading(true)
      
      // Initialize TensorFlow.js with optimizations
      await tf.ready()
      tf.env().set('WEBGL_PACK', true)
      tf.env().set('WEBGL_FORCE_F16_TEXTURES', true)
      
      // Load models with optimizations
      if (!faceDetector) {
        const faceModel = await blazeface.load()
        setFaceDetector(faceModel)
      }
      
      if (!objectDetector) {
        // Load the fastest COCO-SSD model
        const cocoModel = await cocoSsd.load({ 
          base: 'mobilenet_v1',
          modelUrl: undefined // Use default for fastest loading
        })
        setObjectDetector(cocoModel)
      }
      
      // Only add event once when both models are loaded for the first time
      if (!faceDetector && !objectDetector) {
        addEvent('system', 'AI models loaded successfully', 'info')
      }
      setIsModelLoading(false)
    } catch (error) {
      console.error('Error initializing models:', error)
      addEvent('system', 'Error loading AI models', 'error')
      setIsModelLoading(false)
    }
  }, [addEvent, faceDetector, objectDetector])

  const detectFaces = useCallback(async () => {
    if (!faceDetector || !videoRef.current || videoRef.current.readyState < 2) return
    
    try {
      const predictions = await faceDetector.estimateFaces(videoRef.current, false)
      const canvas = canvasRef.current
      const video = videoRef.current
      
      if (!canvas || !video) return
      
      const ctx = canvas.getContext('2d')
      
      // Only resize canvas once
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }
      
      // Clear and draw in one operation
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const currentFaceCount = predictions.length
      setFaceCount(currentFaceCount)
      
      // Optimized face detection logic
      if (currentFaceCount === 0) {
        if (!noFaceDetected) {
          setNoFaceDetected(true)
          if (!noFaceTimer.current) {
            noFaceTimer.current = setTimeout(() => {
              addEvent('violation', 'No face detected for >10 seconds', 'error')
            }, 10000)
          }
        }
      } else {
        if (noFaceDetected) {
          setNoFaceDetected(false)
          if (noFaceTimer.current) {
            clearTimeout(noFaceTimer.current)
            noFaceTimer.current = null
          }
        }
      }
      
      // Only check for multiple faces occasionally
      if (currentFaceCount > 1 && Math.random() < 0.1) {
        addEvent('violation', `Multiple faces detected (${currentFaceCount})`, 'warning')
      }
      
      // Optimized drawing - only draw first face for performance
      if (predictions.length > 0) {
        const prediction = predictions[0] // Only process first face
        const start = prediction.topLeft
        const end = prediction.bottomRight
        
        // Draw face bounding box
        ctx.strokeStyle = '#00ff00'
        ctx.lineWidth = 2
        ctx.strokeRect(start[0], start[1], end[0] - start[0], end[1] - start[1])
        
        // Improved gaze detection with larger tolerance
        const faceCenter = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]
        const videoCenter = [canvas.width / 2, canvas.height / 2]
        const distance = Math.sqrt(
          Math.pow(faceCenter[0] - videoCenter[0], 2) + 
          Math.pow(faceCenter[1] - videoCenter[1], 2)
        )
        
        // Increased threshold to reduce false positives
        const threshold = Math.min(canvas.width, canvas.height) * 0.3
        
        if (distance > threshold) {
          if (!lookingAway) {
            setLookingAway(true)
            if (!lookingAwayTimer.current) {
              lookingAwayTimer.current = setTimeout(() => {
                addEvent('violation', 'Candidate looking away for >5 seconds', 'warning')
              }, 5000)
            }
          }
        } else {
          if (lookingAway) {
            setLookingAway(false)
            if (lookingAwayTimer.current) {
              clearTimeout(lookingAwayTimer.current)
              lookingAwayTimer.current = null
            }
          }
        }
      }
    } catch (error) {
      console.error('Face detection error:', error)
    }
  }, [faceDetector, addEvent, noFaceDetected, lookingAway])

  const detectObjects = useCallback(async () => {
    if (!objectDetector || !videoRef.current) return
    
    try {
      const predictions = await objectDetector.detect(videoRef.current)
      const suspicious = predictions.filter(prediction => 
        suspiciousItems.includes(prediction.class) && prediction.score > 0.5
      )
      
      setSuspiciousObjects(suspicious)
      
      if (suspicious.length > 0) {
        const objectNames = suspicious.map(obj => obj.class).join(', ')
        addEvent('violation', `Suspicious objects detected: ${objectNames}`, 'error')
      }
      
      // Draw bounding boxes for suspicious objects
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        
        suspicious.forEach(prediction => {
          const [x, y, width, height] = prediction.bbox
          
          // Draw bounding box for suspicious objects
          ctx.strokeStyle = '#ff0000'
          ctx.lineWidth = 3
          ctx.strokeRect(x, y, width, height)
          
          // Draw label
          ctx.fillStyle = '#ff0000'
          ctx.font = '16px Arial'
          ctx.fillText(
            `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
            x, y > 20 ? y - 5 : y + 20
          )
        })
      }
    } catch (error) {
      console.error('Object detection error:', error)
    }
  }, [objectDetector, addEvent])

  const startCamera = useCallback(async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      // Camera already started, don't restart
      return
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          frameRate: { ideal: 15, max: 20 }
        },
        audio: true
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        addEvent('system', 'Camera started successfully', 'info')
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      addEvent('system', 'Error accessing camera', 'error')
    }
  }, [addEvent])

  const startRecording = useCallback(() => {
    if (!videoRef.current || !videoRef.current.srcObject) return
    
    const stream = videoRef.current.srcObject
    const mediaRecorder = new MediaRecorder(stream)
    const chunks = []
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `interview-${new Date().toISOString().slice(0, 19)}.webm`
      a.click()
      
      addEvent('system', 'Recording saved', 'info')
    }
    
    mediaRecorder.start()
    setRecorder(mediaRecorder)
    setIsRecording(true)
    addEvent('system', 'Recording started', 'info')
  }, [addEvent])

  const stopRecording = useCallback(() => {
    if (!recorder) return
    
    recorder.stop()
    setIsRecording(false)
    setRecorder(null)
  }, [recorder])

  // Initialize session with backend
  const initializeSession = useCallback(async () => {
    if (!sessionData || sessionId || isInitializingSession.current) return // Prevent duplicate sessions
    
    isInitializingSession.current = true
    
    try {
      const response = await ApiService.createSession(sessionData)
      if (response.success) {
        setSessionId(response.data._id)
        setBackendConnected(true)
        addEvent('system', 'Session created successfully', 'info')
      } else {
        throw new Error(response.message || 'Failed to create session')
      }
    } catch (error) {
      console.error('Failed to create session:', error)
      addEvent('system', 'Backend unavailable - running in offline mode', 'warning')
      setBackendConnected(false)
    } finally {
      isInitializingSession.current = false
    }
  }, [sessionData, sessionId, addEvent])
  
  // Sync events to backend
  const syncEvents = useCallback(async () => {
    if (!backendConnected || !sessionId || eventQueue.current.length === 0) return
    
    try {
      const eventsToSync = [...eventQueue.current]
      eventQueue.current = []
      
      const response = await ApiService.bulkAddEvents(sessionId, eventsToSync)
      if (!response.success) {
        throw new Error(response.message || 'Failed to sync events')
      }
    } catch (error) {
      console.error('Failed to sync events:', error)
      // Re-queue events if sync failed
      eventQueue.current = [...eventQueue.current, ...eventsToSync]
      // Don't spam error messages for sync failures
      if (!error.message.includes('Network')) {
        addEvent('system', 'Event sync failed - will retry', 'warning')
      }
    }
  }, [backendConnected, sessionId, addEvent])
  
  // End session
  const endSession = useCallback(async () => {
    if (!sessionId || !backendConnected) {
      addEvent('system', 'No active session to end', 'warning')
      return
    }
    
    try {
      // Clear detection intervals to prevent further processing
      if (syncTimer.current) {
        clearInterval(syncTimer.current)
        syncTimer.current = null
      }
      
      // Sync any remaining events first
      if (eventQueue.current.length > 0) {
        await syncEvents()
      }
      
      // End session with proper error handling
      const response = await ApiService.endSession(sessionId, isRecording)
      if (response.success) {
        addEvent('system', 'Session ended successfully', 'info')
        
        // Store sessionId before clearing it
        const currentSessionId = sessionId
        
        // Show generating report loading
        setShowReport(true)
        setReportData({ loading: true })
        
        // Clear session state to prevent recreation
        setSessionId(null)
        setBackendConnected(false)
        // DON'T clear sessionData yet - wait for report modal to close
        
        // Generate report automatically
        setTimeout(async () => {
          try {
            const reportResponse = await ApiService.getSessionReport(currentSessionId)
            if (reportResponse.success) {
              setReportData(reportResponse.data)
            } else {
              throw new Error(reportResponse.message || 'Failed to get report')
            }
          } catch (error) {
            console.error('Failed to get report:', error)
            setReportData({ error: 'Failed to load report' })
          }
        }, 2000) // 2 second loading simulation
      } else {
        throw new Error(response.message || 'Failed to end session')
      }
    } catch (error) {
      console.error('Failed to end session:', error)
      addEvent('system', `Failed to end session: ${error.message}`, 'error')
    }
  }, [sessionId, backendConnected, syncEvents, isRecording, addEvent, setSessionData])
  
  useEffect(() => {
    if (!faceDetector || !objectDetector) {
      initializeModels()
    }
  }, [])
  
  useEffect(() => {
    // Only initialize session if we have sessionData and no existing session
    if (sessionData && !sessionId && !isInitializingSession.current && sessionData !== null) {
      initializeSession()
    }
  }, [sessionData, sessionId, initializeSession])

  // Initialize camera once
  useEffect(() => {
    if (!cameraInitialized.current) {
      startCamera()
      cameraInitialized.current = true
    }
  }, [startCamera])

  useEffect(() => {
    if (objectDetector && faceDetector) {
      const interval = setInterval(() => {
        detectFaces() // Only face detection for performance
      }, 500) // Much faster face detection
      
      // Object detection with original speed
      const objectInterval = setInterval(() => {
        detectObjects()
      }, 1000) // Object detection every 1 second
      
      return () => {
        clearInterval(interval)
        clearInterval(objectInterval)
      }
    }
  }, [objectDetector, faceDetector, detectObjects, detectFaces])
  
  // Sync events periodically
  useEffect(() => {
    if (backendConnected && sessionId) {
      syncTimer.current = setInterval(syncEvents, 5000) // Sync every 5 seconds
      return () => {
        if (syncTimer.current) {
          clearInterval(syncTimer.current)
        }
      }
    }
  }, [backendConnected, sessionId, syncEvents])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timers
      if (lookingAwayTimer.current) clearTimeout(lookingAwayTimer.current)
      if (noFaceTimer.current) clearTimeout(noFaceTimer.current)
      if (syncTimer.current) clearInterval(syncTimer.current)
      
      // End session if active
      if (sessionId && backendConnected) {
        // Don't await in cleanup - fire and forget
        ApiService.endSession(sessionId, isRecording).catch(console.error)
      }
    }
  }, [sessionId, backendConnected, isRecording])

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Video Feed */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Candidate Video Feed</h2>
            <div className="flex space-x-2">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-4 py-2 rounded-md font-medium ${
                  isRecording
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                disabled={isModelLoading}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>
              
              
              {sessionId && (
                <button
                  onClick={endSession}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  End Session
                </button>
              )}
            </div>
          </div>
          
          <div className="relative bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-auto"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
            />
            
            {isModelLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Loading AI models...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Status Indicators */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Faces Detected</p>
              <p className={`text-lg font-semibold ${faceCount === 1 ? 'text-green-600' : 'text-red-600'}`}>
                {faceCount}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Looking Away</p>
              <p className={`text-lg font-semibold ${lookingAway ? 'text-red-600' : 'text-green-600'}`}>
                {lookingAway ? 'Yes' : 'No'}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">No Face Timer</p>
              <p className={`text-lg font-semibold ${noFaceDetected ? 'text-red-600' : 'text-green-600'}`}>
                {noFaceDetected ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Suspicious Objects</p>
              <p className={`text-lg font-semibold ${suspiciousObjects.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {suspiciousObjects.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monitoring Panel */}
      <div className="space-y-6">
        {/* Active Alerts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-gray-500 text-sm">No active alerts</p>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-md border ${getSeverityColor(alert.severity)}`}
                >
                  <p className="font-medium text-sm">{alert.description}</p>
                  <p className="text-xs opacity-75">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Event Log */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Log</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-gray-500 text-sm">No events logged</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="p-2 border-l-4 border-gray-200 bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {event.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {event.type} • {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        event.severity === 'error'
                          ? 'bg-red-100 text-red-800'
                          : event.severity === 'warning'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {event.severity}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Report Viewer Modal */}
      {showReport && reportData && (
        <ReportViewer
          reportData={reportData}
          onClose={() => {
            setShowReport(false)
            setReportData(null)
            // Now clear sessionData to return to candidate form
            setSessionData(null)
          }}
        />
      )}
    </div>
  )
}

export default VideoProctoring
