import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  id: { type: String, required: true },
  timestamp: { type: Date, required: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['info', 'warning', 'error'], required: true }
});

const sessionSchema = new mongoose.Schema({
  candidateName: { type: String, required: true },
  candidateEmail: { type: String, required: true },
  interviewTitle: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number }, // in seconds
  events: [eventSchema],
  violations: {
    lookingAway: { type: Number, default: 0 },
    noFaceDetected: { type: Number, default: 0 },
    multipleFaces: { type: Number, default: 0 },
    suspiciousObjects: { type: Number, default: 0 }
  },
  integrityScore: { type: Number, default: 100 },
  status: { type: String, enum: ['active', 'completed', 'terminated'], default: 'active' },
  videoRecorded: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Calculate integrity score based on violations
sessionSchema.methods.calculateIntegrityScore = function() {
  let score = 100;
  
  // Deduction rules
  score -= this.violations.lookingAway * 5; // 5 points per looking away incident
  score -= this.violations.noFaceDetected * 10; // 10 points per no face incident
  score -= this.violations.multipleFaces * 15; // 15 points per multiple faces incident
  score -= this.violations.suspiciousObjects * 20; // 20 points per suspicious object
  
  // Ensure score doesn't go below 0
  this.integrityScore = Math.max(0, score);
  return this.integrityScore;
};

// Generate proctoring report
sessionSchema.methods.generateReport = function() {
  const totalViolations = Object.values(this.violations).reduce((sum, count) => sum + count, 0);
  
  return {
    candidateInfo: {
      name: this.candidateName,
      email: this.candidateEmail,
      interviewTitle: this.interviewTitle
    },
    sessionDetails: {
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration,
      durationFormatted: this.duration ? `${Math.floor(this.duration / 60)}m ${this.duration % 60}s` : 'N/A'
    },
    violations: {
      ...this.violations,
      total: totalViolations
    },
    events: this.events.filter(event => event.severity !== 'info'),
    integrityScore: this.integrityScore,
    recommendation: this.integrityScore >= 80 ? 'PASS' : this.integrityScore >= 60 ? 'REVIEW' : 'FAIL',
    videoRecorded: this.videoRecorded
  };
};

export default mongoose.model('Session', sessionSchema);
