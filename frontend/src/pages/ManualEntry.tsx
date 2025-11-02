import React, { useEffect } from 'react';
import { useManualEntry } from '../features/manual-entry/hooks/useManualEntry';
import { authService } from '../features/auth/services/authService';
import { manualEntryService, PatientFormData } from '../features/manual-entry/services/manualEntryService';
import { Navbar } from '../components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  FileText,
  User,
  Stethoscope,
  Activity,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Save,
  Download,
  Clock,
  Trash2,
  Loader2,
} from 'lucide-react';

// ✅ Client-side validation function
const validateFormData = (formData: PatientFormData): { isValid: boolean; error?: string } => {
  // Age validation
  if (formData.age < 0 || formData.age > 120) {
    return { isValid: false, error: 'Invalid age: must be between 0 and 120' };
  }

  // Date validation
  const currentYear = new Date().getFullYear();
  const admissionDate = new Date(formData.admissionDate);
  const dischargeDate = new Date(formData.dischargeDate);

  if (isNaN(admissionDate.getTime()) || isNaN(dischargeDate.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }

  if (admissionDate.getFullYear() > currentYear + 1 || admissionDate.getFullYear() < 1900) {
    return { 
      isValid: false, 
      error: `Invalid admission date: year must be between 1900 and ${currentYear + 1}` 
    };
  }

  if (dischargeDate.getFullYear() > currentYear + 1 || dischargeDate.getFullYear() < 1900) {
    return { 
      isValid: false, 
      error: `Invalid discharge date: year must be between 1900 and ${currentYear + 1}` 
    };
  }

  // Discharge date must be after admission date
  if (dischargeDate < admissionDate) {
    return { isValid: false, error: 'Discharge date must be after admission date' };
  }

  return { isValid: true };
};

export const ManualEntryPage: React.FC = () => {
  const {
    formData,
    prediction,
    recentEntries,
    status,
    error,
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
    mlAnalysis,
  } = useManualEntry();

  const user = authService.getUser();
  const userRole = user?.role || 'nurse';

  const canSave = userRole === 'doctor' || userRole === 'admin' || userRole === 'superadmin';
  const canDelete = userRole === 'admin' || userRole === 'superadmin';

  useEffect(() => {
    loadRecentEntries();
  }, [loadRecentEntries]);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ Client-side validation before calling API
    const validation = validateFormData(formData);
    if (!validation.isValid) {
      console.error('Validation error:', validation.error);
      return;
    }
    
    await predictReadmission();
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'success';
      default: return 'secondary';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'High': return <AlertCircle className="w-5 h-5" />;
      case 'Medium': return <TrendingUp className="w-5 h-5" />;
      case 'Low': return <CheckCircle2 className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  // ✅ Function to parse HTML and extract text content
  const parseHtmlContent = (htmlString: string) => {
    if (!htmlString) return '';
    
    // Remove HTML tags and clean up
    let text = htmlString
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<b>/gi, '')
      .replace(/<\/b>/gi, '')
      .replace(/<i>/gi, '')
      .replace(/<\/i>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
    
    return text;
  };

  // ✅ Function to render formatted recommendations
  const renderRecommendations = (htmlString: string) => {
    if (!htmlString) return null;

    const sections = htmlString.split('<br/><br/>');
    
    return (
      <div className="space-y-4">
        {sections.map((section, index) => {
          const cleanSection = parseHtmlContent(section);
          if (!cleanSection) return null;

          const lines = cleanSection.split('\n').filter(line => line.trim());
          
          return (
            <div key={index} className="space-y-2">
              {lines.map((line, lineIndex) => {
                const trimmedLine = line.trim();
                
                // Check if it's a header
                const isHeader = trimmedLine.includes(':') && 
                  (trimmedLine.includes('Recommendations') || 
                   trimmedLine.includes('Protocol') || 
                   trimmedLine.includes('Therapy') ||
                   trimmedLine.includes('Conditions') ||
                   trimmedLine.includes('Assessment') ||
                   trimmedLine.includes('Monitoring'));

                // Check if it's a bullet point
                const isBullet = trimmedLine.startsWith('•');

                if (isHeader) {
                  return (
                    <h4 key={lineIndex} className="font-semibold text-gray-900 mt-3">
                      {trimmedLine}
                    </h4>
                  );
                } else if (isBullet) {
                  return (
                    <p key={lineIndex} className="text-sm text-gray-700 pl-4">
                      {trimmedLine}
                    </p>
                  );
                } else if (trimmedLine.length > 0) {
                  return (
                    <p key={lineIndex} className="text-sm text-gray-600 italic">
                      {trimmedLine}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Manual Data Entry
          </h1>
          <p className="text-gray-600">
            Enter patient information manually for readmission risk prediction
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handlePredict}>
              {/* Patient Demographics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Patient Demographics
                  </CardTitle>
                  <CardDescription>
                    Basic patient information and admission details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="patientId" className="text-sm font-medium">
                        Patient ID *
                      </label>
                      <Input
                        id="patientId"
                        value={formData.patientId}
                        onChange={(e) => updateField('patientId', e.target.value)}
                        placeholder="P-12345"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="fullName" className="text-sm font-medium">
                        Full Name *
                      </label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        placeholder="Joshua Co"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="age" className="text-sm font-medium">
                        Age * <span className="text-xs text-gray-500">(0-120)</span>
                      </label>
                      <Input
                        id="age"
                        type="number"
                        min="0"
                        max="120"
                        value={formData.age || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value >= 0 && value <= 120) {
                            updateField('age', value);
                          } else if (value > 120) {
                            updateField('age', 120);
                          } else {
                            updateField('age', 0);
                          }
                        }}
                        placeholder="45"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="gender" className="text-sm font-medium">
                        Gender *
                      </label>
                      <select
                        id="gender"
                        value={formData.gender}
                        onChange={(e) => updateField('gender', e.target.value)}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                        required
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="admissionDate" className="text-sm font-medium">
                        Admission Date *
                      </label>
                      <Input
                        id="admissionDate"
                        type="date"
                        min="1900-01-01"
                        max={`${new Date().getFullYear() + 1}-12-31`}
                        value={formData.admissionDate}
                        onChange={(e) => updateField('admissionDate', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="dischargeDate" className="text-sm font-medium">
                        Discharge Date *
                      </label>
                      <Input
                        id="dischargeDate"
                        type="date"
                        min={formData.admissionDate || "1900-01-01"}
                        max={`${new Date().getFullYear() + 1}-12-31`}
                        value={formData.dischargeDate}
                        onChange={(e) => updateField('dischargeDate', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="admissionType" className="text-sm font-medium">
                        Admission Type *
                      </label>
                      <select
                        id="admissionType"
                        value={formData.admissionType}
                        onChange={(e) => updateField('admissionType', e.target.value)}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                        required
                      >
                        <option value="Emergency">Emergency</option>
                        <option value="Urgent">Urgent</option>
                        <option value="Elective">Elective</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Diagnosis Information */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-green-600" />
                    Diagnosis Information
                  </CardTitle>
                  <CardDescription>
                    Medical diagnoses and treatment details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="primaryDiagnosis" className="text-sm font-medium">
                      Primary Diagnosis *
                    </label>
                    <select
                      id="primaryDiagnosis"
                      value={formData.primaryDiagnosis}
                      onChange={(e) => updateField('primaryDiagnosis', e.target.value)}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                      required
                    >
                      <option value="">-- Select Disease --</option>
                      <option value="Type 2 Diabetes">Type 2 Diabetes</option>
                      <option value="Chronic Kidney Disease">Chronic Kidney Disease</option>
                      <option value="COPD">COPD</option>
                      <option value="Hypertension">Hypertension</option>
                      <option value="Pneumonia">Pneumonia</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select the primary disease for ML prediction
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="numberOfProcedures" className="text-sm font-medium">
                        Number of Procedures
                      </label>
                      <Input
                        id="numberOfProcedures"
                        type="number"
                        value={formData.numberOfProcedures || ''}
                        onChange={(e) => updateField('numberOfProcedures', e.target.value ? parseInt(e.target.value) : 0)}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="numberOfMedications" className="text-sm font-medium">
                        Number of Medications
                      </label>
                      <Input
                        id="numberOfMedications"
                        type="number"
                        value={formData.numberOfMedications || ''}
                        onChange={(e) => updateField('numberOfMedications', e.target.value ? parseInt(e.target.value) : 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Clinical Data */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-red-600" />
                    Clinical Data
                  </CardTitle>
                  <CardDescription>
                    Laboratory results and vital measurements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="glucoseLevel" className="text-sm font-medium">
                        Glucose Level (mg/dL)
                      </label>
                      <Input
                        id="glucoseLevel"
                        type="number"
                        value={formData.glucoseLevel || ''}
                        onChange={(e) => updateField('glucoseLevel', e.target.value ? parseFloat(e.target.value) : 0)}
                        placeholder="100"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="a1cResult" className="text-sm font-medium">
                        HbA1c (%)
                      </label>
                      <Input
                        id="a1cResult"
                        type="number"
                        step="0.1"
                        value={formData.a1cResult || ''}
                        onChange={(e) => updateField('a1cResult', e.target.value ? parseFloat(e.target.value) : 0)}
                        placeholder="5.7"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="bmi" className="text-sm font-medium">
                        BMI
                      </label>
                      <Input
                        id="bmi"
                        type="number"
                        step="0.1"
                        value={formData.bmi || ''}
                        onChange={(e) => updateField('bmi', e.target.value ? parseFloat(e.target.value) : 0)}
                        placeholder="25.0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6">
                <Button
                  type="submit"
                  disabled={status === 'predicting'}
                  className="flex items-center gap-2"
                >
                  {status === 'predicting' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4" />
                      Predict Readmission
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={resetForm}
                  variant="ghost"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset Form
                </Button>
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </form>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {prediction && (
              <Card className={`border-2 ${
                prediction.riskLevel === 'High' ? 'border-red-200 bg-red-50' :
                prediction.riskLevel === 'Medium' ? 'border-yellow-200 bg-yellow-50' :
                'border-green-200 bg-green-50'
              }`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getRiskIcon(prediction.riskLevel)}
                    Prediction Result
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-4">
                    <Badge variant={getRiskColor(prediction.riskLevel)} className="text-lg px-4 py-2">
                      {prediction.riskLevel} Risk
                    </Badge>
                    <p className="text-3xl font-bold mt-4">
                      {(prediction.riskScore * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Readmission Probability</p>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Recommendation</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {prediction.recommendation}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {canSave && (
                      <Button
                        onClick={saveEntry}
                        disabled={status === 'saving'}
                        className="w-full flex items-center justify-center gap-2"
                        variant="default"
                      >
                        {status === 'saving' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Record
                          </>
                        )}
                      </Button>
                    )}

                    {/* Export Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={exportPDF}
                        variant="outline"
                        disabled={!pdfDownloadUrl}
                        className="flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </Button>

                      <Button
                        onClick={exportExcel}
                        variant="outline"
                        disabled={!excelDownloadUrl}
                        className="flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Excel
                      </Button>
                    </div>
                  </div>

                  {!canSave && (
                    <Alert>
                      <AlertDescription className="text-xs">
                        Only doctors and admins can save entries
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ML Analysis Insights */}
            {mlAnalysis && (
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="w-5 h-5 text-purple-600" />
                    ML Analysis Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mlAnalysis.summary && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Clinical Summary
                      </h4>
                      <p className="text-sm text-gray-700">
                        {parseHtmlContent(mlAnalysis.summary)}
                      </p>
                    </div>
                  )}

                  {prediction?.topFeatures && Array.isArray(prediction.topFeatures) && prediction.topFeatures.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Top Risk Factors
                      </h4>
                      <div className="space-y-2">
                        {prediction.topFeatures.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="bg-white rounded p-3 text-xs border border-gray-200">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium">{feature.Feature}</span>
                              <Badge variant={feature.Contribution > 0 ? 'destructive' : 'default'} className="text-xs">
                                {feature.Contribution > 0 ? '+' : ''}{feature.Contribution.toFixed(3)}
                              </Badge>
                            </div>
                            <p className="text-gray-600">{parseHtmlContent(feature.Interpretation).substring(0, 100)}...</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Entries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Recent Entries
                </CardTitle>
                <CardDescription>Last 5 manual entries</CardDescription>
              </CardHeader>
              <CardContent>
                {!recentEntries || recentEntries.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No recent entries
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentEntries.map((entry) => (
                      <div
                        key={entry._id}
                        className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-200 hover:bg-gray-100 transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{entry.fullName || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{entry.patientId || 'N/A'}</p>
                          </div>
                          <Badge variant={getRiskColor(entry.prediction?.riskLevel || 'Low')}>
                            {entry.prediction?.riskLevel || 'Unknown'}
                          </Badge>
                        </div>

                        {/* Download buttons for saved entries */}
                        {(entry.pdfDownloadUrl || entry.excelDownloadUrl) && (
                          <div className="flex gap-2 mb-2">
                            {entry.pdfDownloadUrl && (
                              <Button
                                onClick={async () => {
                                  try {
                                    await manualEntryService.downloadPDF(
                                      entry.pdfDownloadUrl!,
                                      `${entry.patientId}_report.pdf`
                                    );
                                  } catch (err) {
                                    alert('Failed to download PDF: ' + (err as Error).message);
                                  }
                                }}
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                PDF
                              </Button>
                            )}
                            {entry.excelDownloadUrl && (
                              <Button
                                onClick={async () => {
                                  try {
                                    await manualEntryService.downloadExcel(
                                      entry.excelDownloadUrl!,
                                      `${entry.patientId}_report.xlsx`
                                    );
                                  } catch (err) {
                                    alert('Failed to download Excel: ' + (err as Error).message);
                                  }
                                }}
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Excel
                              </Button>
                            )}
                          </div>
                        )}

                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : 'N/A'}</span>
                          {canDelete && (
                            <Button
                              onClick={() => deleteEntry(entry._id)}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-gray-700">
                <p>• Fill in all required fields (*) before predicting</p>
                <p>• Use accurate clinical data for better predictions</p>
                <p>• Download reports for comprehensive documentation</p>
                <p>• Only doctors/admins can save records</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
