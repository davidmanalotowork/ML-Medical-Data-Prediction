import React, { useEffect, useState, useRef } from 'react';
import { History as HistoryIcon, Clock, FileSpreadsheet, AlertCircle, TrendingUp, Loader2, Trash2, MoreVertical, Download, FileDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { historyService, HistoryItem, HistoryStats } from '@/features/History/services/historyService';
import { authService } from '@/features/auth/services/authService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { uploadService } from '@/features/upload/services/uploadService';

export const HistoryPage: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<HistoryStats>({
    totalUploads: 0,
    totalRecords: 0,
    totalHighRisk: 0,
    totalMediumRisk: 0,
    totalLowRisk: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [diseaseFilter, setDiseaseFilter] = useState<string>('all');

  const isLoadingRef = useRef(false);

  const user = authService.getUser();
  const canDelete = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    loadHistory();
  }, [currentPage, diseaseFilter]);

  const loadHistory = async () => {
    if (isLoadingRef.current) {
      console.log('History already loading, skipping duplicate request');
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await historyService.getHistory(currentPage, 20, diseaseFilter);
      setHistoryItems(response.data.history);
      setStatistics(response.data.statistics);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err) {
      setError((err as Error).message);
      console.error('Error loading history:', err);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };

  const handleDelete = async (id: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;
    try {
      await historyService.deleteHistory(id);
      await loadHistory();
    } catch (err) {
      alert(`Failed to delete: ${(err as Error).message}`);
    }
  };

  // Export functions
  const exportUploadsToCSV = () => {
    const csvData = historyItems.map(item => ({
      'File Name': item.fileName,
      'Upload Date': item.uploadDate,
      'Upload Time': item.uploadTime,
      'Disease': item.disease || 'Unknown',
      'Total Records': item.recordCount,
      'High Risk': item.highRiskCount,
      'Medium Risk': item.mediumRiskCount,
      'Low Risk': item.lowRiskCount
    }));

    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Upload History');
    XLSX.writeFile(wb, `upload_history_${new Date().toISOString().split('T')[0]}.csv`, { bookType: 'csv' });
  };

  const exportUploadsToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Upload History Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Uploads: ${statistics.totalUploads}`, 14, 34);
    doc.text(`Total Records Processed: ${statistics.totalRecords}`, 14, 40);
    doc.text(`High Risk Cases: ${statistics.totalHighRisk}`, 14, 46);

    const tableData = historyItems.map(item => [
      item.fileName,
      item.uploadDate,
      item.disease || 'Unknown',
      item.recordCount,
      item.highRiskCount,
      item.mediumRiskCount,
      item.lowRiskCount
    ]);

    autoTable(doc, {
      head: [['File Name', 'Date', 'Disease', 'Records', 'High', 'Medium', 'Low']],
      body: tableData,
      startY: 52,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20 },
        4: { cellWidth: 15 },
        5: { cellWidth: 20 },
        6: { cellWidth: 15 }
      }
    });

    doc.save(`upload_history_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportRecordsToCSV = () => {
    const csvData = historyItems.map(item => ({
      'File Name': item.fileName,
      'Upload Date': item.uploadDate,
      'Disease': item.disease || 'Unknown',
      'Total Records': item.recordCount
    }));

    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Records Summary');
    XLSX.writeFile(wb, `records_summary_${new Date().toISOString().split('T')[0]}.csv`, { bookType: 'csv' });
  };

  const exportRecordsToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Records Summary Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Records Processed: ${statistics.totalRecords}`, 14, 34);
    doc.text(`Across ${statistics.totalUploads} uploads`, 14, 40);

    const tableData = historyItems.map(item => [
      item.fileName,
      item.uploadDate,
      item.disease || 'Unknown',
      item.recordCount
    ]);

    autoTable(doc, {
      head: [['File Name', 'Date', 'Disease', 'Total Records']],
      body: tableData,
      startY: 46,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    doc.save(`records_summary_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportHighRiskToCSV = () => {
    const csvData = historyItems
      .filter(item => item.highRiskCount > 0)
      .map(item => ({
        'File Name': item.fileName,
        'Upload Date': item.uploadDate,
        'Disease': item.disease || 'Unknown',
        'High Risk Count': item.highRiskCount,
        'Percentage': `${((item.highRiskCount / item.recordCount) * 100).toFixed(1)}%`
      }));

    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'High Risk Cases');
    XLSX.writeFile(wb, `high_risk_cases_${new Date().toISOString().split('T')[0]}.csv`, { bookType: 'csv' });
  };

  const exportHighRiskToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('High Risk Cases Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total High Risk Cases: ${statistics.totalHighRisk}`, 14, 34);
    doc.text(`Across ${statistics.totalUploads} uploads`, 14, 40);

    const tableData = historyItems
      .filter(item => item.highRiskCount > 0)
      .map(item => [
        item.fileName,
        item.uploadDate,
        item.disease || 'Unknown',
        item.highRiskCount,
        `${((item.highRiskCount / item.recordCount) * 100).toFixed(1)}%`
      ]);

    autoTable(doc, {
      head: [['File Name', 'Date', 'Disease', 'High Risk', 'Percentage']],
      body: tableData,
      startY: 46,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    doc.save(`high_risk_cases_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const stats = [
    {
      label: 'Total Uploads',
      value: statistics.totalUploads.toString(),
      icon: <FileSpreadsheet className="w-5 h-5" />,
      color: 'blue',
      exportCSV: exportUploadsToCSV,
      exportPDF: exportUploadsToPDF
    },
    {
      label: 'Total Records',
      value: statistics.totalRecords.toLocaleString(),
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'green',
      exportCSV: exportRecordsToCSV,
      exportPDF: exportRecordsToPDF
    },
    {
      label: 'High Risk Cases',
      value: statistics.totalHighRisk.toLocaleString(),
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'red',
      exportCSV: exportHighRiskToCSV,
      exportPDF: exportHighRiskToPDF
    },
  ];

  // Add download handler functions
  const handleDownloadPDF = async (item: HistoryItem) => {
    if (!item.pdfDownloadUrl) {
      alert('PDF report not available for this upload');
      return;
    }

    try {
      await uploadService.downloadReport(
        item.pdfDownloadUrl,
        `${item.fileName.replace(/\.[^/.]+$/, '')}_report.pdf`
      );
    } catch (error) {
      alert('Failed to download PDF report');
      console.error('PDF download error:', error);
    }
  };

  const handleDownloadExcel = async (item: HistoryItem) => {
    if (!item.excelDownloadUrl) {
      alert('Excel report not available for this upload');
      return;
    }

    try {
      await uploadService.downloadReport(
        item.excelDownloadUrl,
        `${item.fileName.replace(/\.[^/.]+$/, '')}_report.xlsx`
      );
    } catch (error) {
      alert('Failed to download Excel report');
      console.error('Excel download error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <HistoryIcon className="w-8 h-8 text-blue-600" />
            Upload History
          </h1>
          <p className="text-gray-600">
            View your past uploads and prediction results
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="relative hover:shadow-md transition-shadow duration-300"
            >
              <CardContent className="p-6">
                <div className="absolute top-4 right-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={stat.exportCSV} className="cursor-pointer">
                        <Download className="w-4 h-4 mr-2" />
                        Download CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={stat.exportPDF} className="cursor-pointer">
                        <FileDown className="w-4 h-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`
                      p-3 rounded-lg
                      ${stat.color === 'blue' && 'bg-blue-50 text-blue-600'}
                      ${stat.color === 'green' && 'bg-green-50 text-green-600'}
                      ${stat.color === 'red' && 'bg-red-50 text-red-600'}
                    `}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="hover:shadow-md transition-shadow duration-300">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Recent Uploads</CardTitle>
              <CardDescription>
                Your most recent data uploads and predictions
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 md:gap-3 px-3 py-2">
              <label
                htmlFor="diseaseFilter"
                className="text-sm font-medium text-gray-700"
              >
                Filter by Disease:
              </label>
              <select
                id="diseaseFilter"
                value={diseaseFilter}
                onChange={(e) => {
                  setDiseaseFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="all">All Diseases</option>
                <option value="Type 2 Diabetes">Type 2 Diabetes</option>
                <option value="Pneumonia">Pneumonia</option>
                <option value="Chronic Kidney Disease">Chronic Kidney Disease</option>
                <option value="COPD">COPD</option>
                <option value="Hypertension">Hypertension</option>
              </select>
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 bg-red-50">
                {error}
              </div>
            )}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : historyItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <HistoryIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="font-medium">No upload history yet</p>
                <p className="text-sm mt-2">
                  Your uploaded files and predictions will appear here
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {historyItems.map((item) => (
                    <div
                      key={item._id}
                      className="border rounded-xl p-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {item.fileName}
                            </h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {item.uploadDate} at {item.uploadTime}
                              </span>
                              {item.disease && (
                                <Badge variant="outline" className="text-xs capitalize">
                                  {item.disease}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-5">
                          <div className="flex items-center gap-5 text-sm">
                            <div className="flex flex-col items-center min-w-[80px]">
                              <p className="text-gray-600">Records</p>
                              <p className="font-semibold text-gray-900">{item.recordCount}</p>
                            </div>
                            <div className="flex flex-col items-center min-w-[80px]">
                              <p className="text-gray-600">High Risk</p>
                              <p className="font-semibold text-red-600">{item.highRiskCount}</p>
                            </div>
                            <div className="flex flex-col items-center min-w-[80px]">
                              <p className="text-gray-600">Medium Risk</p>
                              <p className="font-semibold text-yellow-600">{item.mediumRiskCount}</p>
                            </div>
                            <div className="flex flex-col items-center min-w-[80px]">
                              <p className="text-gray-600">Low Risk</p>
                              <p className="font-semibold text-green-600">{item.lowRiskCount}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-5">
                            <div className="flex items-center gap-5 text-sm">
                              {/* Download Dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 transition-colors"
                                    disabled={!item.pdfDownloadUrl && !item.excelDownloadUrl}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem
                                    onClick={() => handleDownloadPDF(item)}
                                    className="cursor-pointer"
                                    disabled={!item.pdfDownloadUrl}
                                  >
                                    <FileDown className="w-4 h-4 mr-2" />
                                    Download PDF
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDownloadExcel(item)}
                                    className="cursor-pointer"
                                    disabled={!item.excelDownloadUrl}
                                  >
                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                    Download Excel
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>

                              {canDelete && (
                                <Button
                                  onClick={() => handleDelete(item._id, item.fileName)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-100 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
