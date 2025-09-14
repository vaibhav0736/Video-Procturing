// Utility functions for detection and analysis

export const suspiciousItems = [
  'cell phone', 'phone', 'mobile', 'smartphone',
  'book', 'notebook', 'paper', 'document',
  'laptop', 'computer', 'tablet', 'ipad',
  'remote', 'keyboard', 'mouse', 'headphones',
  'calculator', 'watch', 'smartwatch'
]

export const calculateGazeDirection = (landmarks) => {
  if (!landmarks || landmarks.length < 6) return { isLookingAway: false, confidence: 0 }
  
  const leftEye = landmarks[0]
  const rightEye = landmarks[1]
  const nose = landmarks[2]
  const mouth = landmarks[3]
  
  // Calculate eye distance ratio
  const eyeDistance = Math.abs(leftEye.x - rightEye.x)
  const normalEyeDistance = 0.06 // Approximate normal distance
  
  // Calculate nose position relative to center
  const noseOffset = Math.abs(nose.x - 0.5)
  
  // Determine if looking away based on multiple factors
  const eyeRatio = eyeDistance / normalEyeDistance
  const isLookingAway = eyeRatio < 0.7 || noseOffset > 0.2
  
  const confidence = Math.min(1, Math.max(0, 1 - (eyeRatio + noseOffset)))
  
  return { isLookingAway, confidence }
}

export const analyzeFacePosition = (detection, canvasWidth, canvasHeight) => {
  const bbox = detection.boundingBox
  const centerX = bbox.xCenter * canvasWidth
  const centerY = bbox.yCenter * canvasHeight
  const width = bbox.width * canvasWidth
  const height = bbox.height * canvasHeight
  
  // Check if face is too close (likely cheating)
  const faceArea = width * height
  const canvasArea = canvasWidth * canvasHeight
  const faceRatio = faceArea / canvasArea
  
  const isTooClose = faceRatio > 0.4
  const isTooFar = faceRatio < 0.05
  const isOffCenter = Math.abs(centerX - canvasWidth / 2) > canvasWidth * 0.3
  
  return {
    isTooClose,
    isTooFar,
    isOffCenter,
    faceRatio,
    position: { x: centerX, y: centerY, width, height }
  }
}

export const filterSuspiciousObjects = (predictions) => {
  return predictions.filter(pred => {
    const className = pred.class.toLowerCase()
    return suspiciousItems.some(item => 
      className.includes(item) || item.includes(className)
    )
  }).map(pred => ({
    ...pred,
    suspicionLevel: getSuspicionLevel(pred.class, pred.score)
  }))
}

export const getSuspicionLevel = (className, confidence) => {
  const highRiskItems = ['phone', 'mobile', 'smartphone', 'tablet', 'laptop']
  const mediumRiskItems = ['book', 'notebook', 'paper', 'calculator']
  
  const isHighRisk = highRiskItems.some(item => 
    className.toLowerCase().includes(item)
  )
  const isMediumRisk = mediumRiskItems.some(item => 
    className.toLowerCase().includes(item)
  )
  
  if (isHighRisk && confidence > 0.7) return 'high'
  if (isHighRisk && confidence > 0.5) return 'medium'
  if (isMediumRisk && confidence > 0.6) return 'medium'
  return 'low'
}

export const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
}

export const generateEventId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
