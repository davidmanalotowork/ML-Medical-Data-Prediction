import React from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Info, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Info className="w-6 h-6 text-blue-600" />
            Tool Help & Guide
          </DialogTitle>
          <DialogDescription>
            Learn how to use the clinical risk prediction tool, including sample data and the recommended workflow
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="upload">File Upload</TabsTrigger>
            <TabsTrigger value="format">Data Format</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Prepare Your Data</h4>
                      <p className="text-sm text-gray-600">
                        Organize patient data in Excel or CSV format with required columns
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <span className="text-blue-600 font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Upload File</h4>
                      <p className="text-sm text-gray-600">
                        Drag and drop or click to upload your file to the system
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <span className="text-blue-600 font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">AI Analysis</h4>
                      <p className="text-sm text-gray-600">
                        Our XGBoost ML model analyzes patient data and predicts readmission risk
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <span className="text-blue-600 font-bold">4</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Review Results</h4>
                      <p className="text-sm text-gray-600">
                        View predictions, download reports, and track history
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Supported Conditions</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Type 2 Diabetes</Badge>
                    <Badge variant="outline">Chronic Kidney Disease</Badge>
                    <Badge variant="outline">COPD</Badge>
                    <Badge variant="outline">Hypertension</Badge>
                    <Badge variant="outline">Pneumonia</Badge>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-green-900 mb-2">Quick Start</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-green-900">
                    <li>Download the sample file below if you do not have your own data.</li>
                    <li>Upload the CSV or Excel file to the prediction area.</li>
                    <li>Review the risk score, contributing factors, and recommended next steps.</li>
                  </ol>
                  <a
                    href="/sample-patient-data.csv"
                    download
                    className="mt-3 inline-block rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Download sample file
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* File Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  How to Upload Files
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Upload Methods</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="border rounded-lg p-3">
                      <h5 className="font-medium text-gray-900 mb-1">Drag & Drop</h5>
                      <p className="text-sm text-gray-600">
                        Simply drag your file and drop it into the upload area
                      </p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h5 className="font-medium text-gray-900 mb-1">Click to Browse</h5>
                      <p className="text-sm text-gray-600">
                        Click the upload area to open file browser
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">File Requirements</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Accepted formats: .csv, .xls, .xlsx</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Maximum file size: 10MB</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>First row must contain column headers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Must contain required patient data columns</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900 mb-1">Important</h4>
                      <p className="text-sm text-yellow-800">
                        Ensure patient data is de-identified and complies with HIPAA regulations before uploading
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Format Tab */}
          <TabsContent value="format" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  Required Data Format
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Required Columns</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-left p-2 font-semibold">Column Name</th>
                          <th className="text-left p-2 font-semibold">Description</th>
                          <th className="text-left p-2 font-semibold">Example</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2 font-mono text-xs">patient_id</td>
                          <td className="p-2">Unique patient identifier</td>
                          <td className="p-2 text-gray-600">P001</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-mono text-xs">patient_name</td>
                          <td className="p-2">Patient full name</td>
                          <td className="p-2 text-gray-600">Example Patient</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-mono text-xs">age</td>
                          <td className="p-2">Patient age in years</td>
                          <td className="p-2 text-gray-600">65</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-mono text-xs">gender</td>
                          <td className="p-2">Patient gender</td>
                          <td className="p-2 text-gray-600">Male</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-mono text-xs">diagnosis</td>
                          <td className="p-2">Primary diagnosis</td>
                          <td className="p-2 text-gray-600">Diabetes, COPD</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Data Quality Tips</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Remove any empty rows or columns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Ensure consistent date formats (YYYY-MM-DD)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Use standard medical codes where applicable</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Check for spelling errors in text fields</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Understanding Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Risk Levels</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <Badge variant="destructive">High Risk</Badge>
                      <p className="text-sm text-gray-700">
                        Probability &gt; 70% - Requires immediate intervention and close monitoring
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Badge variant="secondary">Medium Risk</Badge>
                      <p className="text-sm text-gray-700">
                        Probability 40-70% - Moderate monitoring and preventive measures recommended
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <Badge variant="success">Low Risk</Badge>
                      <p className="text-sm text-gray-700">
                        Probability &lt; 40% - Standard follow-up care sufficient
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Available Reports</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-red-600" />
                        <h5 className="font-medium text-gray-900">PDF Report</h5>
                      </div>
                      <p className="text-sm text-gray-600">
                        Comprehensive clinical report with recommendations and risk analysis
                      </p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        <h5 className="font-medium text-gray-900">Excel Report</h5>
                      </div>
                      <p className="text-sm text-gray-600">
                        Detailed data export for further analysis and record keeping
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Next Steps</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Review predictions and risk assessments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Download PDF and Excel reports for documentation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Check upload history for past predictions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Implement clinical recommendations for high-risk patients</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};