const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const PYTHON_ML_API = import.meta.env.VITE_PYTHON_ML_API || 'http://localhost:8000';

interface PatientFormData {
  patientId: string;
  fullName: string;
  age: number;
  gender: string;
  admissionDate: string;
  dischargeDate: string;
  admissionType: string;
  primaryDiagnosis: string;
  numberOfProcedures: number;
  numberOfMedications: number;
  glucoseLevel: number;
  a1cResult: number;
  bmi: number;
}

interface PredictionResult {
  riskScore: number;
  riskLevel: string;
  recommendation: string;
  interpretation?: string;
  topFeatures?: Array<{
    Feature: string;
    Contribution: number;
    Value: any;
    Interpretation: string;
  }>;
  disease?: string;
}

interface MLAnalysis {
  summary?: string;
  clinicalRecommendations?: string;
  medicationRecommendations?: string;
  relatedDiseases?: string;
}

interface PredictionResponse {
  success: boolean;
  message: string;
  data: {
    prediction: PredictionResult;
    patientData: PatientFormData;
    mlAnalysis?: MLAnalysis;
    sessionId?: string;
    pdfDownloadUrl?: string;
    excelDownloadUrl?: string;
  };
}

class ManualEntryService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    if (!token) {
      console.warn('⚠️ No authentication token found');
    }
    
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async predictReadmission(formData: PatientFormData): Promise<PredictionResponse> {
    const response = await fetch(`${API_BASE_URL}/manual-entry/predict`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Prediction failed');
    }

    return response.json();
  }

  async saveEntry(
    patientData: PatientFormData, 
    prediction: PredictionResult,
    mlAnalysis: MLAnalysis | null,
    sessionId?: string,
    pdfDownloadUrl?: string,
    excelDownloadUrl?: string
  ): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/manual-entry/save`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ 
        patientData, 
        prediction,
        mlAnalysis,
        sessionId,
        pdfDownloadUrl,
        excelDownloadUrl
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save entry');
    }

    return response.json();
  }

  async getRecentEntries(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/manual-entry/recent`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to load recent entries');
    }

    return response.json();
  }

  async deleteEntry(id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/manual-entry/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete entry');
    }

    return response.json();
  }

  async downloadPDF(url: string, filename: string): Promise<void> {
    try {
      const fullUrl = `${PYTHON_ML_API}${url}`;
      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('PDF download error:', error);
      throw new Error('Failed to download PDF report');
    }
  }

  // ✅ NEW: Download Excel report
  async downloadExcel(url: string, filename: string): Promise<void> {
    try {
      const fullUrl = `${PYTHON_ML_API}${url}`;
      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        throw new Error('Failed to download Excel');
      }

      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Excel download error:', error);
      throw new Error('Failed to download Excel report');
    }
  }
}

export const manualEntryService = new ManualEntryService();
export type { PatientFormData, PredictionResult, PredictionResponse, MLAnalysis };