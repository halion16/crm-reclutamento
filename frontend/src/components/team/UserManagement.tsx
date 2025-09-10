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
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Checkbox,
  FormControlLabel,
  Alert,
  Snackbar,
  Tooltip,
  Avatar,
  Badge,
  Divider,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Group as GroupIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';

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
  customPermissions?: string[];
}

interface UserFormData {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string;
  isActive: boolean;
}

const UserManagement: React.FC = () => {
  const { hasPermission, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: UserRole.VIEWER,
    department: '',
    isActive: true
  });

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuUserId, setMenuUserId] = useState<string | null>(null);

  // Notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
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

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, userId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuUserId(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUserId(null);
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/users', {
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

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await fetch(`/api/users/${selectedUser.id}`, {
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
        resetForm();
        fetchUsers();
      } else {
        const data = await response.json();
        showSnackbar(data.message || 'Errore nell\'aggiornamento', 'error');
      }
    } catch (error) {
      showSnackbar('Errore di connessione', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        showSnackbar('Utente disattivato con successo', 'success');
        setDeleteDialogOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        const data = await response.json();
        showSnackbar(data.message || 'Errore nella disattivazione', 'error');
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
    setSelectedUser(null);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department || '',
      isActive: user.isActive
    });
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
    handleMenuClose();
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;
    
    return matchesSearch && matchesRole && matchesDepartment;
  });

  // Check permissions
  const canCreateUsers = hasPermission('users', 'create');
  const canUpdateUsers = hasPermission('users', 'update');
  const canDeleteUsers = hasPermission('users', 'delete');
  const canManagePermissions = hasPermission('users', 'manage');

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Caricamento...</Typography>
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

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
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
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Ruolo</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e: SelectChangeEvent) => setRoleFilter(e.target.value)}
                label="Ruolo"
              >
                <MenuItem value="all">Tutti i ruoli</MenuItem>
                {Object.values(UserRole).map(role => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Dipartimento</InputLabel>
              <Select
                value={departmentFilter}
                onChange={(e: SelectChangeEvent) => setDepartmentFilter(e.target.value)}
                label="Dipartimento"
              >
                <MenuItem value="all">Tutti</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
                <MenuItem value="IT">IT</MenuItem>
                <MenuItem value="Sales">Sales</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
              </Select>
            </FormControl>
          </Stack>
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
              <TableCell align="center">Azioni</TableCell>
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
                <TableCell align="center">
                  {currentUser?.id !== user.id && (
                    <IconButton
                      onClick={(e) => handleMenuClick(e, user.id)}
                      size="small"
                    >
                      <MoreIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {canUpdateUsers && (
          <MenuItem onClick={() => openEditDialog(users.find(u => u.id === menuUserId)!)}>
            <EditIcon sx={{ mr: 1 }} />
            Modifica
          </MenuItem>
        )}
        {canManagePermissions && (
          <MenuItem onClick={() => {
            setSelectedUser(users.find(u => u.id === menuUserId)!);
            setPermissionsDialogOpen(true);
            handleMenuClose();
          }}>
            <SecurityIcon sx={{ mr: 1 }} />
            Permessi
          </MenuItem>
        )}
        <Divider />
        {canDeleteUsers && (
          <MenuItem onClick={() => openDeleteDialog(users.find(u => u.id === menuUserId)!)}>
            <DeleteIcon sx={{ mr: 1 }} color="error" />
            Disattiva
          </MenuItem>
        )}
      </Menu>

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
                onChange={(e: SelectChangeEvent) => setFormData({ ...formData, role: e.target.value as UserRole })}
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
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Utente Attivo"
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
                onChange={(e: SelectChangeEvent) => setFormData({ ...formData, role: e.target.value as UserRole })}
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
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Utente Attivo"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Annulla</Button>
          <Button onClick={handleUpdateUser} variant="contained">
            Salva Modifiche
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Conferma Disattivazione</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler disattivare l'utente {selectedUser?.firstName} {selectedUser?.lastName}?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            L'utente non potrà più accedere al sistema, ma i suoi dati saranno mantenuti.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annulla</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Disattiva
          </Button>
        </DialogActions>
      </Dialog>

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

export default UserManagement;