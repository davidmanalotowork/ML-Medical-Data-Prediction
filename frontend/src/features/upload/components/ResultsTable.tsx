import React from 'react';
import { Download, FileDown, Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { uploadService } from '@/features/upload/services/uploadService';

export interface PredictionResult {
  no: number;
  patientId?: string;
  patientName?: string; // ✅ Add patient name
  risk: 'High' | 'Medium' | 'Low';
  probability: number;
  reasons: string[];
  interpretation?: string; // ✅ Add interpretation
  riskScore?: number;
  recommendation?: string;
  predictedClass?: number;
}

interface ResultsTableProps {
  results: PredictionResult[];
  fileName?: string;
  disease?: string;
  sessionId?: string;
  pdfDownloadUrl?: string;
  excelDownloadUrl?: string;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ 
  results, 
  fileName = 'predictions', 
  disease,
  pdfDownloadUrl,
  excelDownloadUrl
}) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'success';
      default: return 'secondary';
    }
  };

  const downloadPDF = async () => {
    if (!pdfDownloadUrl) {
      alert('PDF report not available');
      return;
    }

    try {
      await uploadService.downloadReport(
        pdfDownloadUrl,
        `${fileName.replace(/\.[^/.]+$/, '')}_report.pdf`
      );
    } catch (error) {
      alert('Failed to download PDF report');
      console.error('PDF download error:', error);
    }
  };

  const downloadExcel = async () => {
    if (!excelDownloadUrl) {
      alert('Excel report not available');
      return;
    }

    try {
      await uploadService.downloadReport(
        excelDownloadUrl,
        `${fileName.replace(/\.[^/.]+$/, '')}_report.xlsx`
      );
    } catch (error) {
      alert('Failed to download Excel report');
      console.error('Excel download error:', error);
    }
  };

  const highRisk = results.filter(r => r.risk === 'High').length;
  const mediumRisk = results.filter(r => r.risk === 'Medium').length;
  const lowRisk = results.filter(r => r.risk === 'Low').length;

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              ML Prediction Results
            </CardTitle>
            <CardDescription>
              Showing {results.length} patient prediction{results.length !== 1 ? 's' : ''} from XGBoost machine learning model
            </CardDescription>
            {disease && (
              <p className="text-xs text-gray-500 mt-1">
                Disease Type: <span className="font-semibold">{disease}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={downloadPDF}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={!pdfDownloadUrl}
            >
              <FileDown className="w-4 h-4" />
              Download PDF Report
            </Button>
            
            <Button
              onClick={downloadExcel}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={!excelDownloadUrl}
            >
              <Download className="w-4 h-4" />
              Download Excel Report
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">High Risk</p>
            <p className="text-2xl font-bold text-red-700">{highRisk}</p>
            <p className="text-xs text-red-500">{((highRisk / results.length) * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-600 font-medium">Medium Risk</p>
            <p className="text-2xl font-bold text-yellow-700">{mediumRisk}</p>
            <p className="text-xs text-yellow-500">{((mediumRisk / results.length) * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Low Risk</p>
            <p className="text-2xl font-bold text-green-700">{lowRisk}</p>
            <p className="text-xs text-green-500">{((lowRisk / results.length) * 100).toFixed(1)}%</p>
          </div>
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="text-left p-3 font-semibold text-gray-700">No.</th>
                <th className="text-left p-3 font-semibold text-gray-700">Patient ID</th>
                <th className="text-left p-3 font-semibold text-gray-700">Patient Name</th>
                <th className="text-left p-3 font-semibold text-gray-700">Risk Level</th>
                <th className="text-left p-3 font-semibold text-gray-700">Probability</th>
                <th className="text-left p-3 font-semibold text-gray-700">Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.no} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-gray-900">{result.no}</td>
                  <td className="p-3 text-gray-900 font-medium">
                    {result.patientId || `P-${result.no.toString().padStart(5, '0')}`}
                  </td>
                  <td className="p-3 text-gray-900">
                    {result.patientName || 'N/A'}
                  </td>
                  <td className="p-3">
                    <Badge variant={getRiskColor(result.risk) as any}>
                      {result.risk}
                    </Badge>
                  </td>
                  <td className="p-3 text-gray-900">
                    {(result.probability * 100).toFixed(1)}%
                  </td>
                  <td className="p-3 text-sm text-gray-600 max-w-md">
                    {result.interpretation || result.reasons.join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
