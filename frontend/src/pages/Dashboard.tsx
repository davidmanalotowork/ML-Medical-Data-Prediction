import React, { useState, useRef } from 'react';
import { CheckCircle2, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { authService } from '@/features/auth/services/authService';
import { Navbar } from '@/components/Navbar';
import { UploadForm } from '@/features/upload/components/UploadForm';
import { ResultsTable, PredictionResult } from '@/features/upload/components/ResultsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const DashboardPage: React.FC = () => {
  const user = authService.getUser();
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [disease, setDisease] = useState<string>('');
  const [saveError, setSaveError] = useState<string>('');
  
  const [sessionId, setSessionId] = useState<string>('');
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string>('');
  const [excelDownloadUrl, setExcelDownloadUrl] = useState<string>('');
  
  const savedUploadsRef = useRef<Set<string>>(new Set());

  const handleUploadSuccess = async (data: any, fileName: string, fileSize?: number) => {
    if (data.predictions && Array.isArray(data.predictions)) {
      setResults(data.predictions);
      setUploadedFileName(fileName);
      setDisease(data.disease || '');
      setSaveError('');
      
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.pdfDownloadUrl) setPdfDownloadUrl(data.pdfDownloadUrl);
      if (data.excelDownloadUrl) setExcelDownloadUrl(data.excelDownloadUrl);
      
      await saveToHistory({
        fileName: fileName,
        fileSize: fileSize || data.fileSize || 0,
        predictions: data.predictions,
        disease: data.disease,
        sessionId: data.sessionId,
        pdfDownloadUrl: data.pdfDownloadUrl,
        excelDownloadUrl: data.excelDownloadUrl,
      });
    }
  };

  const saveToHistory = async (uploadData: any) => {
    const uploadIdentifier = `${uploadData.fileName}-${Date.now()}`;
    
    if (savedUploadsRef.current.has(uploadIdentifier)) {
      console.log('Upload already saved, skipping duplicate');
      return;
    }

    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Preparing history data with URLs:', {
        fileName: uploadData.fileName,
        sessionId: uploadData.sessionId,
        pdfDownloadUrl: uploadData.pdfDownloadUrl,
        excelDownloadUrl: uploadData.excelDownloadUrl,
        hasUrls: !!(uploadData.pdfDownloadUrl && uploadData.excelDownloadUrl)
      });

      const historyData = {
        fileName: uploadData.fileName,
        uploadDate: new Date().toLocaleDateString(),
        uploadTime: new Date().toLocaleTimeString(),
        recordCount: uploadData.predictions?.length || 0,
        highRiskCount: uploadData.predictions?.filter((p: any) => p.risk === 'High').length || 0,
        mediumRiskCount: uploadData.predictions?.filter((p: any) => p.risk === 'Medium').length || 0,
        lowRiskCount: uploadData.predictions?.filter((p: any) => p.risk === 'Low').length || 0,
        disease: uploadData.disease || 'Unknown',
        predictions: uploadData.predictions || [],
        uploadId: uploadIdentifier,
        sessionId: uploadData.sessionId,
        pdfDownloadUrl: uploadData.pdfDownloadUrl,
        excelDownloadUrl: uploadData.excelDownloadUrl,
      };

      console.log('Sending to /api/history:', JSON.stringify(historyData, null, 2));

      const response = await fetch(`${API_BASE_URL}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(historyData)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP ${response.status}: Failed to save history`);
      }

      console.log('History saved successfully:', responseData);

      savedUploadsRef.current.add(uploadIdentifier);
      setSaveError('');

    } catch (error) {
      console.error('Error saving history:', error);
      setSaveError((error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, <span className="font-semibold">{user?.name || 'User'}</span>! Upload patient data to predict readmission risk using our advanced ML models.
          </p>
        </div>

        <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <FileSpreadsheet className="w-5 h-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm text-gray-700">
              <p>• <strong>Models:</strong> XGBoost Classifier (Type 2 Diabetes, Chronic Kidney Disease, COPD, Hypertension, Pneumonia)</p>
              <p>• <strong>Output:</strong> Risk Band (Low/Medium/High) with probability scores</p>
              <p>• <strong>Supported Formats:</strong> Excel (.xlsx) or CSV (.csv)</p>
              <p>• <strong>Required Columns:</strong> Patient demographics, diagnoses, procedures, medications</p>
              <p>• <strong>Upload history tracking:</strong> Automatically saves past uploads for easy review and re-download of reports</p><p>• <strong>Clinical recommendations:</strong> Provides data-driven insights to support patient care decisions.</p>
            </div>
          </CardContent>
        </Card>

        {saveError && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {saveError}
            </AlertDescription>
          </Alert>
        )}

        <UploadForm onUploadSuccess={handleUploadSuccess} />

        {results.length > 0 && (
          <ResultsTable 
            results={results} 
            fileName={uploadedFileName}
            disease={disease}
            sessionId={sessionId}
            pdfDownloadUrl={pdfDownloadUrl}
            excelDownloadUrl={excelDownloadUrl}
          />
        )}

        <div className="gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Step 1:</strong> Prepare your patient data in Excel or CSV format
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Step 2:</strong> Upload the file using the form above
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Step 3:</strong> Review predictions and download comprehensive reports
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
