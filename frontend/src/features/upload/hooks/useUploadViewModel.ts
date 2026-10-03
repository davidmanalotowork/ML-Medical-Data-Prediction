import { useState, useCallback, useRef, useEffect } from 'react';
import { FileModel, FileValidationResult, ExcelFileData } from '../models/fileModel';
import { uploadService, UploadResponse, ApiStatus } from '../services/uploadService';

export type UploadStatus = 'idle' | 'validating' | 'uploading' | 'success' | 'error';

interface UploadState {
  status: UploadStatus;
  file: File | null;
  excelData: ExcelFileData | null;
  validationResult: FileValidationResult | null;
  uploadResponse: UploadResponse | null;
  error: string | null;
  isDragging: boolean;
  apiStatus: ApiStatus;
}

export const useUploadViewModel = () => {
  const [state, setState] = useState<UploadState>({
    status: 'idle',
    file: null,
    excelData: null,
    validationResult: null,
    uploadResponse: null,
    error: null,
    isDragging: false,
    apiStatus: {
      isConnected: false,
      message: 'Checking...',
      timestamp: Date.now(),
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkApiConnection();
    const interval = setInterval(checkApiConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkApiConnection = async () => {
    const status = await uploadService.checkApiStatus();
    setState((prev) => ({ ...prev, apiStatus: status }));
  };

  const handleFile = useCallback((file: File) => {
    setState((prev) => ({
      ...prev,
      status: 'validating',
      file,
      excelData: null,
      uploadResponse: null,
      error: null,
    }));

    const validationResult = FileModel.validateFile(file);

    if (!validationResult.isValid) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        validationResult,
        error: validationResult.error || 'Invalid file',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      status: 'idle',
      validationResult,
      excelData: { file },
    }));
  }, []);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState((prev) => ({ ...prev, isDragging: true }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState((prev) => ({ ...prev, isDragging: false }));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setState((prev) => ({ ...prev, isDragging: false }));

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const uploadFile = useCallback(async () => {
    if (!state.excelData) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: 'No file data to upload',
      }));
      return;
    }

    setState((prev) => ({ ...prev, status: 'uploading' }));

    try {
      const response = await uploadService.uploadFile(state.excelData);

      if (response.success) {
        setState((prev) => ({
          ...prev,
          status: 'success',
          uploadResponse: response,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: response.error || 'Upload failed',
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: (error as Error).message,
      }));
    }
  }, [state.excelData]);

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      file: null,
      excelData: null,
      validationResult: null,
      uploadResponse: null,
      error: null,
      isDragging: false,
      apiStatus: state.apiStatus,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [state.apiStatus]);

  return {
    ...state,

    fileInputRef,

    handleFileSelect,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    openFilePicker,
    uploadFile,
    reset,
    checkApiConnection,
  };
};
