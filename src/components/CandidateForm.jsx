import { useState } from 'react'

const CandidateForm = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    candidateName: '',
    candidateEmail: '',
    interviewTitle: ''
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.candidateName.trim()) {
      newErrors.candidateName = 'Candidate name is required'
    }
    
    if (!formData.candidateEmail.trim()) {
      newErrors.candidateEmail = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.candidateEmail)) {
      newErrors.candidateEmail = 'Please enter a valid email address'
    }
    
    if (!formData.interviewTitle.trim()) {
      newErrors.interviewTitle = 'Interview title is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Candidate Information</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="candidateName" className="block text-sm font-medium text-gray-700 mb-1">
            Candidate Name *
          </label>
          <input
            type="text"
            id="candidateName"
            name="candidateName"
            value={formData.candidateName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.candidateName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter candidate's full name"
          />
          {errors.candidateName && (
            <p className="mt-1 text-sm text-red-600">{errors.candidateName}</p>
          )}
        </div>

        <div>
          <label htmlFor="candidateEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            id="candidateEmail"
            name="candidateEmail"
            value={formData.candidateEmail}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.candidateEmail ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="candidate@example.com"
          />
          {errors.candidateEmail && (
            <p className="mt-1 text-sm text-red-600">{errors.candidateEmail}</p>
          )}
        </div>

        <div>
          <label htmlFor="interviewTitle" className="block text-sm font-medium text-gray-700 mb-1">
            Interview Title *
          </label>
          <input
            type="text"
            id="interviewTitle"
            name="interviewTitle"
            value={formData.interviewTitle}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.interviewTitle ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Software Engineer Interview"
          />
          {errors.interviewTitle && (
            <p className="mt-1 text-sm text-red-600">{errors.interviewTitle}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Starting Session...
            </div>
          ) : (
            'Start Proctoring Session'
          )}
        </button>
      </form>
    </div>
  )
}

export default CandidateForm
