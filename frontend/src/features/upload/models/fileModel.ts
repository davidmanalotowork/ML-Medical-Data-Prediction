export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
}

export interface ExcelFileData {
  file: File;
  data?: any[];
  headers?: string[];
  rowCount?: number;
}

export class FileModel {
  private static readonly ACCEPTED_TYPES = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/csv',
  ];

  private static readonly ACCEPTED_EXTENSIONS = ['.xlsx', '.csv'];
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024;

  // Required medical columns for validation
  private static readonly REQUIRED_MEDICAL_KEYWORDS = [
    'patient', 'age', 'admission', 'diagnosis', 'medical', 'hospital',
    'los', 'length_of_stay', 'readmission', 'visit', 'discharge'
  ];

  // Keywords that indicate non-medical data
  private static readonly NON_MEDICAL_KEYWORDS = [
    'product', 'price', 'quantity', 'sales', 'customer', 'order',
    'invoice', 'item', 'category', 'sku', 'discount', 'payment',
    'store', 'cashier', 'total', 'subtotal', 'tax', 'supplier',
    'inventory', 'warehouse', 'shipping', 'delivery'
  ];

  static validateFile(file: File): FileValidationResult {
    if (!file) {
      return {
        isValid: false,
        error: 'No file provided',
      };
    }

    const fileName = file.name.toLowerCase();
    const hasValidExtension = this.ACCEPTED_EXTENSIONS.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!hasValidExtension) {
      return {
        isValid: false,
        error: 'Invalid file type. Please upload a CSV or Excel .xlsx file.',
      };
    }

    const hasValidType =
      this.ACCEPTED_TYPES.includes(file.type) ||
      file.type === '' ||
      file.type === 'application/octet-stream';

    if (!hasValidType && file.type !== '') {
      return {
        isValid: false,
        error: 'Invalid file type. Please upload an Excel or CSV file',
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds maximum limit of ${this.formatFileSize(
          this.MAX_FILE_SIZE
        )}`,
      };
    }

    if (file.size === 0) {
      return {
        isValid: false,
        error: 'File is empty',
      };
    }

    return {
      isValid: true,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        lastModified: file.lastModified,
      },
    };
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  static validateExcelStructure(
    headers: string[],
    requiredColumns?: string[]
  ): FileValidationResult {
    if (!headers || headers.length === 0) {
      return {
        isValid: false,
        error: 'Excel file has no headers',
      };
    }

    // Convert headers to lowercase for case-insensitive comparison
    const lowerHeaders = headers.map(h => h.toLowerCase().trim());

    // Check for non-medical keywords
    const hasNonMedical = lowerHeaders.some(header =>
      this.NON_MEDICAL_KEYWORDS.some(keyword => header.includes(keyword))
    );

    if (hasNonMedical) {
      return {
        isValid: false,
        error: 'This file appears to contain non-medical data (e.g., retail/sales data). Please upload hospital readmission patient data with columns like: patient_id, age, admission_date, diagnosis, etc.',
      };
    }

    // Check for at least one medical keyword
    const hasMedicalKeyword = lowerHeaders.some(header =>
      this.REQUIRED_MEDICAL_KEYWORDS.some(keyword => header.includes(keyword))
    );

    if (!hasMedicalKeyword && headers.length > 3) {
      return {
        isValid: false,
        error: 'This file does not appear to contain hospital readmission data. Please upload a file with patient medical information including columns like: patient_id, age, admission_date, diagnosis, length_of_stay, etc.',
      };
    }

    if (requiredColumns && requiredColumns.length > 0) {
      const missingColumns = requiredColumns.filter(
        (col) => !headers.includes(col)
      );

      if (missingColumns.length > 0) {
        return {
          isValid: false,
          error: `Missing required columns: ${missingColumns.join(', ')}`,
        };
      }
    }

    return {
      isValid: true,
    };
  }

  static getSampleData(): any[] {
    return [
      {
        patient_id: 'P001',
        age: 65,
        gender: 'Male',
        admission_date: '2025-01-15',
        discharge_date: '2025-01-20',
        diagnosis: 'Heart Failure',
        length_of_stay: 5,
        previous_admissions: 2,
        risk_score: 0.75,
      },
      {
        patient_id: 'P002',
        age: 72,
        gender: 'Female',
        admission_date: '2025-01-18',
        discharge_date: '2025-01-23',
        diagnosis: 'Pneumonia',
        length_of_stay: 5,
        previous_admissions: 1,
        risk_score: 0.62,
      },
      {
        patient_id: 'P003',
        age: 58,
        gender: 'Male',
        admission_date: '2025-01-20',
        discharge_date: '2025-01-22',
        diagnosis: 'COPD',
        length_of_stay: 2,
        previous_admissions: 3,
        risk_score: 0.85,
      },
      {
        patient_id: 'P004',
        age: 81,
        gender: 'Female',
        admission_date: '2025-01-22',
        discharge_date: '2025-01-28',
        diagnosis: 'Diabetes Complications',
        length_of_stay: 6,
        previous_admissions: 4,
        risk_score: 0.91,
      },
      {
        patient_id: 'P005',
        age: 67,
        gender: 'Male',
        admission_date: '2025-01-25',
        discharge_date: '2025-01-27',
        diagnosis: 'Stroke',
        length_of_stay: 2,
        previous_admissions: 0,
        risk_score: 0.45,
      },
    ];
  }
}
