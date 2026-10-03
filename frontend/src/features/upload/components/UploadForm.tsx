import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  File,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  Loader2,
  HelpCircle,
  FileText,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUploadViewModel } from '../hooks/useUploadViewModel';
import { FileModel } from '../models/fileModel';
import { HelpModal } from '@/components/HelpModal';

interface UploadFormProps {
  onUploadSuccess?: (data: any, fileName: string) => void;
}

export const UploadForm: React.FC<UploadFormProps> = ({ onUploadSuccess }) => {
  const navigate = useNavigate();
  const {
    status,
    file,
    excelData,
    validationResult,
    uploadResponse,
    error,
    isDragging,
    apiStatus,
    fileInputRef,
    handleFileSelect,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    openFilePicker,
    uploadFile,
    reset,
  } = useUploadViewModel();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // ✅ Track if callback has been called
  const hasCalledCallback = useRef(false);

  useEffect(() => {
    // ✅ Only call once when status becomes success
    if (status === 'success' && uploadResponse?.data && onUploadSuccess && !hasCalledCallback.current) {
      hasCalledCallback.current = true;
      onUploadSuccess(uploadResponse.data, file?.name || 'upload');
    }
    
    // ✅ Reset flag when status changes away from success
    if (status !== 'success') {
      hasCalledCallback.current = false;
    }
  }, [status, uploadResponse, file, onUploadSuccess]);

  const isProcessing = status === 'validating' || status === 'uploading';

  const getFileIcon = () => {
    if (!file) return <Upload className="w-16 h-16 text-gray-400" />;
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.csv')) {
      return <File className="w-5 h-5 text-green-600 mt-0.5" />;
    }
    return <File className="w-5 h-5 text-blue-600 mt-0.5" />;
  };

  return (
    <div className="space-y-6">
      {/* API Status Badge */}
      <div className="flex justify-end">
        <Badge
          variant={apiStatus.isConnected ? 'success' : 'destructive'}
          className="flex items-center gap-2"
        >
          <div
            className={`w-2 h-2 rounded-full ${
              apiStatus.isConnected ? 'bg-white animate-pulse' : 'bg-white'
            }`}
          />
          <span>{apiStatus.message}</span>
          {apiStatus.modelVersion && (
            <span className="border-l border-current/30 pl-2">
              Model v{apiStatus.modelVersion}
            </span>
          )}
        </Badge>
      </div>

      {/* Upload Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            Upload Patient Data
          </CardTitle>
          <CardDescription>
            Upload a CSV or Excel .xlsx file containing patient data for risk analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <a
            href="/sample-patient-data.csv"
            download
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900"
          >
            <Download className="h-4 w-4" />
            Download CSV template
          </a>

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFilePicker}
            className={`
              relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              transition-all duration-200 ease-in-out
              ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }
              ${isProcessing ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isProcessing}
            />

            <div className="flex flex-col items-center gap-4">
              {isProcessing ? (
                <>
                  <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-700">
                      {status === 'validating' && 'Validating file...'}
                      {status === 'uploading' && 'Processing with AI model...'}
                    </p>
                    <Progress value={status === 'uploading' ? 75 : 50} className="w-64" />
                    {status === 'uploading' && (
                      <p className="text-sm text-gray-500">
                        Analyzing the uploaded file...
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <Upload className="w-16 h-16 text-gray-400" />
                    {isDragging && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Upload className="w-16 h-16 text-blue-500 animate-bounce" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-700">
                      {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
                    </p>
                    <p className="text-sm text-gray-500">or click to browse files</p>
                    <p className="text-xs text-gray-400">
                      Accepted formats: CSV and Excel (.xlsx) - Max 10MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* File Info Display */}
          {file && validationResult?.isValid && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                {getFileIcon()}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {FileModel.formatFileSize(file.size)}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  {excelData && (
                    <p className="text-sm text-gray-600">
                      File ready for server-side validation and analysis
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {status === 'success' && uploadResponse && (
            <Alert className="border-green-200 bg-green-50 text-green-900">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>{uploadResponse.message}</strong>
                {uploadResponse.data && (
                  <div className="mt-2 text-sm">
                    <p>File: {uploadResponse.data.fileName}</p>
                    <p>Processed {uploadResponse.data.rowCount} records</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={openFilePicker}
              disabled={isProcessing}
              className="flex items-center gap-2"
              variant="default"
            >
              <Upload className="w-4 h-4" />
              Upload File
            </Button>
            <Button
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
              variant="outline"
            >
              <FileText className="w-4 h-4" />
              Manual Entry
            </Button>
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              onClick={() => setIsHelpModalOpen(true)}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <HelpCircle className="w-4 h-4" />
              Help
            </Button>

            {(file || status === 'success') && (
              <Button
                onClick={reset}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </Button>
            )}
          </div>

          {/* Process Button - Shows when file is loaded */}
          {excelData && status === 'idle' && (
            <div className="pt-4">
              <Button
                onClick={uploadFile}
                className="w-full flex items-center justify-center gap-2"
                size="lg"
              >
                <Upload className="w-5 h-5" />
                Process and Analyze Data with AI
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Help Modal */}
      <HelpModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />
    </div>
  );
};
