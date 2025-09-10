import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Report, ReportComponent, CreateReportRequest, UpdateReportRequest } from '../models/Report';
// Simple middleware for testing
const simpleAuth = (req: any, res: any, next: any) => {
  // Mock user for testing
  req.user = {
    email: 'admin@crm.com',
    role: 'ADMIN',
    userId: '1'
  };
  next();
};

const router = express.Router();

// Mock database - in real app, use actual database
let reports: Report[] = [
  {
    id: 'report-1',
    name: 'Analisi Candidati Mensile',
    description: 'Report completo sui candidati del mese corrente con grafici di status e posizioni',
    components: [
      {
        id: 'comp-1',
        type: 'metric',
        title: 'Totale Candidati',
        description: 'Numero totale di candidati',
        config: { dataSource: 'candidates', aggregation: 'count' }
      },
      {
        id: 'comp-2', 
        type: 'chart',
        title: 'Candidati per Status',
        description: 'Distribuzione per status',
        config: { 
          dataSource: 'candidates', 
          chartType: 'bar',
          groupBy: 'status',
          aggregation: 'count'
        }
      }
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    createdBy: 'Marco Rossi',
    isPublic: true,
    tags: ['candidati', 'mensile', 'dashboard']
  },
  {
    id: 'report-2',
    name: 'Report Colloqui Settimanale',
    description: 'Panoramica settimanale dei colloqui programmati e completati',
    components: [
      {
        id: 'comp-3',
        type: 'pie-chart',
        title: 'Status Colloqui',
        description: 'Distribuzione status colloqui',
        config: {
          dataSource: 'interviews',
          groupBy: 'status',
          aggregation: 'count'
        }
      },
      {
        id: 'comp-4',
        type: 'table',
        title: 'Prossimi Colloqui',
        description: 'Lista colloqui programmati',
        config: {
          dataSource: 'interviews',
          limit: 20
        }
      }
    ],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    createdBy: 'Laura Bianchi',
    isPublic: false,
    tags: ['colloqui', 'settimanale']
  }
];

// GET /api/reports - Get all reports
router.get('/', simpleAuth, async (req, res) => {
  try {
    // In real app, filter based on user permissions and isPublic flag
    const userReports = reports.map(report => ({
      ...report,
      canEdit: report.createdBy === req.user?.email || req.user?.role === 'ADMIN',
      canDelete: report.createdBy === req.user?.email || req.user?.role === 'ADMIN'
    }));

    res.json({
      success: true,
      data: userReports,
      total: userReports.length
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports'
    });
  }
});

// GET /api/reports/:id - Get specific report
router.get('/:id', simpleAuth, (req, res) => {
  try {
    const { id } = req.params;
    const report = reports.find(r => r.id === id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Check permissions
    if (!report.isPublic && report.createdBy !== req.user?.email && req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        ...report,
        canEdit: report.createdBy === req.user?.email || req.user?.role === 'ADMIN',
        canDelete: report.createdBy === req.user?.email || req.user?.role === 'ADMIN'
      }
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report'
    });
  }
});

// POST /api/reports - Create new report
router.post('/', simpleAuth, (req, res) => {
  try {
    const createRequest: CreateReportRequest = req.body;

    // Validation
    if (!createRequest.name || !createRequest.name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Report name is required'
      });
    }

    if (!createRequest.components || createRequest.components.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Report must have at least one component'
      });
    }

    const newReport: Report = {
      id: uuidv4(),
      name: createRequest.name.trim(),
      description: createRequest.description || '',
      components: createRequest.components.map(comp => ({
        ...comp,
        id: comp.id || uuidv4()
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user?.email || 'Unknown User',
      isPublic: createRequest.isPublic || false,
      tags: createRequest.tags || []
    };

    reports.push(newReport);

    res.status(201).json({
      success: true,
      data: newReport,
      message: 'Report created successfully'
    });

    // Emit real-time event
    if (global.io) {
      global.io.emit('report_created', {
        reportId: newReport.id,
        reportName: newReport.name,
        createdBy: newReport.createdBy
      });
    }
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create report'
    });
  }
});

// PUT /api/reports/:id - Update report
router.put('/:id', simpleAuth, (req, res) => {
  try {
    const { id } = req.params;
    const updateRequest: UpdateReportRequest = req.body;

    const reportIndex = reports.findIndex(r => r.id === id);
    if (reportIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    const existingReport = reports[reportIndex];

    // Check permissions
    if (existingReport.createdBy !== req.user?.email && req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Update report
    const updatedReport: Report = {
      ...existingReport,
      name: updateRequest.name || existingReport.name,
      description: updateRequest.description !== undefined ? updateRequest.description : existingReport.description,
      components: updateRequest.components || existingReport.components,
      isPublic: updateRequest.isPublic !== undefined ? updateRequest.isPublic : existingReport.isPublic,
      tags: updateRequest.tags || existingReport.tags,
      updatedAt: new Date()
    };

    reports[reportIndex] = updatedReport;

    res.json({
      success: true,
      data: updatedReport,
      message: 'Report updated successfully'
    });

    // Emit real-time event
    if (global.io) {
      global.io.emit('report_updated', {
        reportId: updatedReport.id,
        reportName: updatedReport.name,
        updatedBy: req.user?.email
      });
    }
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update report'
    });
  }
});

// DELETE /api/reports/:id - Delete report
router.delete('/:id', simpleAuth, (req, res) => {
  try {
    const { id } = req.params;
    
    const reportIndex = reports.findIndex(r => r.id === id);
    if (reportIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    const report = reports[reportIndex];

    // Check permissions
    if (report.createdBy !== req.user?.email && req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    reports.splice(reportIndex, 1);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });

    // Emit real-time event
    if (global.io) {
      global.io.emit('report_deleted', {
        reportId: id,
        reportName: report.name,
        deletedBy: req.user?.email
      });
    }
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete report'
    });
  }
});

// POST /api/reports/:id/duplicate - Duplicate report
router.post('/:id/duplicate', simpleAuth, (req, res) => {
  try {
    const { id } = req.params;
    const report = reports.find(r => r.id === id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Check permissions
    if (!report.isPublic && report.createdBy !== req.user?.email && req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const duplicatedReport: Report = {
      ...report,
      id: uuidv4(),
      name: `${report.name} (Copia)`,
      components: report.components.map(comp => ({
        ...comp,
        id: uuidv4()
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user?.email || 'Unknown User',
      isPublic: false // Duplicated reports are private by default
    };

    reports.push(duplicatedReport);

    res.status(201).json({
      success: true,
      data: duplicatedReport,
      message: 'Report duplicated successfully'
    });
  } catch (error) {
    console.error('Error duplicating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate report'
    });
  }
});

export default router;