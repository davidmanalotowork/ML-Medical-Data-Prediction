const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SettingsResponse {
  success: boolean;
  message?: string;
  data?: any;
  errors?: any[];
}

class SettingsService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getSettings(): Promise<SettingsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch settings');
      }

      return data;
    } catch (error: any) {
      console.error('Get settings error:', error);
      throw new Error(error.message || 'Failed to fetch settings');
    }
  }

  async changePassword(passwordData: PasswordData): Promise<SettingsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/password`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(passwordData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      return data;
    } catch (error: any) {
      console.error('Change password error:', error);
      throw new Error(error.message || 'Failed to change password');
    }
  }
}

export const settingsService = new SettingsService();