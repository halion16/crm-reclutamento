import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Avatar,
  Badge,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  AdminPanelSettings as AdminIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, RESOURCES, ACTIONS } from '../../types/auth';
import PermissionsDialog from './PermissionsDialog';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserManagementSimple: React.FC = () => {
  const { hasPermission, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: UserRole.VIEWER,
    department: '',
    isActive: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        showSnackbar('Errore nel caricamento utenti', 'error');
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      showSnackbar('Errore di connessione', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showSnackbar('Utente creato con successo', 'success');
        setCreateDialogOpen(false);
        resetForm();
        fetchUsers();
      } else {
        const data = await response.json();
        showSnackbar(data.message || 'Errore nella creazione utente', 'error');
      }
    } catch (error) {
      showSnackbar('Errore di connessione', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: UserRole.VIEWER,
      department: '',
      isActive: true
    });
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '', // Don't prefill password for security
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department || '',
      isActive: user.isActive
    });
    setEditDialogOpen(true);
  };

  const handlePermissionsUser = (user: User) => {
    setSelectedUser(user);
    setPermissionsDialogOpen(true);
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Sei sicuro di voler eliminare l'utente ${user.firstName} ${user.lastName}?`)) {
      try {
        const response = await fetch(`http://localhost:3004/api/users/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          showSnackbar('Utente eliminato con successo', 'success');
          fetchUsers();
        } else {
          const data = await response.json();
          showSnackbar(data.message || 'Errore nell\'eliminazione utente', 'error');
        }
      } catch (error) {
        showSnackbar('Errore di connessione', 'error');
      }
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password; // Don't send empty password
      }

      const response = await fetch(`http://localhost:3004/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        showSnackbar('Utente aggiornato con successo', 'success');
        setEditDialogOpen(false);
        setSelectedUser(null);
        resetForm();
        fetchUsers();
      } else {
        const data = await response.json();
        showSnackbar(data.message || 'Errore nell\'aggiornamento utente', 'error');
      }
    } catch (error) {
      showSnackbar('Errore di connessione', 'error');
    }
  };

  const handleSavePermissions = async (userId: string, permissions: string[]) => {
    try {
      const response = await fetch(`http://localhost:3004/api/users/${userId}/permissions`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permissions })
      });

      if (response.ok) {
        showSnackbar('Permessi aggiornati con successo', 'success');
        fetchUsers();
      } else {
        const data = await response.json();
        showSnackbar(data.message || 'Errore nell\'aggiornamento permessi', 'error');
      }
    } catch (error) {
      showSnackbar('Errore di connessione', 'error');
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
      case UserRole.ADMIN:
        return <AdminIcon color="error" />;
      case UserRole.HR_MANAGER:
        return <GroupIcon color="warning" />;
      case UserRole.RECRUITER:
        return <PersonIcon color="info" />;
      case UserRole.INTERVIEWER:
        return <PersonIcon color="success" />;
      default:
        return <ViewIcon color="disabled" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'error';
      case UserRole.ADMIN:
        return 'warning';
      case UserRole.HR_MANAGER:
        return 'info';
      case UserRole.RECRUITER:
        return 'success';
      case UserRole.INTERVIEWER:
        return 'primary';
      default:
        return 'default';
    }
  };

  const filteredUsers = users.filter(user => 
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateUsers = hasPermission('users', 'create');

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Caricamento utenti...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          👥 Gestione Team
        </Typography>
        {canCreateUsers && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Nuovo Utente
          </Button>
        )}
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            label="Cerca utenti"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
            }}
            sx={{ minWidth: 250 }}
          />
        </CardContent>
      </Card>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Utente</TableCell>
              <TableCell>Ruolo</TableCell>
              <TableCell>Dipartimento</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell>Ultimo Accesso</TableCell>
              <TableCell>Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Badge
                      color={user.isActive ? 'success' : 'error'}
                      variant="dot"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    >
                      <Avatar>
                        {getRoleIcon(user.role)}
                      </Avatar>
                    </Badge>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={getRoleColor(user.role)}
                    size="small"
                    icon={getRoleIcon(user.role)}
                  />
                </TableCell>
                <TableCell>
                  {user.department || '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.isActive ? 'Attivo' : 'Disattivo'}
                    color={user.isActive ? 'success' : 'error'}
                    size="small"
                    icon={user.isActive ? <ActiveIcon /> : <BlockIcon />}
                  />
                </TableCell>
                <TableCell>
                  {user.lastLogin 
                    ? new Date(user.lastLogin).toLocaleDateString('it-IT')
                    : 'Mai'
                  }
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleEditUser(user)}
                      title="Modifica utente"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="secondary"
                      onClick={() => handlePermissionsUser(user)}
                      title="Gestisci permessi"
                    >
                      <AdminIcon />
                    </IconButton>
                    {hasPermission('users', 'delete') && user.id !== currentUser?.id && (
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteUser(user)}
                        title="Elimina utente"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuovo Utente</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              fullWidth
              helperText="Minimo 8 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale"
            />
            <Box display="flex" gap={1}>
              <TextField
                label="Nome"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Cognome"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                fullWidth
              />
            </Box>
            <FormControl fullWidth>
              <InputLabel>Ruolo</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                label="Ruolo"
              >
                {Object.values(UserRole).map(role => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Dipartimento"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Annulla</Button>
          <Button onClick={handleCreateUser} variant="contained">
            Crea Utente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifica Utente</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Nuova Password (opzionale)"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              fullWidth
              helperText="Lascia vuoto per mantenere la password attuale"
            />
            <Box display="flex" gap={1}>
              <TextField
                label="Nome"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Cognome"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                fullWidth
              />
            </Box>
            <FormControl fullWidth>
              <InputLabel>Ruolo</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                label="Ruolo"
              >
                {Object.values(UserRole).map(role => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Dipartimento"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Stato</InputLabel>
              <Select
                value={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value as boolean })}
                label="Stato"
              >
                <MenuItem value={true}>Attivo</MenuItem>
                <MenuItem value={false}>Disattivo</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Annulla</Button>
          <Button onClick={handleUpdateUser} variant="contained">
            Aggiorna Utente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permissions Dialog */}
      <PermissionsDialog
        open={permissionsDialogOpen}
        onClose={() => setPermissionsDialogOpen(false)}
        user={selectedUser}
        onSave={handleSavePermissions}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagementSimple;