import { useState } from 'react'
import VideoProctoring from './components/VideoProctoring'
import CandidateForm from './components/CandidateForm'
import './App.css'

function App() {
  const [sessionData, setSessionData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleStartSession = async (candidateData) => {
    setIsLoading(true)
    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSessionData(candidateData)
    } catch (error) {
      console.error('Error starting session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEndSession = () => {
    setSessionData(null)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Video Proctoring System</h1>
              <p className="text-gray-600 mt-1">Real-time monitoring for online interviews</p>
            </div>
            {sessionData && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Current Session</p>
                <p className="font-semibold text-gray-900">{sessionData.candidateName}</p>
                <p className="text-sm text-gray-500">{sessionData.interviewTitle}</p>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!sessionData ? (
          <div className="max-w-md mx-auto">
            <CandidateForm onSubmit={handleStartSession} isLoading={isLoading} />
          </div>
        ) : (
          <VideoProctoring sessionData={sessionData} setSessionData={setSessionData} onEndSession={handleEndSession} />
        )}
      </main>
    </div>
  )
}

export default App
