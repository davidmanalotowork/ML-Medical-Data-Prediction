import mongoose from 'mongoose';

const manualEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Admin',
    index: true
  },
  patientId: {
    type: String,
    required: true,
    index: true
  },
  fullName: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  admissionDate: {
    type: String,
    required: true
  },
  dischargeDate: {
    type: String,
    required: true
  },
  admissionType: {
    type: String,
    enum: ['Emergency', 'Urgent', 'Elective'],
    required: true
  },
  primaryDiagnosis: {
    type: String,
    required: true
  },
  secondaryDiagnoses: {
    type: String,
    default: ''
  },
  numberOfProcedures: {
    type: Number,
    default: 0
  },
  numberOfMedications: {
    type: Number,
    default: 0
  },
  glucoseLevel: {
    type: Number,
    default: 0
  },
  a1cResult: {
    type: Number,
    default: 0
  },
  bmi: {
    type: Number,
    default: 0
  },
  prediction: {
    riskScore: Number,
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High']
    },
    recommendation: String,
    interpretation: String,
    topFeatures: [{
      Feature: String,
      Contribution: Number,
      Value: mongoose.Schema.Types.Mixed,
      Interpretation: String
    }],
    disease: String
  },
  mlAnalysis: {
    summary: String,
    clinicalRecommendations: String,
    medicationRecommendations: String,
    relatedDiseases: String
  },
  sessionId: String,
  pdfDownloadUrl: String,
  excelDownloadUrl: String,
  enteredBy: {
    name: String,
    email: String,
    role: String
  }
}, {
  timestamps: true
});

manualEntrySchema.index({ userId: 1, createdAt: -1 });

manualEntrySchema.index(
  { 
    userId: 1, 
    patientId: 1,
    fullName: 1
  }, 
  { 
    unique: true,
    name: 'unique_patient_id_name_per_user'
  }
);

const ManualEntry = mongoose.model('ManualEntry', manualEntrySchema);

export default ManualEntry;