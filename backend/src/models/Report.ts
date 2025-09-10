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