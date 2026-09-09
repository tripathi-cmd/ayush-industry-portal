import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'industry', 'admin'], required: true },
  name: { type: String },
  stream: { type: String, enum: ['ayurveda', 'yoga_naturopathy', 'unani', 'siddha', 'homeopathy'] },
  degree: { type: String },
  institution: { type: String },
  phone: { type: String },
  location: { type: String },
  bio: { type: String },
  companyName: { type: String },
  ayushSector: { type: String },
  licenseNumber: { type: String },
  gmpCertified: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ['verified', 'pending', 'rejected'], default: 'pending' },
  skills: [{ type: String }],
  assessmentScores: [{
    stream: String,
    title: String,
    score: Number,
    passed: Boolean,
    badge: String,
    completedAt: Date
  }],
  documents: [{
    id: String,
    title: String,
    type: String,
    status: String,
    verifiedAt: String
  }],
  createdAt: { type: Date, default: Date.now }
});

const OpportunitySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  postedBy: { type: String, required: true },
  companyName: { type: String, required: true },
  title: { type: String, required: true },
  stream: { type: String, required: true },
  type: { type: String, required: true },
  location: { type: String, default: 'On-site' },
  stipend: { type: String, default: 'Unpaid' },
  duration: { type: String, default: '6 Months' },
  openings: { type: Number, default: 1 },
  status: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'pending' },
  requiredSkills: [{ type: String }],
  description: { type: String },
  eligibility: { type: String },
  postedAt: { type: Date, default: Date.now }
});

const ApplicationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  opportunityId: { type: String, required: true },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  studentDegree: { type: String },
  companyName: { type: String, required: true },
  opportunityTitle: { type: String, required: true },
  matchScore: { type: Number, default: 0 },
  matchingSkills: [{ type: String }],
  missingSkills: [{ type: String }],
  status: { 
    type: String, 
    enum: ['applied', 'under_review', 'shortlisted', 'interview_scheduled', 'offered', 'accepted', 'rejected'], 
    default: 'applied' 
  },
  interviewDetails: {
    dateTime: String,
    interviewer: String,
    meetingLink: String,
    notes: String
  },
  appliedAt: { type: Date, default: Date.now }
});

const AssessmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  stream: { type: String, required: true },
  title: { type: String, required: true },
  durationMinutes: { type: Number, default: 15 },
  passingScore: { type: Number, default: 70 },
  description: { type: String },
  questions: [{
    id: Number,
    question: String,
    options: [String],
    correctAnswer: Number,
    rationale: String
  }]
});

export const User = mongoose.model('User', UserSchema);
export const Opportunity = mongoose.model('Opportunity', OpportunitySchema);
export const Application = mongoose.model('Application', ApplicationSchema);
export const Assessment = mongoose.model('Assessment', AssessmentSchema);
