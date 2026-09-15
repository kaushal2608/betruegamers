'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Stack,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Shield,
  Users,
  Tv,
  Gamepad2,
  MessageSquare,
  Search,
  Lock,
  Unlock,
  ArrowLeft
} from 'lucide-react';
import {
  useGetAdminStatsQuery,
  useGetAdminUsersQuery,
  useToggleBlockUserMutation,
  useUpdateUserRoleMutation
} from '@/store/api/adminApi';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AuthGuard from '@/components/common/AuthGuard';
import useToast from '@/components/common/useToast';

export default function AdminDashboardPage() {
  const { user } = useSelector((state) => state.auth);
  const { showSuccess, showError } = useToast();
  const [search, setSearch] = useState('');

  const { data: statsData, isLoading: isStatsLoading } = useGetAdminStatsQuery();
  const { data: usersData, isLoading: isUsersLoading } = useGetAdminUsersQuery({ search: search || undefined });

  const [toggleBlockUser, { isLoading: isBlocking }] = useToggleBlockUserMutation();
  const [updateUserRole, { isLoading: isUpdatingRole }] = useUpdateUserRoleMutation();

  const stats = statsData?.data || {
    totalUsers: 0,
    totalCoaches: 0,
    totalSessions: 0,
    completedSessions: 0,
    totalMessages: 0,

    totalGames: 0
  };

  const users = usersData?.data || [];

  const handleToggleBlock = async (id, currentBlocked) => {
    try {
      const res = await toggleBlockUser({ id, isBlocked: !currentBlocked }).unwrap();
      showSuccess(res?.message || (currentBlocked ? 'User unblocked successfully' : 'User suspended successfully'));
    } catch (err) {
      showError(err?.data?.message || 'Failed to update user status');
    }
  };

  const handleChangeRole = async (id, currentRole) => {
    const newRole = currentRole === 'USER' ? 'COACH' : currentRole === 'COACH' ? 'ADMIN' : 'USER';
    try {
      const res = await updateUserRole({ id, role: newRole }).unwrap();
      showSuccess(res?.message || `User role elevated to ${newRole}`);
    } catch (err) {
      showError(err?.data?.message || 'Failed to update user role');
    }
  };

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: { xs: 2, md: 4 } }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton component={Link} href="/home" sx={{ color: '#fff' }}>
              <ArrowLeft size={22} />
            </IconButton>
            <Box>
              <Typography variant="overline" sx={{ color: '#ec4899', fontWeight: 800, letterSpacing: '0.15em' }}>
                ADMIN CONTROL CENTER
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 900 }}>
                PLATFORM ANALYTICS & USERS
              </Typography>
            </Box>
          </Stack>
        </Stack>

        {/* Analytics Cards */}
        {isStatsLoading ? (
          <LoadingSpinner message="Loading analytics..." size={32} />
        ) : (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[
              { label: 'Total Users', val: stats.totalUsers, icon: Users, color: '#00f0ff' },
              { label: 'Verified Coaches', val: stats.totalCoaches, icon: Shield, color: '#8b5cf6' },
              { label: 'Coaching Sessions', val: stats.totalSessions, icon: Tv, color: '#ec4899' },
              { label: 'Completed Sessions', val: stats.completedSessions, icon: Tv, color: '#10b981' },
              { label: 'Messages Sent', val: stats.totalMessages, icon: MessageSquare, color: '#f59e0b' },
              { label: 'Active Games', val: stats.totalGames, icon: Gamepad2, color: '#06b6d4' }
            ].map((metric, idx) => {
              const Icon = metric.icon;
              return (
                <Grid item xs={12} sm={6} md={2} key={idx}>
                  <Card sx={{ p: 2.5, bgcolor: 'background.card', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                        {metric.label}
                      </Typography>
                      <Icon size={18} color={metric.color} />
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: metric.color }}>
                      {metric.val}
                    </Typography>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Users Management */}
        <Card sx={{ p: 3, bgcolor: 'background.paper' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }} spacing={2}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              USER MANAGEMENT
            </Typography>
            <TextField
              size="small"
              placeholder="Search user by username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: { xs: '100%', sm: 320 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} color="#94a3b8" />
                  </InputAdornment>
                )
              }}
            />
          </Stack>

          {isUsersLoading ? (
            <LoadingSpinner message="Loading users..." size={32} />
          ) : (
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ '& th': { color: 'primary.main', fontWeight: 800 } }}>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                      <TableCell sx={{ fontWeight: 700, color: '#fff' }}>{u.username}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{u.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.role}
                          size="small"
                          color={u.role === 'ADMIN' ? 'error' : u.role === 'COACH' ? 'secondary' : 'default'}
                          sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.is_blocked ? 'SUSPENDED' : 'ACTIVE'}
                          size="small"
                          sx={{
                            bgcolor: u.is_blocked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            color: u.is_blocked ? '#ef4444' : '#10b981',
                            fontWeight: 800,
                            fontSize: '0.7rem'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={isUpdatingRole}
                            onClick={() => handleChangeRole(u.id, u.role)}
                            sx={{ fontSize: '0.75rem' }}
                          >
                            Change Role
                          </Button>
                          <IconButton
                            onClick={() => handleToggleBlock(u.id, u.is_blocked)}
                            disabled={isBlocking}
                            size="small"
                            sx={{ color: u.is_blocked ? '#10b981' : '#ef4444' }}
                            title={u.is_blocked ? 'Unblock User' : 'Block User'}
                          >
                            {u.is_blocked ? <Unlock size={16} /> : <Lock size={16} />}
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Box>
    </Box>
    </AuthGuard>
  );
}
