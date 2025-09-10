import React, { useState, useEffect } from 'react';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Sms as SmsIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

interface Template {
  id: string;
  name: string;
  type: 'EMAIL' | 'SMS';
  subject?: string;
  content: string;
  variables: string[];
  category: string;
  createdAt: Date;
}

const CommunicationTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'EMAIL' as 'EMAIL' | 'SMS',
    subject: '',
    content: '',
    category: ''
  });

  // Demo templates
  const demoTemplates: Template[] = [
    {
      id: '1',
      name: 'Conferma Colloquio',
      type: 'EMAIL',
      subject: 'Conferma colloquio - {{posizione}}',
      content: 'Gentile {{nome}},\\n\\nLa confermiamo che il colloquio per la posizione di {{posizione}} è programmato per il {{data}} alle ore {{ora}}.\\n\\nLuogo: {{indirizzo}}\\n\\nCordiali saluti,\\nTeam HR',
      variables: ['nome', 'posizione', 'data', 'ora', 'indirizzo'],
      category: 'Colloqui',
      createdAt: new Date()
    },
    {
      id: '2',
      name: 'Ringraziamento Post-Colloquio',
      type: 'EMAIL',
      subject: 'Grazie per il colloquio - {{posizione}}',
      content: 'Gentile {{nome}},\\n\\nLa ringraziamo per il tempo dedicato al colloquio di oggi per la posizione di {{posizione}}.\\n\\nLe faremo sapere l\'esito entro {{giorni}} giorni lavorativi.\\n\\nCordiali saluti,\\nTeam HR',
      variables: ['nome', 'posizione', 'giorni'],
      category: 'Follow-up',
      createdAt: new Date()
    },
    {
      id: '3',
      name: 'Promemoria Colloquio SMS',
      type: 'SMS',
      content: 'Ciao {{nome}}, ti ricordiamo il colloquio di domani alle {{ora}} per {{posizione}}. A presto!',
      variables: ['nome', 'ora', 'posizione'],
      category: 'Promemoria',
      createdAt: new Date()
    },
    {
      id: '4',
      name: 'Offerta di Lavoro',
      type: 'EMAIL',
      subject: 'Offerta di lavoro - {{posizione}}',
      content: 'Gentile {{nome}},\\n\\nSiamo lieti di offrirle la posizione di {{posizione}} presso la nostra azienda.\\n\\nDettagli dell\'offerta:\\n- Stipendio: {{stipendio}}\\n- Inizio: {{data_inizio}}\\n- Sede: {{sede}}\\n\\nLa preghiamo di confermare entro il {{scadenza}}.\\n\\nCordiali saluti,\\nTeam HR',
      variables: ['nome', 'posizione', 'stipendio', 'data_inizio', 'sede', 'scadenza'],
      category: 'Offerte',
      createdAt: new Date()
    }
  ];

  useEffect(() => {
    setTemplates(demoTemplates);
  }, []);

  const handleSaveTemplate = () => {
    if (!formData.name || !formData.content) {
      toast.error('Nome e contenuto sono obbligatori');
      return;
    }

    const variables = extractVariables(formData.content);
    
    if (editingTemplate) {
      setTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, ...formData, variables }
          : t
      ));
      toast.success('Template aggiornato');
    } else {
      const newTemplate: Template = {
        id: Date.now().toString(),
        ...formData,
        variables,
        createdAt: new Date()
      };
      setTemplates(prev => [...prev, newTemplate]);
      toast.success('Template creato');
    }

    resetForm();
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/{{(.*?)}}/g);
    return matches ? matches.map(match => match.replace(/[{}]/g, '')) : [];
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject || '',
      content: template.content,
      category: template.category
    });
    setDialogOpen(true);
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo template?')) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template eliminato');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'EMAIL',
      subject: '',
      content: '',
      category: ''
    });
    setEditingTemplate(null);
    setDialogOpen(false);
  };

  const getTypeIcon = (type: string) => {
    return type === 'EMAIL' ? <EmailIcon color="primary" /> : <SmsIcon color="secondary" />;
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

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Variabili</TableCell>
                  <TableCell>Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getTypeIcon(template.type)}
                        <Typography variant="body2">
                          {template.type}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="bold">
                        {template.name}
                      </Typography>
                      {template.subject && (
                        <Typography variant="caption" color="textSecondary">
                          {template.subject}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={template.category} size="small" />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {template.variables.map((variable) => (
                          <Chip
                            key={variable}
                            label={`{{${variable}}}`}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog per creare/modificare template */}
      <Dialog open={dialogOpen} onClose={resetForm} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Modifica Template' : 'Nuovo Template'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nome Template"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />

            <Box display="flex" gap={2}>
              <FormControl sx={{ minWidth: 150 }}>
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
                placeholder="es. Colloqui, Follow-up, Promemoria"
              />
            </Box>

            {formData.type === 'EMAIL' && (
              <TextField
                label="Oggetto"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                fullWidth
                placeholder="Usa {{variabile}} per valori dinamici"
              />
            )}

            <TextField
              label="Contenuto"
              multiline
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              fullWidth
              placeholder="Usa {{variabile}} per valori dinamici come {{nome}}, {{posizione}}, {{data}}"
              helperText="Le variabili verranno automaticamente rilevate e sostituite"
            />

            {formData.content && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Variabili rilevate:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {extractVariables(formData.content).map((variable) => (
                    <Chip
                      key={variable}
                      label={`{{${variable}}}`}
                      size="small"
                      color="primary"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm}>Annulla</Button>
          <Button onClick={handleSaveTemplate} variant="contained">
            {editingTemplate ? 'Aggiorna' : 'Crea'} Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunicationTemplates;