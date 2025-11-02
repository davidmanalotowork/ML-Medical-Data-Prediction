import { useState, useCallback } from 'react';
import { manualEntryService, PatientFormData, PredictionResult, MLAnalysis } from '../services/manualEntryService';

type Status = 'idle' | 'predicting' | 'saving' | 'loading' | 'success' | 'error';

interface SavedEntry {
  _id: string;
  patientId: string;
  fullName: string;
  prediction: PredictionResult;
  createdAt: string;
  pdfDownloadUrl?: string;
  excelDownloadUrl?: string;
}

interface UseManualEntryReturn {
  formData: PatientFormData;
  prediction: PredictionResult | null;
  mlAnalysis: MLAnalysis | null;
  recentEntries: SavedEntry[];
  status: Status;
  error: string | null;
  sessionId: string | null;
  pdfDownloadUrl: string | null;
  excelDownloadUrl: string | null;
  updateField: (field: keyof PatientFormData, value: any) => void;
  predictReadmission: () => Promise<void>;
  saveEntry: () => Promise<void>;
  resetForm: () => void;
  loadRecentEntries: () => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  exportPDF: () => Promise<void>;
  exportExcel: () => Promise<void>;
}

const initialFormData: PatientFormData = {
  patientId: '',
  fullName: '',
  age: 0,
  gender: 'Male',
  admissionDate: '',
  dischargeDate: '',
  admissionType: 'Emergency',
  primaryDiagnosis: '',
  numberOfProcedures: 0,
  numberOfMedications: 0,
  glucoseLevel: 0,
  a1cResult: 0,
  bmi: 0,
};

export const useManualEntry = (): UseManualEntryReturn => {
  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [mlAnalysis, setMlAnalysis] = useState<MLAnalysis | null>(null);
  const [recentEntries, setRecentEntries] = useState<SavedEntry[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);
  const [excelDownloadUrl, setExcelDownloadUrl] = useState<string | null>(null);

  const updateField = useCallback((field: keyof PatientFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const predictReadmission = useCallback(async () => {
    setStatus('predicting');
    setError(null);
    setPrediction(null);
    setMlAnalysis(null);
    setSessionId(null);
    setPdfDownloadUrl(null);
    setExcelDownloadUrl(null);

    try {
      // ✅ NEW: Check for duplicate BEFORE prediction
      const duplicateCheck = await manualEntryService.checkDuplicate(
        formData.patientId,
        formData.fullName
      );

      if (duplicateCheck.isDuplicate) {
        setStatus('error');
        const existingRecord = duplicateCheck.existingRecord;
        
        const errorMsg = `❌ Duplicate Patient Record\n\n` +
          `Patient ID: ${existingRecord.patientId}\n` +
          `Full Name: ${existingRecord.fullName}\n` +
          `Primary Diagnosis: ${existingRecord.primaryDiagnosis}\n` +
          `Risk Level: ${existingRecord.riskLevel || 'Unknown'}\n` +
          `Created: ${new Date(existingRecord.createdAt).toLocaleDateString()}\n\n` +
          `This patient already exists in your records. Please use a different Patient ID or Full Name.`;
        
        setError(errorMsg);
        alert(errorMsg);
        return;
      }

      // ✅ If no duplicate, proceed with prediction
      const response = await manualEntryService.predictReadmission(formData);
      setPrediction(response.data.prediction);
      setMlAnalysis(response.data.mlAnalysis || null);
      setSessionId(response.data.sessionId || null);
      setPdfDownloadUrl(response.data.pdfDownloadUrl || null);
      setExcelDownloadUrl(response.data.excelDownloadUrl || null);
      setStatus('success');
    } catch (err) {
      const errorMessage = (err as Error).message;
      
      if (errorMessage.includes('Unsupported disease')) {
        setError(
          'The selected disease is not supported. Please choose from: Type 2 Diabetes, Chronic Kidney Disease, COPD, Hypertension, or Pneumonia.'
        );
      } else {
        setError(errorMessage);
      }
      
      setStatus('error');
    }
  }, [formData]);

  const loadRecentEntries = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await manualEntryService.getRecentEntries();
      setRecentEntries(Array.isArray(response.data) ? response.data : []);
      setStatus('idle');
    } catch (err) {
      console.error('Failed to load recent entries:', err);
      setRecentEntries([]);
      setStatus('idle');
    }
  }, []);

  const saveEntry = useCallback(async () => {
    if (!prediction) {
      setError('No prediction to save');
      return;
    }

    setStatus('saving');
    setError(null);

    try {
      await manualEntryService.saveEntry(
        formData, 
        prediction, 
        mlAnalysis,
        sessionId || undefined,
        pdfDownloadUrl || undefined,
        excelDownloadUrl || undefined
      );
      setStatus('success');
      // Reload recent entries after successful save
      const response = await manualEntryService.getRecentEntries();
      setRecentEntries(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  }, [formData, prediction, mlAnalysis, sessionId, pdfDownloadUrl, excelDownloadUrl]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setPrediction(null);
    setMlAnalysis(null);
    setError(null);
    setStatus('idle');
    setSessionId(null);
    setPdfDownloadUrl(null);
    setExcelDownloadUrl(null);
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      await manualEntryService.deleteEntry(id);
      // Reload recent entries after successful delete
      const response = await manualEntryService.getRecentEntries();
      setRecentEntries(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const exportPDF = useCallback(async () => {
    if (!pdfDownloadUrl) {
      setError('No PDF report available');
      return;
    }

    try {
      await manualEntryService.downloadPDF(
        pdfDownloadUrl,
        `${formData.patientId}_report.pdf`
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }, [pdfDownloadUrl, formData.patientId]);

  const exportExcel = useCallback(async () => {
    if (!excelDownloadUrl) {
      setError('No Excel report available');
      return;
    }

    try {
      await manualEntryService.downloadExcel(
        excelDownloadUrl,
        `${formData.patientId}_report.xlsx`
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }, [excelDownloadUrl, formData.patientId]);

  return {
    formData,
    prediction,
    mlAnalysis,
    recentEntries,
    status,
    error,
    sessionId,
    pdfDownloadUrl,
    excelDownloadUrl,
    updateField,
    predictReadmission,
    saveEntry,
    resetForm,
    loadRecentEntries,
    deleteEntry,
    exportPDF,
    exportExcel,
  };
};
