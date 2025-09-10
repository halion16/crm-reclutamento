import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  BarChart as ChartIcon,
  TableChart as TableIcon,
  PieChart as PieIcon,
  Assessment as MetricIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Add as AddIcon,
  FolderOpen as FolderIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '@dnd-kit/sortable';
import ComponentEditDialog from './ComponentEditDialog';
import ReportPreview from './ReportPreview';
import SavedReports from './SavedReports';
import { reportsApi } from '../../services/reportsApi';
import type { Report as ApiReport, ReportComponent, ComponentConfig, ReportFilter } from '../../services/reportsApi';

// Note: Types imported from reportsApi service

// Available component templates
const COMPONENT_TEMPLATES: Omit<ReportComponent, 'id'>[] = [
  {
    type: 'metric',
    title: 'Totale Candidati',
    description: 'Numero totale di candidati nel sistema',
    config: {
      dataSource: 'candidates',
      aggregation: 'count'
    }
  },
  {
    type: 'chart',
    title: 'Candidati per Status',
    description: 'Grafico a barre dei candidati raggruppati per status',
    config: {
      dataSource: 'candidates',
      chartType: 'bar',
      groupBy: 'status',
      aggregation: 'count'
    }
  },
  {
    type: 'pie-chart',
    title: 'Distribuzione Posizioni',
    description: 'Grafico a torta delle posizioni applicate',
    config: {
      dataSource: 'candidates',
      groupBy: 'positionApplied',
      aggregation: 'count'
    }
  },
  {
    type: 'table',
    title: 'Lista Colloqui Recenti',
    description: 'Tabella degli ultimi colloqui programmati',
    config: {
      dataSource: 'interviews',
      filters: [
        { field: 'scheduledDate', operator: 'greater', value: 'last-7-days' }
      ]
    }
  },
  {
    type: 'chart',
    title: 'Trend Assunzioni',
    description: 'Andamento mensile delle assunzioni',
    config: {
      dataSource: 'candidates',
      chartType: 'line',
      groupBy: 'month',
      aggregation: 'count',
      filters: [
        { field: 'status', operator: 'equals', value: 'HIRED' }
      ]
    }
  }
];

// Sortable component wrapper
const SortableReportComponent: React.FC<{
  component: ReportComponent;
  onRemove: (id: string) => void;
  onEdit: (component: ReportComponent) => void;
}> = ({ component, onRemove, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'chart': return <ChartIcon />;
      case 'table': return <TableIcon />;
      case 'pie-chart': return <PieIcon />;
      case 'metric': return <MetricIcon />;
      default: return <ChartIcon />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'chart': return 'Grafico';
      case 'table': return 'Tabella';
      case 'pie-chart': return 'Torta';
      case 'metric': return 'Metrica';
      default: return type;
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 2,
        border: isDragging ? '2px dashed' : '1px solid',
        borderColor: isDragging ? 'primary.main' : 'divider',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            {...attributes}
            {...listeners}
            size="small"
            sx={{ cursor: 'grab' }}
          >
            <DragIcon />
          </IconButton>
          
          {getIcon(component.type)}
          
          <Box flexGrow={1}>
            <Typography variant="subtitle2" fontWeight="bold">
              {component.title}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {component.description}
            </Typography>
          </Box>
          
          <Chip 
            label={getTypeLabel(component.type)}
            size="small"
            color="primary"
            variant="outlined"
          />
          
          <IconButton
            size="small"
            onClick={() => onEdit(component)}
            color="primary"
          >
            <PreviewIcon />
          </IconButton>
          
          <IconButton
            size="small"
            onClick={() => onRemove(component.id)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

// Component template selector
const ComponentTemplate: React.FC<{
  template: Omit<ReportComponent, 'id'>;
  onAdd: (template: Omit<ReportComponent, 'id'>) => void;
}> = ({ template, onAdd }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'chart': return <ChartIcon />;
      case 'table': return <TableIcon />;
      case 'pie-chart': return <PieIcon />;
      case 'metric': return <MetricIcon />;
      default: return <ChartIcon />;
    }
  };

  return (
    <Card 
      sx={{ 
        cursor: 'pointer',
        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
        transition: 'all 0.2s'
      }}
      onClick={() => onAdd(template)}
    >
      <CardContent sx={{ textAlign: 'center', py: 2 }}>
        <Box color="primary.main" mb={1}>
          {getIcon(template.type)}
        </Box>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          {template.title}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {template.description}
        </Typography>
        <Box mt={1}>
          <Button
            size="small"
            startIcon={<AddIcon />}
            variant="outlined"
            color="primary"
          >
            Aggiungi
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

const ReportBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [reportComponents, setReportComponents] = useState<ReportComponent[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saveDialog, setSaveDialog] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [editDialog, setEditDialog] = useState<{ open: boolean; component: ReportComponent | null }>({
    open: false,
    component: null
  });
  const [previewDialog, setPreviewDialog] = useState(false);
  const [currentReport, setCurrentReport] = useState<ApiReport | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setReportComponents((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  };

  const addComponent = (template: Omit<ReportComponent, 'id'>) => {
    const newComponent: ReportComponent = {
      ...template,
      id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    setReportComponents(prev => [...prev, newComponent]);
  };

  const removeComponent = (id: string) => {
    setReportComponents(prev => prev.filter(component => component.id !== id));
  };

  const editComponent = (component: ReportComponent) => {
    setEditDialog({ open: true, component });
  };

  const handleComponentUpdate = (updatedComponent: ReportComponent) => {
    setReportComponents(prev => 
      prev.map(comp => comp.id === updatedComponent.id ? updatedComponent : comp)
    );
    setEditDialog({ open: false, component: null });
  };

  const saveReport = async () => {
    if (!reportName.trim() || saving) return;

    setSaving(true);
    try {
      if (currentReport) {
        // Update existing report
        await reportsApi.updateReport(currentReport.id, {
          name: reportName,
          description: reportDescription,
          components: reportComponents
        });
      } else {
        // Create new report
        await reportsApi.createReport({
          name: reportName,
          description: reportDescription,
          components: reportComponents,
          isPublic: false,
          tags: []
        });
      }
      
      // Reset form
      setReportName('');
      setReportDescription('');
      setCurrentReport(null);
      setReportComponents([]);
      setSaveDialog(false);
      
      // Show success message
      alert(`Report "${reportName}" salvato con successo!`);
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Errore durante il salvataggio del report');
    } finally {
      setSaving(false);
    }
  };

  const previewReport = () => {
    setPreviewDialog(true);
  };

  const handleEditReport = (report: ApiReport) => {
    setCurrentReport(report);
    setReportName(report.name);
    setReportDescription(report.description);
    setReportComponents(report.components);
    setActiveTab(0); // Switch to builder tab
  };

  const handlePreviewReport = (report: ApiReport) => {
    setCurrentReport(report);
    setReportComponents(report.components);
    setPreviewDialog(true);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        📊 Report Builder
      </Typography>
      
      <Typography variant="body2" color="textSecondary" mb={3}>
        Crea e gestisci report personalizzati con drag & drop e visualizzazioni avanzate
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<BuildIcon />} 
            label="Costruisci Report"
            iconPosition="start"
          />
          <Tab 
            icon={<FolderIcon />} 
            label="Report Salvati"
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {activeTab === 1 ? (
        <SavedReports
          onEditReport={handleEditReport}
          onPreviewReport={handlePreviewReport}
        />
      ) : (
        <Box>

      <Grid container spacing={3}>
        {/* Component Library */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, maxHeight: '70vh', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              🎨 Libreria Componenti
            </Typography>
            
            <Grid container spacing={2}>
              {COMPONENT_TEMPLATES.map((template, index) => (
                <Grid item xs={12} key={index}>
                  <ComponentTemplate
                    template={template}
                    onAdd={addComponent}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Report Builder Area */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, minHeight: '70vh' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                🏗️ Area Costruzione Report
              </Typography>
              
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<PreviewIcon />}
                  onClick={previewReport}
                  disabled={reportComponents.length === 0}
                >
                  Anteprima
                </Button>
                
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => setSaveDialog(true)}
                  disabled={reportComponents.length === 0}
                >
                  Salva Report
                </Button>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {reportComponents.length === 0 ? (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight={300}
                color="text.secondary"
              >
                <ChartIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" gutterBottom>
                  Nessun componente aggiunto
                </Typography>
                <Typography variant="body2">
                  Trascina i componenti dalla libreria per iniziare a costruire il tuo report
                </Typography>
              </Box>
            ) : (
              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={reportComponents}
                  strategy={verticalListSortingStrategy}
                >
                  {reportComponents.map(component => (
                    <SortableReportComponent
                      key={component.id}
                      component={component}
                      onRemove={removeComponent}
                      onEdit={editComponent}
                    />
                  ))}
                </SortableContext>

                <DragOverlay>
                  {activeId ? (
                    <Card sx={{ opacity: 0.8 }}>
                      <CardContent>
                        <Typography variant="subtitle2">
                          {reportComponents.find(c => c.id === activeId)?.title}
                        </Typography>
                      </CardContent>
                    </Card>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </Paper>
        </Grid>
      </Grid>
        </Box>
      )}

      {/* Save Dialog */}
      <Dialog open={saveDialog} onClose={() => setSaveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>💾 Salva Report</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nome Report"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Descrizione"
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
          
          <Typography variant="body2" color="textSecondary" mt={2}>
            Componenti inclusi: {reportComponents.length}
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setSaveDialog(false)}>
            Annulla
          </Button>
          <Button 
            onClick={saveReport}
            variant="contained"
            disabled={!reportName.trim() || saving}
          >
            {saving ? 'Salvataggio...' : (currentReport ? 'Aggiorna' : 'Salva')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Component Edit Dialog */}
      <ComponentEditDialog
        open={editDialog.open}
        component={editDialog.component}
        onClose={() => setEditDialog({ open: false, component: null })}
        onSave={handleComponentUpdate}
      />

      {/* Report Preview Dialog */}
      <ReportPreview
        open={previewDialog}
        components={reportComponents}
        reportName={currentReport?.name || reportName || 'Anteprima Report'}
        onClose={() => setPreviewDialog(false)}
      />
    </Box>
  );
};

export default ReportBuilder;