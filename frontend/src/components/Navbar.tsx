import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Activity,
  Upload,
  Menu,
  X,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      name: 'Prediction Tool',
      path: '/',
      icon: <Activity className="w-5 h-5" />,
    },
    {
      name: 'Upload File',
      path: '/upload',
      icon: <Upload className="w-5 h-5" />,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
           <div className="p-2 rounded-lg">
              <img 
              src="/logo_red.webp" 
              alt="activity icon" 
              className="w-12 h-12 object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">Clinical Risk Tool</h1>
              <p className="text-xs text-gray-500">Prediction Platform</p>
            </div>
          </div>

          {}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
                  ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                {item.icon}
                <span className="text-sm">{item.name}</span>
              </button>
            ))}
          </div>

          {}
          {}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {}
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                {item.icon}
                <span className="text-sm">{item.name}</span>
              </button>
            ))}

          </div>
        </div>
      )}
    </nav>
  );
};
