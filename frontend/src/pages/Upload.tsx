import React from 'react';
import { Activity } from 'lucide-react';
import { UploadForm } from '@/features/upload/components/UploadForm';
import { Navbar } from '@/components/Navbar';

export const UploadPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      <div className="max-w-5xl mx-auto p-6 md:p-8">
        {}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Clinical Risk Prediction
              </h1>
              <p className="text-gray-600 mt-1">
                Upload patient data or use the sample file to generate a risk assessment
              </p>
            </div>
          </div>
        </div>

        {}
        <UploadForm />
      </div>
    </div>
  );
};
