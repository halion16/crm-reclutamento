import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Email as EmailIcon,
  Sms as SmsIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

interface Template {
  id: number;
  name: string;
  type: 'EMAIL' | 'SMS';
  subject?: string;
  content: string;
  category: string;
}

const BasicTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: 1,
      name: 'Conferma Colloquio',
      type: 'EMAIL',
      subject: 'Conferma colloquio programmato',
      content: 'Gentile candidato, la confermiamo che il colloquio è programmato per domani alle 09:00.',
      category: 'Colloqui'
    },
    {
      id: 2,
      name: 'Ringraziamento',
      type: 'EMAIL', 
      subject: 'Grazie per il colloquio',
      content: 'La ringraziamo per il tempo dedicato al colloquio di oggi.',
      category: 'Follow-up'
    },
    {
      id: 3,
      name: 'Promemoria SMS',
      type: 'SMS',
      content: 'Ricordati del colloquio di domani alle ore 9:00!',
      category: 'Promemoria'
    }
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'EMAIL' as 'EMAIL' | 'SMS',
    subject: '',
    content: '',
    category: ''
  });

  const handleSave = () => {
    if (!formData.name || !formData.content) {
      toast.error('Nome e contenuto sono obbligatori');
      return;
    }

    const newTemplate: Template = {
      id: Date.now(),
      name: formData.name,
      type: formData.type,
      subject: formData.subject,
      content: formData.content,
      category: formData.category || 'Generale'
    };

    setTemplates(prev => [...prev, newTemplate]);
    toast.success('Template creato con successo');
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'EMAIL',
      subject: '',
      content: '',
      category: ''
    });
    setDialogOpen(false);
  };

  const getTypeIcon = (type: string) => {
    return type === 'EMAIL' ? 
      <EmailIcon color="primary" fontSize="small" /> : 
      <SmsIcon color="secondary" fontSize="small" />;
  };

  const getTypeColor = (type: string) => {
    return type === 'EMAIL' ? 'primary' : 'secondary';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          📝 Template Comunicazioni
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Nuovo Template
        </Button>
      </Box>

      {/* Templates Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Anteprima</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getTypeIcon(template.type)}
                        <Chip 
                          label={template.type} 
                          size="small"
                          color={getTypeColor(template.type)}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {template.name}
                      </Typography>
                      {template.subject && (
                        <Typography variant="caption" color="textSecondary">
                          {template.subject}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={template.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {template.content.length > 50 
                          ? `${template.content.substring(0, 50)}...`
                          : template.content
                        }
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={resetForm} maxWidth="sm" fullWidth>
        <DialogTitle>Nuovo Template</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nome Template"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />

            <Box display="flex" gap={2}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.type}
                  label="Tipo"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'EMAIL' | 'SMS' })}
                >
                  <MenuItem value="EMAIL">Email</MenuItem>
                  <MenuItem value="SMS">SMS</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Categoria"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                fullWidth
                placeholder="es. Colloqui, Follow-up"
              />
            </Box>

            {formData.type === 'EMAIL' && (
              <TextField
                label="Oggetto"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                fullWidth
              />
            )}

            <TextField
              label="Contenuto"
              multiline
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              fullWidth
              helperText="Scrivi il testo del template"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm}>Annulla</Button>
          <Button onClick={handleSave} variant="contained">
            Crea Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BasicTemplates;