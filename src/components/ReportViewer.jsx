import { useState, useEffect } from 'react'
import ApiService from '../services/api'

const ReportViewer = ({ reportData, onClose }) => {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (reportData) {
      if (reportData.loading) {
        setLoading(true)
        setReport(null)
        setError(null)
      } else if (reportData.error) {
        setLoading(false)
        setError(reportData.error)
        setReport(null)
      } else {
        setLoading(false)
        setReport(reportData)
        setError(null)
      }
    } else {
      setError('No report data available')
      setLoading(false)
    }
  }, [reportData])

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'PASS': return 'bg-green-100 text-green-800'
      case 'REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'FAIL': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const downloadReport = () => {
    const reportData = {
      ...report,
      generatedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `proctoring-report-${report.candidateInfo.name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg">Generating Report...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Report</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!report) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Proctoring Report</h2>
              <p className="text-blue-100">Generated on {new Date().toLocaleDateString()}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Candidate Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Candidate Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <span className="ml-2 text-gray-900">{report.candidateInfo.name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-900">{report.candidateInfo.email}</span>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Interview:</span>
                <span className="ml-2 text-gray-900">{report.candidateInfo.interviewTitle}</span>
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Session Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <span className="font-medium text-gray-700">Start Time:</span>
                <div className="text-gray-900">{new Date(report.sessionDetails.startTime).toLocaleString()}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">End Time:</span>
                <div className="text-gray-900">
                  {report.sessionDetails.endTime ? new Date(report.sessionDetails.endTime).toLocaleString() : 'N/A'}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Duration:</span>
                <div className="text-gray-900">{report.sessionDetails.durationFormatted}</div>
              </div>
            </div>
          </div>

          {/* Integrity Score */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Integrity Assessment</h3>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-3xl font-bold">
                    <span className={getScoreColor(report.integrityScore)}>
                      {report.integrityScore}/100
                    </span>
                  </div>
                  <div className="text-gray-600">Integrity Score</div>
                </div>
                <div>
                  <span className={`px-4 py-2 rounded-full font-semibold ${getRecommendationColor(report.recommendation)}`}>
                    {report.recommendation}
                  </span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    report.integrityScore >= 80 ? 'bg-green-500' :
                    report.integrityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${report.integrityScore}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Violations Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Violations Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">{report.violations.lookingAway}</div>
                <div className="text-sm text-gray-600">Looking Away</div>
              </div>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{report.violations.noFaceDetected}</div>
                <div className="text-sm text-gray-600">No Face Detected</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{report.violations.multipleFaces}</div>
                <div className="text-sm text-gray-600">Multiple Faces</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{report.violations.suspiciousObjects}</div>
                <div className="text-sm text-gray-600">Suspicious Objects</div>
              </div>
            </div>
          </div>

          {/* Recent Violations */}
          {report.events && report.events.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Violations</h3>
              <div className="bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                {report.events.slice(0, 10).map((event, index) => (
                  <div key={index} className="p-3 border-b border-gray-200 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{event.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        event.severity === 'error' ? 'bg-red-100 text-red-800' :
                        event.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {event.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Video Recording:</span>
                <span className={`px-2 py-1 rounded-full text-sm ${
                  report.videoRecorded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {report.videoRecorded ? 'Available' : 'Not Available'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={downloadReport}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Download Report
            </button>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportViewer
