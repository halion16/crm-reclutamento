import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Chip,
  IconButton,
  Box,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import type { ReportComponent, ComponentConfig, ReportFilter } from '../../services/reportsApi';

interface ComponentEditDialogProps {
  open: boolean;
  component: ReportComponent | null;
  onClose: () => void;
  onSave: (component: ReportComponent) => void;
}

const DATA_SOURCES = [
  { value: 'candidates', label: 'Candidati' },
  { value: 'interviews', label: 'Colloqui' },
  { value: 'communications', label: 'Comunicazioni' },
  { value: 'workflow', label: 'Workflow' }
];

const CANDIDATE_FIELDS = [
  { value: 'status', label: 'Status' },
  { value: 'positionApplied', label: 'Posizione' },
  { value: 'experience', label: 'Esperienza' },
  { value: 'skills', label: 'Competenze' },
  { value: 'location', label: 'Località' },
  { value: 'createdAt', label: 'Data Creazione' },
  { value: 'salary', label: 'Stipendio' }
];

const INTERVIEW_FIELDS = [
  { value: 'status', label: 'Status' },
  { value: 'type', label: 'Tipo' },
  { value: 'scheduledDate', label: 'Data Programmata' },
  { value: 'duration', label: 'Durata' },
  { value: 'interviewerName', label: 'Intervistatore' },
  { value: 'score', label: 'Punteggio' }
];

const ComponentEditDialog: React.FC<ComponentEditDialogProps> = ({
  open,
  component,
  onClose,
  onSave
}) => {
  const [editedComponent, setEditedComponent] = useState<ReportComponent | null>(null);

  useEffect(() => {
    if (component) {
      setEditedComponent({ ...component });
    }
  }, [component]);

  if (!editedComponent) return null;

  const handleSave = () => {
    if (editedComponent) {
      onSave(editedComponent);
      onClose();
    }
  };

  const handleConfigChange = (key: keyof ComponentConfig, value: any) => {
    setEditedComponent(prev => prev ? {
      ...prev,
      config: { ...prev.config, [key]: value }
    } : null);
  };

  const addFilter = () => {
    const newFilter: ReportFilter = {
      field: '',
      operator: 'equals',
      value: ''
    };
    
    setEditedComponent(prev => prev ? {
      ...prev,
      config: {
        ...prev.config,
        filters: [...(prev.config.filters || []), newFilter]
      }
    } : null);
  };

  const updateFilter = (index: number, field: keyof ReportFilter, value: string) => {
    setEditedComponent(prev => {
      if (!prev?.config.filters) return prev;
      
      const newFilters = [...prev.config.filters];
      newFilters[index] = { ...newFilters[index], [field]: value };
      
      return {
        ...prev,
        config: { ...prev.config, filters: newFilters }
      };
    });
  };

  const removeFilter = (index: number) => {
    setEditedComponent(prev => {
      if (!prev?.config.filters) return prev;
      
      const newFilters = prev.config.filters.filter((_, i) => i !== index);
      return {
        ...prev,
        config: { ...prev.config, filters: newFilters }
      };
    });
  };

  const getFieldOptions = () => {
    switch (editedComponent.config.dataSource) {
      case 'candidates':
        return CANDIDATE_FIELDS;
      case 'interviews':
        return INTERVIEW_FIELDS;
      default:
        return [];
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        ✏️ Modifica Componente: {editedComponent.title}
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Basic Info */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Informazioni Base
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Titolo"
              value={editedComponent.title}
              onChange={(e) => setEditedComponent(prev => prev ? 
                { ...prev, title: e.target.value } : null
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Sorgente Dati</InputLabel>
              <Select
                value={editedComponent.config.dataSource}
                onChange={(e) => handleConfigChange('dataSource', e.target.value)}
              >
                {DATA_SOURCES.map(source => (
                  <MenuItem key={source.value} value={source.value}>
                    {source.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descrizione"
              value={editedComponent.description}
              onChange={(e) => setEditedComponent(prev => prev ? 
                { ...prev, description: e.target.value } : null
              )}
              multiline
              rows={2}
            />
          </Grid>

          {/* Chart Configuration */}
          {(editedComponent.type === 'chart' || editedComponent.type === 'pie-chart') && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Configurazione Grafico
                </Typography>
              </Grid>
              
              {editedComponent.type === 'chart' && (
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo Grafico</InputLabel>
                    <Select
                      value={editedComponent.config.chartType || 'bar'}
                      onChange={(e) => handleConfigChange('chartType', e.target.value)}
                    >
                      <MenuItem value="bar">Barre</MenuItem>
                      <MenuItem value="line">Linea</MenuItem>
                      <MenuItem value="area">Area</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Raggruppa per</InputLabel>
                  <Select
                    value={editedComponent.config.groupBy || ''}
                    onChange={(e) => handleConfigChange('groupBy', e.target.value)}
                  >
                    {getFieldOptions().map(field => (
                      <MenuItem key={field.value} value={field.value}>
                        {field.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Aggregazione</InputLabel>
                  <Select
                    value={editedComponent.config.aggregation || 'count'}
                    onChange={(e) => handleConfigChange('aggregation', e.target.value)}
                  >
                    <MenuItem value="count">Conta</MenuItem>
                    <MenuItem value="sum">Somma</MenuItem>
                    <MenuItem value="avg">Media</MenuItem>
                    <MenuItem value="max">Massimo</MenuItem>
                    <MenuItem value="min">Minimo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          {/* Table Configuration */}
          {editedComponent.type === 'table' && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Configurazione Tabella
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Limite Righe"
                  type="number"
                  value={editedComponent.config.limit || 50}
                  onChange={(e) => handleConfigChange('limit', parseInt(e.target.value))}
                />
              </Grid>
            </>
          )}

          {/* Filters */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Filtri
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={addFilter}
                size="small"
                variant="outlined"
              >
                Aggiungi Filtro
              </Button>
            </Box>
            
            {editedComponent.config.filters?.map((filter, index) => (
              <Box key={index} mb={2} p={2} border="1px solid" borderColor="divider" borderRadius={1}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Campo</InputLabel>
                      <Select
                        value={filter.field}
                        onChange={(e) => updateFilter(index, 'field', e.target.value)}
                      >
                        {getFieldOptions().map(field => (
                          <MenuItem key={field.value} value={field.value}>
                            {field.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Operatore</InputLabel>
                      <Select
                        value={filter.operator}
                        onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                      >
                        <MenuItem value="equals">Uguale</MenuItem>
                        <MenuItem value="contains">Contiene</MenuItem>
                        <MenuItem value="greater">Maggiore di</MenuItem>
                        <MenuItem value="less">Minore di</MenuItem>
                        <MenuItem value="between">Tra</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Valore"
                      value={filter.value}
                      onChange={(e) => updateFilter(index, 'value', e.target.value)}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={2}>
                    <IconButton
                      onClick={() => removeFilter(index)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}
            
            {(!editedComponent.config.filters || editedComponent.config.filters.length === 0) && (
              <Typography variant="body2" color="textSecondary" textAlign="center" py={2}>
                Nessun filtro configurato
              </Typography>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Annulla
        </Button>
        <Button onClick={handleSave} variant="contained">
          Salva Modifiche
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ComponentEditDialog;