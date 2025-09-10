import axios from 'axios';

const API_BASE_URL = 'http://localhost:3004/api';

export interface ReportComponent {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'pie-chart';
  title: string;
  description: string;
  config: ComponentConfig;
}

export interface ComponentConfig {
  dataSource: string;
  chartType?: 'bar' | 'line' | 'area';
  filters?: ReportFilter[];
  groupBy?: string;
  aggregation?: 'count' | 'sum' | 'avg' | 'max' | 'min';
  columns?: string[];
  limit?: number;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: string;
}

export interface Report {
  id: string;
  name: string;
  description: string;
  components: ReportComponent[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isPublic: boolean;
  tags: string[];
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface CreateReportRequest {
  name: string;
  description: string;
  components: ReportComponent[];
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateReportRequest {
  name?: string;
  description?: string;
  components?: ReportComponent[];
  isPublic?: boolean;
  tags?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
}

class ReportsApi {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getAllReports(): Promise<Report[]> {
    try {
      const response = await axios.get<ApiResponse<Report[]>>(`${API_BASE_URL}/reports`, {
        headers: this.getAuthHeaders()
      });
      
      if (response.data.success && response.data.data) {
        return response.data.data.map(report => ({
          ...report,
          createdAt: new Date(report.createdAt),
          updatedAt: new Date(report.updatedAt)
        }));
      }
      
      throw new Error(response.data.error || 'Failed to fetch reports');
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  }

  async getReport(id: string): Promise<Report> {
    try {
      const response = await axios.get<ApiResponse<Report>>(`${API_BASE_URL}/reports/${id}`, {
        headers: this.getAuthHeaders()
      });
      
      if (response.data.success && response.data.data) {
        return {
          ...response.data.data,
          createdAt: new Date(response.data.data.createdAt),
          updatedAt: new Date(response.data.data.updatedAt)
        };
      }
      
      throw new Error(response.data.error || 'Failed to fetch report');
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    }
  }

  async createReport(reportData: CreateReportRequest): Promise<Report> {
    try {
      const response = await axios.post<ApiResponse<Report>>(`${API_BASE_URL}/reports`, reportData, {
        headers: this.getAuthHeaders()
      });
      
      if (response.data.success && response.data.data) {
        return {
          ...response.data.data,
          createdAt: new Date(response.data.data.createdAt),
          updatedAt: new Date(response.data.data.updatedAt)
        };
      }
      
      throw new Error(response.data.error || 'Failed to create report');
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }

  async updateReport(id: string, reportData: UpdateReportRequest): Promise<Report> {
    try {
      const response = await axios.put<ApiResponse<Report>>(`${API_BASE_URL}/reports/${id}`, reportData, {
        headers: this.getAuthHeaders()
      });
      
      if (response.data.success && response.data.data) {
        return {
          ...response.data.data,
          createdAt: new Date(response.data.data.createdAt),
          updatedAt: new Date(response.data.data.updatedAt)
        };
      }
      
      throw new Error(response.data.error || 'Failed to update report');
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  }

  async deleteReport(id: string): Promise<void> {
    try {
      const response = await axios.delete<ApiResponse<void>>(`${API_BASE_URL}/reports/${id}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete report');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  async duplicateReport(id: string): Promise<Report> {
    try {
      const response = await axios.post<ApiResponse<Report>>(`${API_BASE_URL}/reports/${id}/duplicate`, {}, {
        headers: this.getAuthHeaders()
      });
      
      if (response.data.success && response.data.data) {
        return {
          ...response.data.data,
          createdAt: new Date(response.data.data.createdAt),
          updatedAt: new Date(response.data.data.updatedAt)
        };
      }
      
      throw new Error(response.data.error || 'Failed to duplicate report');
    } catch (error) {
      console.error('Error duplicating report:', error);
      throw error;
    }
  }

  async getReportData(reportId: string, componentId: string): Promise<any> {
    try {
      // This would typically fetch actual data for visualization
      // For now, return mock data
      const response = await axios.get(`${API_BASE_URL}/reports/${reportId}/data/${componentId}`, {
        headers: this.getAuthHeaders()
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching report data:', error);
      // Return mock data for now
      return this.generateMockData();
    }
  }

  private generateMockData(): any {
    // Mock data generation - in real implementation, this would come from the API
    return [
      { name: 'In Valutazione', value: 45, count: 45 },
      { name: 'Colloquio', value: 32, count: 32 },
      { name: 'Assunti', value: 23, count: 23 },
      { name: 'Rifiutati', value: 56, count: 56 }
    ];
  }
}

export const reportsApi = new ReportsApi();