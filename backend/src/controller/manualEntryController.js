import { body, validationResult } from 'express-validator';
import axios from 'axios';
import FormData from 'form-data';
import ManualEntry from '../models/ManualEntry.js';

const PYTHON_ML_API = process.env.PYTHON_ML_API || 'http://localhost:8000';

// At the top of the file, define supported diseases
const SUPPORTED_DISEASES = [
  'Type 2 Diabetes',
  'Chronic Kidney Disease',
  'COPD',
  'Hypertension',
  'Pneumonia'
];

// ✅ NEW: Date validation helper
const validateDateRange = (dateString) => {
  const date = new Date(dateString);
  const currentYear = new Date().getFullYear();
  const dateYear = date.getFullYear();
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }
  
  // Check if year is within reasonable range (current year ± 1)
  if (dateYear > currentYear + 1 || dateYear < 1900) {
    return { 
      isValid: false, 
      error: `Invalid date: admission and discharge dates must be within a reasonable timeframe (year must be between 1900 and ${currentYear + 1})` 
    };
  }
  
  return { isValid: true };
};

// ✅ NEW: Age validation helper
const validateAge = (age) => {
  if (age < 0 || age > 120) {
    return { 
      isValid: false, 
      error: 'Invalid age: must be between 0 and 120' 
    };
  }
  return { isValid: true };
};

// ✅ NEW: Validate discharge date is after admission date
const validateDateSequence = (admissionDate, dischargeDate) => {
  const admission = new Date(admissionDate);
  const discharge = new Date(dischargeDate);
  
  if (discharge < admission) {
    return { 
      isValid: false, 
      error: 'Discharge date must be after admission date' 
    };
  }
  
  return { isValid: true };
};

// Helper function to convert form data to DataFrame-compatible format
const convertToDataFrame = (patientData) => {
  return {
    patient_name: patientData.fullName,
    patient_id: patientData.patientId,
    age: patientData.age,
    sex: patientData.gender,
    admission_type: patientData.admissionType,
    admission_date: patientData.admissionDate,
    discharge_date: patientData.dischargeDate,
    primary_diagnosis: patientData.primaryDiagnosis,
    secondary_diagnoses: patientData.secondaryDiagnoses,
    number_of_procedures: patientData.numberOfProcedures || 0,
    number_of_medications: patientData.numberOfMedications || 0,
    glucose_level: patientData.glucoseLevel || 0,
    hba1c: patientData.a1cResult || 0,
    bmi: patientData.bmi || 0,
  };
};

// Helper to detect disease from primary diagnosis
const detectDiseaseFromDiagnosis = (diagnosis) => {
  // ✅ NEW: First check if diagnosis exactly matches a supported disease
  if (SUPPORTED_DISEASES.includes(diagnosis)) {
    return diagnosis;
  }

  // ✅ NEW: If not exact match, try fuzzy matching
  const diagnosisLower = diagnosis.toLowerCase();
  
  if (diagnosisLower.includes('diabetes') || diagnosisLower.includes('dm') || diagnosisLower.includes('t2d')) {
    return 'Type 2 Diabetes';
  } else if (diagnosisLower.includes('kidney') || diagnosisLower.includes('ckd') || diagnosisLower.includes('renal')) {
    return 'Chronic Kidney Disease';
  } else if (diagnosisLower.includes('copd') || diagnosisLower.includes('pulmonary')) {
    return 'COPD';
  } else if (diagnosisLower.includes('hypertension') || diagnosisLower.includes('htn') || diagnosisLower.includes('blood pressure')) {
    return 'Hypertension';
  } else if (diagnosisLower.includes('pneumonia')) {
    return 'Pneumonia';
  }
  
  // ✅ NEW: Throw error if disease not supported
  throw new Error(
    `Unsupported disease: "${diagnosis}". Please select one of: ${SUPPORTED_DISEASES.join(', ')}`
  );
};

// ✅ NEW: Check for duplicate before prediction
export const checkDuplicate = async (req, res) => {
  try {
    const user = req.user;
    const { patientId, fullName } = req.body;

    if (!user || !patientId || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'User, Patient ID, and Full Name are required',
      });
    }

    // Check if entry exists
    const existingEntry = await ManualEntry.findOne({
      userId: user.id,
      patientId: patientId,
      fullName: fullName
    });

    if (existingEntry) {
      return res.status(200).json({
        success: true,
        isDuplicate: true,
        message: `A patient with ID "${patientId}" and name "${fullName}" already exists in your records.`,
        existingRecord: {
          patientId: existingEntry.patientId,
          fullName: existingEntry.fullName,
          primaryDiagnosis: existingEntry.primaryDiagnosis,
          createdAt: existingEntry.createdAt,
          riskLevel: existingEntry.prediction?.riskLevel
        }
      });
    }

    return res.status(200).json({
      success: true,
      isDuplicate: false,
      message: 'No duplicate found'
    });

  } catch (error) {
    console.error('Error checking duplicate:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking for duplicates',
    });
  }
};

export const predictManualEntry = async (req, res) => {
  try {
    // ✅ Step 1: Check for validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const patientData = req.body;

    // ✅ Step 2: Custom age validation
    const ageValidation = validateAge(patientData.age);
    if (!ageValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: ageValidation.error,
      });
    }

    // ✅ Step 3: Custom date validation
    const admissionDateValidation = validateDateRange(patientData.admissionDate);
    if (!admissionDateValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Admission date error: ${admissionDateValidation.error}`,
      });
    }

    const dischargeDateValidation = validateDateRange(patientData.dischargeDate);
    if (!dischargeDateValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Discharge date error: ${dischargeDateValidation.error}`,
      });
    }

    // ✅ Step 4: Validate date sequence
    const dateSequenceValidation = validateDateSequence(
      patientData.admissionDate, 
      patientData.dischargeDate
    );
    if (!dateSequenceValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: dateSequenceValidation.error,
      });
    }

    // ✅ Step 5: Patient ID rule - if provided, don't autofill name
    // (This is a frontend responsibility, backend just validates required fields exist)
    if (!patientData.patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required',
      });
    }

    if (!patientData.fullName) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required',
      });
    }

    // ✅ Step 6: Detect disease with error handling
    let disease;
    try {
      disease = detectDiseaseFromDiagnosis(patientData.primaryDiagnosis);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
        supportedDiseases: SUPPORTED_DISEASES,
      });
    }

    console.log('✅ All validations passed. Proceeding with prediction...');

    // Convert to DataFrame format
    const dataForML = convertToDataFrame(patientData);

    // Create CSV string from single row
    const csvHeaders = Object.keys(dataForML).join(',');
    const csvValues = Object.values(dataForML).map(v => 
      typeof v === 'string' && v.includes(',') ? `"${v}"` : v
    ).join(',');
    const csvContent = `${csvHeaders}\n${csvValues}`;

    // Create FormData for Python API
    const formData = new FormData();
    formData.append('disease', disease);
    formData.append('file', Buffer.from(csvContent), {
      filename: `manual_entry_${patientData.patientId}.csv`,
      contentType: 'text/csv',
    });

    console.log(`🔮 Calling Python ML API for disease: ${disease}`);

    // Call Python ML API
    const mlResponse = await axios.post(`${PYTHON_ML_API}/analyze`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000,
    });

    const mlData = mlResponse.data;

    console.log('✅ ML API Response:', {
      disease: mlData.disease,
      probability: mlData.probability,
      decision: mlData.decision,
    });

    // ✅ NEW: Function to extract clean recommendation
    const extractCleanRecommendation = (mlData) => {
      const riskScore = mlData.probability;
      
      // Generate simple, actionable recommendation based on risk
      if (riskScore >= 0.7) {
        return `High readmission risk detected (${(riskScore * 100).toFixed(1)}%). Immediate action recommended: Schedule follow-up within 72 hours, consider home health services, review medication adherence, and monitor for warning signs closely.`;
      } else if (riskScore >= 0.4) {
        return `Moderate readmission risk identified (${(riskScore * 100).toFixed(1)}%). Recommended actions: Schedule follow-up within 7-14 days, reinforce medication instructions, provide patient education materials, and ensure clear discharge instructions.`;
      } else {
        return `Low readmission risk predicted (${(riskScore * 100).toFixed(1)}%). Standard care recommended: Schedule routine follow-up within 30 days, continue prescribed medications, and advise patient to contact healthcare provider if symptoms worsen.`;
      }
    };

    // Map ML response to frontend format
    const riskScore = mlData.probability;
    let riskLevel = 'Low';
    if (riskScore >= 0.7) riskLevel = 'High';
    else if (riskScore >= 0.4) riskLevel = 'Medium';

    const prediction = {
      riskScore,
      riskLevel,
      recommendation: extractCleanRecommendation(mlData),
      interpretation: mlData.interpretation,
      topFeatures: mlData.top_features?.slice(0, 5) || [],
      disease: mlData.disease,
    };

    res.status(200).json({
      success: true,
      message: 'Prediction generated successfully',
      data: {
        prediction,
        patientData,
        mlAnalysis: {
          summary: mlData.summary,
          clinicalRecommendations: mlData.clinical_recommendations,
          medicationRecommendations: mlData.medication_recommendations,
          relatedDiseases: mlData.related_disease_predictions,
        },
        sessionId: mlData.session_id,
        pdfDownloadUrl: mlData.download_links?.pdf,
        excelDownloadUrl: mlData.download_links?.excel,
      },
    });

  } catch (error) {
    console.error('Error in manual entry prediction:', error.response?.data || error.message);
    
    // Fallback to rule-based if ML API fails
    if (error.code === 'ECONNREFUSED' || error.response?.status >= 500) {
      console.warn('⚠️ ML API unavailable, using rule-based prediction');
      return fallbackRuleBasedPrediction(req, res);
    }

    res.status(500).json({
      success: false,
      message: 'Error generating prediction',
      error: error.response?.data?.error || error.message,
    });
  }
};

// Fallback rule-based prediction (keep existing code)
const fallbackRuleBasedPrediction = (req, res) => {
  const patientData = req.body;

  const riskFactors = {
    age: patientData.age > 65 ? 2 : patientData.age > 50 ? 1 : 0,
    admissionType: patientData.admissionType === 'Emergency' ? 2 : 
                   patientData.admissionType === 'Urgent' ? 1 : 0,
    procedures: patientData.numberOfProcedures > 5 ? 2 : 
                patientData.numberOfProcedures > 2 ? 1 : 0,
    medications: patientData.numberOfMedications > 10 ? 2 : 
                 patientData.numberOfMedications > 5 ? 1 : 0,
    glucose: patientData.glucoseLevel > 180 ? 2 : 
             patientData.glucoseLevel > 140 ? 1 : 0,
    a1c: patientData.a1cResult > 7.0 ? 2 : 
         patientData.a1cResult > 6.5 ? 1 : 0,
    bmi: patientData.bmi > 30 ? 1 : 0,
  };

  const totalRiskScore = Object.values(riskFactors).reduce((sum, val) => sum + val, 0);
  const maxPossibleScore = 11;
  const riskScore = totalRiskScore / maxPossibleScore;

  let riskLevel = 'Low';
  let recommendation = 'Continue with standard post-discharge care.';

  if (riskScore >= 0.6) {
    riskLevel = 'High';
    recommendation = 'Schedule follow-up within 72 hours. Consider home health services.';
  } else if (riskScore >= 0.3) {
    riskLevel = 'Medium';
    recommendation = 'Schedule follow-up within 7 days. Monitor symptoms closely.';
  }

  const prediction = {
    riskScore,
    riskLevel,
    recommendation,
    note: 'Prediction generated using rule-based system (ML API unavailable)',
  };

  res.status(200).json({
    success: true,
    message: 'Prediction generated successfully (rule-based fallback)',
    data: { prediction, patientData },
  });
};

export const saveManualEntry = async (req, res) => {
  try {
    const user = req.user;

    if (!user || (user.role !== 'doctor' && user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({
        success: false,
        message: 'Only doctors and admins can save manual entries',
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { patientData, prediction, mlAnalysis, sessionId, pdfDownloadUrl, excelDownloadUrl } = req.body;

    // ✅ Keep duplicate check here as backup (in case frontend check is bypassed)
    const existingEntry = await ManualEntry.findOne({
      userId: user.id,
      patientId: patientData.patientId,
      fullName: patientData.fullName
    });

    if (existingEntry) {
      return res.status(409).json({
        success: false,
        message: `A patient with ID "${patientData.patientId}" and name "${patientData.fullName}" already exists.`,
      });
    }

    // Create new manual entry
    const manualEntry = new ManualEntry({
      userId: user.id,
      patientId: patientData.patientId,
      fullName: patientData.fullName,
      age: patientData.age,
      gender: patientData.gender,
      admissionDate: patientData.admissionDate,
      dischargeDate: patientData.dischargeDate,
      admissionType: patientData.admissionType,
      primaryDiagnosis: patientData.primaryDiagnosis,
      secondaryDiagnoses: patientData.secondaryDiagnoses,
      numberOfProcedures: patientData.numberOfProcedures || 0,
      numberOfMedications: patientData.numberOfMedications || 0,
      glucoseLevel: patientData.glucoseLevel || 0,
      a1cResult: patientData.a1cResult || 0,
      bmi: patientData.bmi || 0,
      prediction: {
        riskScore: prediction.riskScore,
        riskLevel: prediction.riskLevel,
        recommendation: prediction.recommendation,
        interpretation: prediction.interpretation,
        topFeatures: prediction.topFeatures || [],
        disease: prediction.disease,
      },
      mlAnalysis: {
        summary: mlAnalysis?.summary,
        clinicalRecommendations: mlAnalysis?.clinicalRecommendations,
        medicationRecommendations: mlAnalysis?.medicationRecommendations,
        relatedDiseases: mlAnalysis?.relatedDiseases,
      },
      sessionId: sessionId,
      pdfDownloadUrl: pdfDownloadUrl,
      excelDownloadUrl: excelDownloadUrl,
      enteredBy: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    await manualEntry.save();

    res.json({
      success: true,
      message: 'Manual entry saved successfully',
      data: manualEntry,
    });

  } catch (error) {
    console.error('Error saving manual entry:', error);
    
    // Handle duplicate key error from MongoDB
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This patient record already exists. Please use a different Patient ID and Full Name combination.',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to save manual entry',
    });
  }
};

export const getRecentEntries = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Get last 5 entries for this user
    const entries = await ManualEntry.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: entries,
      total: entries.length,
    });

  } catch (error) {
    console.error('Error fetching recent entries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent entries',
      error: error.message,
    });
  }
};

// ✅ ADD: Delete entry function
export const deleteEntry = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Find and verify ownership
    const entry = await ManualEntry.findOne({
      _id: id,
      userId: user.id,
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found or you do not have permission to delete it',
      });
    }

    // Delete the entry
    await ManualEntry.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Entry deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete entry',
    });
  }
};

export const validateManualEntry = [
  body('patientId').trim().notEmpty().withMessage('Patient ID is required'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('age').isInt({ min: 0, max: 120 }).withMessage('Age must be between 0 and 120'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('admissionDate').isISO8601().withMessage('Invalid admission date'),
  body('dischargeDate').isISO8601().withMessage('Invalid discharge date'),
  body('admissionType').isIn(['Emergency', 'Urgent', 'Elective']).withMessage('Invalid admission type'),
  body('primaryDiagnosis')
    .trim()
    .notEmpty()
    .withMessage('Primary diagnosis is required')
    .custom((value) => {
      const supportedDiseases = [
        'Type 2 Diabetes',
        'Chronic Kidney Disease',
        'COPD',
        'Hypertension',
        'Pneumonia'
      ];
      
      if (!supportedDiseases.includes(value)) {
        throw new Error(
          `Primary diagnosis must be one of: ${supportedDiseases.join(', ')}`
        );
      }
      
      return true;
    }),
];
