import * as XLSX from 'xlsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const PYTHON_ML_API = import.meta.env.VITE_PYTHON_ML_API || 'http://localhost:8000';

interface ExcelFileData {
  file: File;
  data: any[];
  headers: string[];
  rowCount: number;
}

interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    fileName: string;
    rowCount: number;
    predictions: any[];
    disease?: string;
    fileSize?: number;
    sessionId?: string;
    pdfDownloadUrl?: string;
    excelDownloadUrl?: string;
  };
  error?: string;
}

interface ApiStatus {
  isConnected: boolean;
  message: string;
}

class UploadService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async readExcelFile(file: File): Promise<ExcelFileData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length === 0) {
            reject(new Error('File is empty'));
            return;
          }

          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1);

          const dataObjects = rows.map((row: any) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });

          resolve({
            file,
            data: dataObjects,
            headers,
            rowCount: rows.length,
          });
        } catch (error) {
          reject(new Error('Failed to parse Excel file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsBinaryString(file);
    });
  }

  async uploadFile(excelData: ExcelFileData): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', excelData.file);
      
      // Detect disease from filename
      const fileName = excelData.file.name.toLowerCase();
      let disease = 'Type 2 Diabetes'; // default
      
      if (fileName.includes('diabetes')) disease = 'Type 2 Diabetes';
      else if (fileName.includes('pneumonia')) disease = 'Pneumonia';
      else if (fileName.includes('kidney') || fileName.includes('ckd')) disease = 'Chronic Kidney Disease';
      else if (fileName.includes('copd')) disease = 'COPD';
      else if (fileName.includes('hypertension')) disease = 'Hypertension';
      
      formData.append('disease', disease);

      // ✅ Use /analyze endpoint that generates PDF & Excel via test.py
      const mlResponse = await fetch(`${PYTHON_ML_API}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!mlResponse.ok) {
        const errorData = await mlResponse.json();
        throw new Error(errorData.error || 'ML API prediction failed');
      }

      const mlResult = await mlResponse.json();

      // Construct full download URLs by combining API base URL
      const pdfDownloadUrl = `${PYTHON_ML_API}${mlResult.download_links.pdf}`;
      const excelDownloadUrl = `${PYTHON_ML_API}${mlResult.download_links.excel}`;

      return {
        success: true,
        message: `Successfully analyzed patient for ${mlResult.disease}`,
        data: {
          fileName: excelData.file.name,
          rowCount: 1,
          predictions: [{
            no: 1,
            patientId: mlResult.patient_id,
            patientName: mlResult.patient_name || 'Unknown',
            risk: mlResult.decision === 'High Risk' ? 'High' : 'Low',
            probability: mlResult.probability,
            reasons: mlResult.top_features.slice(0, 5).map((f: any) => f.Feature),
            interpretation: mlResult.interpretation
          }],
          disease: mlResult.disease,
          fileSize: excelData.file.size,
          sessionId: mlResult.session_id,
          pdfDownloadUrl: pdfDownloadUrl,    // Include full URL
          excelDownloadUrl: excelDownloadUrl  // Include full URL
        }
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        message: 'Failed to generate predictions',
        error: (error as Error).message,
      };
    }
  }

  // ✅ Add download helper methods
  async downloadReport(url: string, filename: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  async checkApiStatus(): Promise<ApiStatus> {
    try {
      const response = await fetch(`${PYTHON_ML_API}/health`, {
        method: 'GET',
      });

      if (response.ok) {
        return {
          isConnected: true,
          message: 'ML API Connected',
        };
      } else {
        return {
          isConnected: false,
          message: 'ML API Error',
        };
      }
    } catch (error) {
      return {
        isConnected: false,
        message: 'ML API Disconnected',
      };
    }
  }
}

export const uploadService = new UploadService();
export type { UploadResponse, ApiStatus };
