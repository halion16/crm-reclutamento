import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  MoreVert as MoreIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { reportsApi } from '../../services/reportsApi';
import type { Report, ReportComponent } from '../../services/reportsApi';

interface SavedReportsProps {
  onEditReport: (report: Report) => void;
  onPreviewReport: (report: Report) => void;
}

const SavedReports: React.FC<SavedReportsProps> = ({
  onEditReport,
  onPreviewReport
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; report: Report | null }>({
    open: false,
    report: null
  });
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement | null; report: Report | null }>({
    element: null,
    report: null
  });

  useEffect(() => {
    loadSavedReports();
  }, []);

  const loadSavedReports = async () => {
    setLoading(true);
    try {
      const fetchedReports = await reportsApi.getAllReports();
      setReports(fetchedReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      // Show error message to user
    }
    setLoading(false);
  };

  const handleDeleteReport = async (report: Report) => {
    try {
      await reportsApi.deleteReport(report.id);
      setReports(prev => prev.filter(r => r.id !== report.id));
      setDeleteDialog({ open: false, report: null });
      
      // Show success message (in real app, use a proper notification system)
      alert(`Report "${report.name}" eliminato con successo!`);
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Errore durante l\'eliminazione del report');
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, report: Report) => {
    setMenuAnchor({ element: event.currentTarget, report });
  };

  const handleMenuClose = () => {
    setMenuAnchor({ element: null, report: null });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chart': return '📊';
      case 'table': return '📋';
      case 'pie-chart': return '🥧';
      case 'metric': return '📈';
      default: return '📄';
    }
  };

  const getComponentTypesString = (components: ReportComponent[]) => {
    const types = [...new Set(components.map(c => c.type))];
    return types.map(type => getTypeIcon(type)).join(' ');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress size={60} />
        <Typography variant="h6" ml={2}>
          Caricamento report salvati...
        </Typography>
      </Box>
    );
  }

  if (reports.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <ReportIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Nessun report salvato
        </Typography>
        <Typography variant="body2" color="textSecondary">
          I report che creerai e salvi appariranno qui
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        📚 Report Salvati ({reports.length})
      </Typography>
      
      <Grid container spacing={3}>
        {reports.map((report) => (
          <Grid item xs={12} md={6} lg={4} key={report.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': { boxShadow: 6 }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {report.name}
                  </Typography>
                  
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, report)}
                  >
                    <MoreIcon />
                  </IconButton>
                </Box>
                
                <Typography variant="body2" color="textSecondary" paragraph>
                  {report.description}
                </Typography>
                
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Typography variant="caption" color="textSecondary">
                    Componenti:
                  </Typography>
                  <Typography variant="body2">
                    {getComponentTypesString(report.components)} ({report.components.length})
                  </Typography>
                </Box>
                
                <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                  {report.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                  {report.isPublic && (
                    <Chip
                      label="Pubblico"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                </Box>
                
                <Box display="flex" alignItems="center" gap={1} mt="auto">
                  <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                    {report.createdBy.charAt(0)}
                  </Avatar>
                  <Typography variant="caption" color="textSecondary">
                    {report.createdBy}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    • {formatDistanceToNow(report.updatedAt, { addSuffix: true, locale: it })}
                  </Typography>
                </Box>
              </CardContent>
              
              <CardActions>
                <Button
                  size="small"
                  startIcon={<PreviewIcon />}
                  onClick={() => onPreviewReport(report)}
                  color="primary"
                >
                  Anteprima
                </Button>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => onEditReport(report)}
                >
                  Modifica
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor.element}
        open={Boolean(menuAnchor.element)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => {
          if (menuAnchor.report) onEditReport(menuAnchor.report);
          handleMenuClose();
        }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Modifica
        </MenuItem>
        
        <MenuItem onClick={() => {
          if (menuAnchor.report) onPreviewReport(menuAnchor.report);
          handleMenuClose();
        }}>
          <PreviewIcon fontSize="small" sx={{ mr: 1 }} />
          Anteprima
        </MenuItem>
        
        <MenuItem onClick={handleMenuClose}>
          <ShareIcon fontSize="small" sx={{ mr: 1 }} />
          Condividi
        </MenuItem>
        
        <MenuItem onClick={handleMenuClose}>
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Esporta
        </MenuItem>
        
        <MenuItem onClick={handleMenuClose}>
          <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
          Pianifica
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            if (menuAnchor.report) {
              setDeleteDialog({ open: true, report: menuAnchor.report });
            }
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Elimina
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, report: null })}
      >
        <DialogTitle>Conferma Eliminazione</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sei sicuro di voler eliminare il report "{deleteDialog.report?.name}"?
            Questa azione non può essere annullata.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, report: null })}>
            Annulla
          </Button>
          <Button 
            onClick={() => deleteDialog.report && handleDeleteReport(deleteDialog.report)}
            color="error"
            variant="contained"
          >
            Elimina
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SavedReports;