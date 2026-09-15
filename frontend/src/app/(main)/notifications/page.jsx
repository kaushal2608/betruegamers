'use client';

import React from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  IconButton,
  Chip,
  Paper
} from '@mui/material';
import {
  Bell,
  CheckCheck,
  UserPlus,
  Tv,
  MessageSquare,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation
} from '@/store/api/notificationApi';
import {
  useUpdateSessionStatusMutation,
  useGetUserSessionsQuery
} from '@/store/api/coachingApi';
import useToast from '@/components/common/useToast';
import { useDispatch } from 'react-redux';
import { setUnreadNotificationsCount } from '@/store/slices/uiSlice';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();
  const { data: notifData, isLoading } = useGetNotificationsQuery(undefined, {
    refetchOnMountOrArgChange: true
  });
  const { data: userSessionsData } = useGetUserSessionsQuery(undefined, {
    refetchOnMountOrArgChange: true
  });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();
  const [updateSessionStatus, { isLoading: isUpdatingSession }] = useUpdateSessionStatusMutation();
  const [approvedSessionIds, setApprovedSessionIds] = React.useState(new Set());

  const userSessions = userSessionsData?.data || [];

  const handleApproveSession = async (notificationId, sessionId) => {
    try {
      await updateSessionStatus({ sessionId, status: 'ACCEPTED' }).unwrap();
      setApprovedSessionIds((prev) => new Set(prev).add(sessionId));
      markAsRead(notificationId);
      showSuccess('Session request approved! The live coaching arena is now active.');
    } catch (err) {
      showError(err?.data?.message || 'Failed to approve session');
    }
  };

  const notifications = notifData?.data || [];
  const unreadCount = notifData?.unreadCount || 0;

  React.useEffect(() => {
    if (typeof notifData?.unreadCount === 'number') {
      dispatch(setUnreadNotificationsCount(notifData.unreadCount));
    }
  }, [notifData, dispatch]);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
      dispatch(setUnreadNotificationsCount(0));
    } catch (e) {}
  };

  const getIcon = (type) => {
    switch (type) {
      case 'FRIEND_REQUEST':
      case 'FRIEND_ACCEPTED':
        return <UserPlus size={20} color="var(--mui-palette-primary-main, #00f0ff)" />;
      case 'COACHING_REQUEST':
      case 'COACHING_ACCEPTED':
      case 'COACHING_START':
        return <Tv size={20} color="var(--mui-palette-secondary-main, #8b5cf6)" />;
      case 'CHAT_MESSAGE':
        return <MessageSquare size={20} color="#10b981" />;
      default:
        return <Bell size={20} color="currentColor" style={{ opacity: 0.6 }} />;
    }
  };

  return (
    <Box sx={{ maxWidth: 850, mx: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '0.15em' }}>
            ACTIVITY FEED
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, mt: 0.5 }}>
            NOTIFICATIONS {unreadCount > 0 && `(${unreadCount})`}
          </Typography>
        </Box>

        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllRead}
            variant="outlined"
            size="small"
            startIcon={<CheckCheck size={16} />}
            disabled={isMarkingAll}
          >
            Mark All Read
          </Button>
        )}
      </Stack>

      {isLoading ? (
        <LoadingSpinner message="Fetching notifications..." />
      ) : notifications.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', bgcolor: 'background.card' }}>
          <Bell size={48} color="#64748b" style={{ marginBottom: 16 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            You&apos;re all caught up!
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            When you receive friend requests, coaching updates, or mentions, they will appear here.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {notifications.map((n) => (
            <Card
              key={n.id}
              sx={{
                p: 2.5,
                bgcolor: n.is_read ? 'background.paper' : 'action.hover',
                border: '1px solid',
                borderColor: n.is_read ? 'divider' : 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s'
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '8px',
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {getIcon(n.type)}
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    {n.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {n.message}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                    {new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                {n.type === 'FRIEND_REQUEST' && (
                  <Button component={Link} href="/friends" size="small" variant="contained" color="primary">
                    View
                  </Button>
                )}
                {/* Coaching Request notification on Coach's screen */}
                {n.type === 'COACHING_REQUEST' && n.data?.sessionId && (() => {
                  const session = userSessions.find((s) => s.id === n.data.sessionId);
                  const isAlreadyApproved = (session && ['ACCEPTED', 'READY', 'LIVE', 'COMPLETED'].includes(session.status)) || approvedSessionIds.has(n.data.sessionId);

                  return (
                    <>
                      <Button
                        component={Link}
                        href="/sessions"
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        See Details
                      </Button>
                      {isAlreadyApproved ? (
                        <Button
                          component={Link}
                          href={`/coaching/${n.data.sessionId}`}
                          size="small"
                          variant="contained"
                          color="success"
                          sx={{ textTransform: 'none', fontWeight: 800 }}
                        >
                          Join Room
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleApproveSession(n.id, n.data.sessionId)}
                          disabled={isUpdatingSession}
                          size="small"
                          variant="contained"
                          color="primary"
                          sx={{ textTransform: 'none', fontWeight: 800 }}
                        >
                          Approve Session
                        </Button>
                      )}
                    </>
                  );
                })()}

                {/* Coaching Approved notification on Gamer's screen */}
                {n.type === 'COACHING_ACCEPTED' && n.data?.sessionId && (
                  <Button
                    component={Link}
                    href={`/coaching/${n.data.sessionId}`}
                    size="small"
                    variant="contained"
                    color="success"
                    sx={{ textTransform: 'none', fontWeight: 800 }}
                  >
                    Join Session
                  </Button>
                )}

                {n.type === 'COACHING_START' && n.data?.sessionId && (
                  <Button
                    component={Link}
                    href={`/coaching/${n.data.sessionId}`}
                    size="small"
                    variant="contained"
                    color="primary"
                    sx={{ textTransform: 'none', fontWeight: 800 }}
                  >
                    Open Session
                  </Button>
                )}
                {!n.is_read && (
                  <Button onClick={() => markAsRead(n.id)} size="small" sx={{ color: '#94a3b8' }}>
                    Dismiss
                  </Button>
                )}
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
