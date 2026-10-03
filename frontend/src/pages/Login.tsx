import React from 'react';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { Navigate } from 'react-router-dom';
import { authService } from '@/features/auth/services/authService';

export const LoginPage: React.FC = () => {

  if (authService.isAuthenticated()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};
