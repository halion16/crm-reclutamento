import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  Divider,
  Chip,
  Stack
} from '@mui/material';
import { UserRole, RESOURCES, ACTIONS } from '../../types/auth';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  customPermissions?: string[];
}

interface PermissionsDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (userId: string, permissions: string[]) => void;
}

interface PermissionGroup {
  resource: string;
  label: string;
  description: string;
  actions: { action: string; label: string; description: string }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    resource: RESOURCES.CANDIDATES,
    label: 'Candidati',
    description: 'Gestione candidati e profili',
    actions: [
      { action: ACTIONS.READ, label: 'Visualizza', description: 'Visualizzare lista candidati' },
      { action: ACTIONS.CREATE, label: 'Crea', description: 'Aggiungere nuovi candidati' },
      { action: ACTIONS.UPDATE, label: 'Modifica', description: 'Modificare dati candidati' },
      { action: ACTIONS.DELETE, label: 'Elimina', description: 'Eliminare candidati' },
      { action: ACTIONS.EXPORT, label: 'Esporta', description: 'Esportare dati candidati' }
    ]
  },
  {
    resource: RESOURCES.INTERVIEWS,
    label: 'Colloqui',
    description: 'Gestione colloqui e valutazioni',
    actions: [
      { action: ACTIONS.READ, label: 'Visualizza', description: 'Visualizzare colloqui' },
      { action: ACTIONS.CREATE, label: 'Crea', description: 'Programmare colloqui' },
      { action: ACTIONS.UPDATE, label: 'Modifica', description: 'Modificare colloqui' },
      { action: ACTIONS.DELETE, label: 'Elimina', description: 'Eliminare colloqui' },
      { action: ACTIONS.APPROVE, label: 'Approva', description: 'Approvare valutazioni' }
    ]
  },
  {
    resource: RESOURCES.COMMUNICATIONS,
    label: 'Comunicazioni',
    description: 'Email e messaggi ai candidati',
    actions: [
      { action: ACTIONS.READ, label: 'Visualizza', description: 'Vedere comunicazioni' },
      { action: ACTIONS.CREATE, label: 'Invia', description: 'Inviare messaggi' },
      { action: ACTIONS.UPDATE, label: 'Modifica', description: 'Modificare template' },
      { action: ACTIONS.DELETE, label: 'Elimina', description: 'Eliminare comunicazioni' }
    ]
  },
  {
    resource: RESOURCES.WORKFLOW,
    label: 'Workflow',
    description: 'Gestione processi di selezione',
    actions: [
      { action: ACTIONS.READ, label: 'Visualizza', description: 'Vedere workflow' },
      { action: ACTIONS.CREATE, label: 'Crea', description: 'Creare workflow' },
      { action: ACTIONS.UPDATE, label: 'Modifica', description: 'Modificare workflow' },
      { action: ACTIONS.MANAGE, label: 'Gestisci', description: 'Gestire stati workflow' }
    ]
  },
  {
    resource: RESOURCES.AI_FEATURES,
    label: 'Funzioni AI',
    description: 'Strumenti di intelligenza artificiale',
    actions: [
      { action: ACTIONS.READ, label: 'Visualizza', description: 'Usare AI Dashboard' },
      { action: ACTIONS.CREATE, label: 'Genera', description: 'Generare contenuti AI' },
      { action: ACTIONS.MANAGE, label: 'Configura', description: 'Configurare AI' }
    ]
  },
  {
    resource: 'users',
    label: 'Gestione Team',
    description: 'Amministrazione utenti',
    actions: [
      { action: ACTIONS.READ, label: 'Visualizza', description: 'Vedere utenti' },
      { action: ACTIONS.CREATE, label: 'Crea', description: 'Creare utenti' },
      { action: ACTIONS.UPDATE, label: 'Modifica', description: 'Modificare utenti' },
      { action: ACTIONS.DELETE, label: 'Elimina', description: 'Eliminare utenti' }
    ]
  }
];

const PermissionsDialog: React.FC<PermissionsDialogProps> = ({ open, onClose, user, onSave }) => {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      const permissions = new Set(user.customPermissions || []);
      setSelectedPermissions(permissions);
    }
  }, [user]);

  const handlePermissionChange = (resource: string, action: string, checked: boolean) => {
    const permission = `${resource}:${action}`;
    const newPermissions = new Set(selectedPermissions);
    
    if (checked) {
      newPermissions.add(permission);
    } else {
      newPermissions.delete(permission);
    }
    
    setSelectedPermissions(newPermissions);
  };

  const handleSelectAll = (resource: string, actions: string[]) => {
    const newPermissions = new Set(selectedPermissions);
    actions.forEach(action => {
      newPermissions.add(`${resource}:${action}`);
    });
    setSelectedPermissions(newPermissions);
  };

  const handleDeselectAll = (resource: string, actions: string[]) => {
    const newPermissions = new Set(selectedPermissions);
    actions.forEach(action => {
      newPermissions.delete(`${resource}:${action}`);
    });
    setSelectedPermissions(newPermissions);
  };

  const handleSave = () => {
    if (user) {
      onSave(user.id, Array.from(selectedPermissions));
    }
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Gestione Permessi - {user.firstName} {user.lastName}
          </Typography>
          <Chip label={user.role} color="primary" />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Configura i permessi specifici per questo utente. I permessi personalizzati si aggiungono a quelli base del ruolo.
        </Typography>

        <Grid container spacing={2}>
          {PERMISSION_GROUPS.map((group) => (
            <Grid item xs={12} md={6} key={group.resource}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {group.label}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {group.description}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        onClick={() => handleSelectAll(group.resource, group.actions.map(a => a.action))}
                      >
                        Tutti
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleDeselectAll(group.resource, group.actions.map(a => a.action))}
                      >
                        Nessuno
                      </Button>
                    </Stack>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  {group.actions.map((actionItem) => {
                    const permission = `${group.resource}:${actionItem.action}`;
                    return (
                      <FormControlLabel
                        key={permission}
                        control={
                          <Checkbox
                            checked={selectedPermissions.has(permission)}
                            onChange={(e) => handlePermissionChange(group.resource, actionItem.action, e.target.checked)}
                            size="small"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {actionItem.label}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {actionItem.description}
                            </Typography>
                          </Box>
                        }
                        sx={{ 
                          display: 'flex',
                          alignItems: 'flex-start',
                          mb: 1,
                          ml: 0
                        }}
                      />
                    );
                  })}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>
            Riepilogo Permessi Selezionati ({selectedPermissions.size})
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {Array.from(selectedPermissions).map((permission) => (
              <Chip
                key={permission}
                label={permission}
                size="small"
                variant="outlined"
                onDelete={() => {
                  const [resource, action] = permission.split(':');
                  handlePermissionChange(resource, action, false);
                }}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button onClick={handleSave} variant="contained">
          Salva Permessi
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PermissionsDialog;