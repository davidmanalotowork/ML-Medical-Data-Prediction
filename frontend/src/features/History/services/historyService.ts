const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface HistoryItem {
  _id: string;
  fileName: string;
  uploadDate: string;
  uploadTime: string;
  recordCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  disease?: string;
  uploadId: string;
  sessionId?: string;
  pdfDownloadUrl?: string; 
  excelDownloadUrl?: string;
}

export interface HistoryStats {
  totalUploads: number;
  totalRecords: number;
  totalHighRisk: number;
  totalMediumRisk: number;
  totalLowRisk: number;
}

export interface HistoryResponse {
  success: boolean;
  data: {
    history: HistoryItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
    statistics: HistoryStats;
  };
  message?: string;
}

class HistoryService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getHistory(page: number = 1, limit: number = 50, disease?: string): Promise<HistoryResponse> {
    try {
      let url = `${API_BASE_URL}/history?page=${page}&limit=${limit}`;
      if (disease && disease !== 'all') {
        url += `&disease=${disease}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch history');
      }

      return data;
    } catch (error: any) {
      console.error('Get history error:', error);
      throw new Error(error.message || 'Failed to fetch upload history');
    }
  }

  async getHistoryById(id: string): Promise<HistoryItem> {
    try {
      const response = await fetch(`${API_BASE_URL}/history/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch history item');
      }

      return data.data;
    } catch (error: any) {
      console.error('Get history by ID error:', error);
      throw new Error(error.message || 'Failed to fetch history item');
    }
  }

  async deleteHistory(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/history/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete history item');
      }
    } catch (error: any) {
      console.error('Delete history error:', error);
      throw new Error(error.message || 'Failed to delete history item');
    }
  }

  async getHistoryStats(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/history/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch statistics');
      }

      return data.data;
    } catch (error: any) {
      console.error('Get history stats error:', error);
      throw new Error(error.message || 'Failed to fetch statistics');
    }
  }
}

export const historyService = new HistoryService();