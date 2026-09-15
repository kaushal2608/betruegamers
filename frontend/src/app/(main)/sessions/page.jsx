'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  IconButton,
  Chip,
  Stack,
  Avatar,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  TextField,
  Alert,
  Tooltip,
  Divider,
  Paper,
  useTheme
} from '@mui/material';
import {
  Calendar,
  Clock,
  Tv,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  Star,
  Gamepad2,
  Play,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
  RefreshCw,
  UserCheck,
  Award
} from 'lucide-react';
import {
  useGetUserSessionsQuery,
  useUpdateSessionStatusMutation,
  useSubmitReviewMutation
} from '@/store/api/coachingApi';
import { socketService } from '@/services/socket.service';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import useToast from '@/components/common/useToast';

export default function SessionsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const { showSuccess, showError, showInfo } = useToast();

  const [activeTab, setActiveTab] = useState(0); // 0 = Upcoming & Active, 1 = Previous Sessions
  const [filterType, setFilterType] = useState('ALL'); // ALL, REQUESTED, ACCEPTED, COMPLETED

  // Review Dialog State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedSessionForReview, setSelectedSessionForReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Fetch user sessions
  const {
    data: sessionsData,
    isLoading,
    isFetching,
    refetch
  } = useGetUserSessionsQuery();

  const [updateSessionStatus, { isLoading: isUpdatingStatus }] = useUpdateSessionStatusMutation();
  const [submitReview] = useSubmitReviewMutation();

  const allSessions = sessionsData?.data || [];

  // Listen for real-time status changes and requests via Socket.IO
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleStatusChanged = (data) => {
      refetch();
    };

    const handleSessionRequested = (data) => {
      refetch();
      showInfo('A new coaching session request has arrived!');
    };

    socket.on('coaching:status_changed', handleStatusChanged);
    socket.on('coaching:session_requested', handleSessionRequested);

    return () => {
      socket.off('coaching:status_changed', handleStatusChanged);
      socket.off('coaching:session_requested', handleSessionRequested);
    };
  }, [refetch, showInfo]);

  // Split sessions into Upcoming/Active vs Previous
  const upcomingSessions = useMemo(() => {
    return allSessions.filter((s) =>
      ['REQUESTED', 'ACCEPTED', 'READY', 'LIVE'].includes(s.status)
    );
  }, [allSessions]);

  const previousSessions = useMemo(() => {
    return allSessions.filter((s) =>
      ['COMPLETED', 'CANCELLED'].includes(s.status)
    );
  }, [allSessions]);

  // Active list based on tab
  const displayedSessions = useMemo(() => {
    const baseList = activeTab === 0 ? upcomingSessions : previousSessions;
    if (filterType === 'ALL') return baseList;
    return baseList.filter((s) => s.status === filterType);
  }, [activeTab, upcomingSessions, previousSessions, filterType]);

  // Handle Coach Approve / Decline Actions
  const handleStatusUpdate = async (sessionId, newStatus) => {
    try {
      await updateSessionStatus({ sessionId, status: newStatus }).unwrap();
      if (newStatus === 'ACCEPTED') {
        showSuccess('Session request approved! Both parties can now open the session room.');
      } else if (newStatus === 'CANCELLED') {
        showInfo('Session request declined.');
      } else if (newStatus === 'COMPLETED') {
        showSuccess('Session marked as completed.');
      }
      refetch();
    } catch (err) {
      showError(err?.data?.message || 'Failed to update session status');
    }
  };

  // Open Review Dialog
  const handleOpenReview = (session) => {
    setSelectedSessionForReview(session);
    setReviewRating(5);
    setReviewComment('');
    setReviewModalOpen(true);
  };

  // Submit Review
  const handleSubmitReview = async () => {
    if (!selectedSessionForReview) return;
    setReviewSubmitting(true);
    try {
      await submitReview({
        sessionId: selectedSessionForReview.id,
        rating: reviewRating,
        reviewText: reviewComment.trim()
      }).unwrap();
      showSuccess('Thank you! Your verified coaching review has been submitted.');
      setReviewModalOpen(false);
      refetch();
    } catch (err) {
      showError(err?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const formatScheduledDate = (isoString) => {
    if (!isoString) return 'Flexible / To be confirmed';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Flexible / To be confirmed';
    return date.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', pb: 6 }}>
      {/* Header Banner */}
      <Box
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          borderRadius: '16px',
          background: isDark
            ? 'linear-gradient(135deg, rgba(14, 21, 37, 0.95) 0%, rgba(20, 15, 38, 0.95) 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(0, 240, 255, 0.15)' : 'rgba(2, 132, 199, 0.25)',
          boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 8px 24px rgba(2, 132, 199, 0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(2, 132, 199, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
              <Tv size={28} color="currentColor" style={{ color: 'var(--mui-palette-primary-main, inherit)' }} />
              <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary' }}>
                Coaching Sessions
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 650 }}>
              Schedule, manage, and join 1-on-1 live coaching arenas with real-time screen sharing and tactical VOD reviews.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Button
              component={Link}
              href="/coaches"
              variant="contained"
              color="primary"
              startIcon={<Shield size={18} />}
              sx={{ fontWeight: 800, textTransform: 'none', px: 2.5 }}
            >
              Book A Coach
            </Button>
            <IconButton
              onClick={() => refetch()}
              sx={{
                bgcolor: 'action.hover',
                color: 'text.primary',
                '&:hover': { bgcolor: 'action.selected', color: 'primary.main' }
              }}
            >
              <RefreshCw size={18} className={isFetching ? 'spin' : ''} />
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      {/* Tabs & Filter Bar */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, v) => {
            setActiveTab(v);
            setFilterType('ALL');
          }}
          sx={{
            '& .MuiTabs-indicator': { bgcolor: 'primary.main', height: 3, borderRadius: '3px' },
            '& .MuiTab-root': {
              fontWeight: 800,
              fontSize: '0.95rem',
              color: 'text.secondary',
              textTransform: 'none',
              px: 3,
              '&.Mui-selected': { color: 'primary.main' }
            }
          }}
        >
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Upcoming & Active</span>
                <Chip
                  label={upcomingSessions.length}
                  size="small"
                  sx={{
                    bgcolor: activeTab === 0 ? 'primary.main' : 'action.selected',
                    color: activeTab === 0 ? 'primary.contrastText' : 'text.secondary',
                    height: 20,
                    fontWeight: 800,
                    fontSize: '0.7rem'
                  }}
                />
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Previous Sessions</span>
                <Chip
                  label={previousSessions.length}
                  size="small"
                  sx={{
                    bgcolor: activeTab === 1 ? 'primary.main' : 'action.selected',
                    color: activeTab === 1 ? 'primary.contrastText' : 'text.secondary',
                    height: 20,
                    fontWeight: 800,
                    fontSize: '0.7rem'
                  }}
                />
              </Stack>
            }
          />
        </Tabs>

        {/* Quick Filter Chips */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {activeTab === 0 ? (
            <>
              <Chip
                label="All Active"
                clickable
                onClick={() => setFilterType('ALL')}
                color={filterType === 'ALL' ? 'primary' : 'default'}
                variant={filterType === 'ALL' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label="Pending Approval"
                clickable
                onClick={() => setFilterType('REQUESTED')}
                color={filterType === 'REQUESTED' ? 'warning' : 'default'}
                variant={filterType === 'REQUESTED' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label="Approved / Ready"
                clickable
                onClick={() => setFilterType('ACCEPTED')}
                color={filterType === 'ACCEPTED' ? 'success' : 'default'}
                variant={filterType === 'ACCEPTED' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700 }}
              />
            </>
          ) : (
            <>
              <Chip
                label="All History"
                clickable
                onClick={() => setFilterType('ALL')}
                color={filterType === 'ALL' ? 'primary' : 'default'}
                variant={filterType === 'ALL' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label="Completed"
                clickable
                onClick={() => setFilterType('COMPLETED')}
                color={filterType === 'COMPLETED' ? 'success' : 'default'}
                variant={filterType === 'COMPLETED' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700 }}
              />


              <Chip
                label="Cancelled"
                clickable
                onClick={() => setFilterType('CANCELLED')}
                color={filterType === 'CANCELLED' ? 'error' : 'default'}
                variant={filterType === 'CANCELLED' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700 }}
              />
            </>
          )}
        </Stack>
      </Stack>

      {/* Sessions Content Grid */}
      {isLoading ? (
        <LoadingSpinner message="Loading your coaching sessions..." />
      ) : displayedSessions.length === 0 ? (
        <Card
          sx={{
            py: 8,
            px: 3,
            textAlign: 'center',
            bgcolor: 'background.paper',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: '16px'
          }}
        >
          <Calendar size={52} color="currentColor" style={{ marginBottom: 16, opacity: 0.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            {activeTab === 0 ? 'No Upcoming Sessions Found' : 'No Previous Session History'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 450, mx: 'auto', mb: 3 }}>
            {activeTab === 0
              ? 'You do not have any active or pending coaching sessions scheduled. Discover verified pro coaches and level up your gameplay!'
              : 'You have not completed any coaching sessions yet. Once your sessions conclude, your tactical history and review records will appear here.'}
          </Typography>
          {activeTab === 0 && (
            <Button
              component={Link}
              href="/coaches"
              variant="contained"
              color="primary"
              startIcon={<Shield size={18} />}
              sx={{ fontWeight: 800 }}
            >
              Explore Coaches
            </Button>
          )}
        </Card>
      ) : (
        <Grid container spacing={3}>
          {displayedSessions.map((session) => {
            const isCoach = user?.id === session.coach_user_id;
            const isGamer = user?.id === session.gamer_id;

            const isApproved = ['ACCEPTED', 'READY', 'LIVE'].includes(session.status);
            const isRequested = session.status === 'REQUESTED';
            const isCompleted = session.status === 'COMPLETED';
            const isCancelled = session.status === 'CANCELLED';

            // Status chip colors and labels
            let statusColor = 'text.secondary';
            let statusBg = 'action.hover';
            let statusLabel = session.status;

            if (isRequested) {
              statusColor = '#f59e0b';
              statusBg = 'rgba(245, 158, 11, 0.15)';
              statusLabel = isCoach ? 'Awaiting Your Approval' : 'Pending Coach Approval';
            } else if (isApproved) {
              statusColor = 'primary.main';
              statusBg = 'action.hover';
              statusLabel = session.status === 'LIVE' ? 'LIVE NOW' : 'Approved / Ready';
            } else if (isCompleted) {
              statusColor = 'success.main';
              statusBg = 'action.hover';
              statusLabel = 'Completed';
            } else if (isCancelled) {
              statusColor = 'error.main';
              statusBg = 'action.hover';
              statusLabel = 'Cancelled';
            }

            return (
              <Grid item xs={12} key={session.id}>
                <Card
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: '16px',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: isApproved ? 'primary.main' : 'divider',
                    boxShadow: (t) => isApproved ? (t.palette.mode === 'dark' ? '0 4px 20px rgba(0, 240, 255, 0.15)' : '0 4px 20px rgba(2, 132, 199, 0.15)') : 'none',
                    transition: 'transform 0.2s, border-color 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Grid container spacing={2.5} alignItems="center">
                    {/* Participant & Game Info */}
                    <Grid item xs={12} md={5}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          src={isCoach ? session.gamer_avatar : session.coach_avatar}
                          alt={isCoach ? session.gamer_username : session.coach_username}
                          sx={{
                            width: 58,
                            height: 58,
                            border: '2px solid',
                            borderColor: isApproved ? 'primary.main' : 'secondary.main'
                          }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, noWrap: true }}>
                              {isCoach ? session.gamer_username : session.coach_username}
                            </Typography>
                            <Chip
                              label={isCoach ? 'GAMER' : 'COACH'}
                              size="small"
                              color={isCoach ? 'primary' : 'secondary'}
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                fontWeight: 800
                              }}
                            />
                          </Stack>

                          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={0.5}>
                            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Gamepad2 size={14} /> {session.game_name || 'Multi-Game'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>•</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Clock size={14} /> {session.duration_minutes || 60} Min
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </Grid>

                    {/* Scheduled Time & Focus Goals */}
                    <Grid item xs={12} md={4}>
                      <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: '10px', border: '1px solid', borderColor: 'divider' }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                          <Calendar size={15} color="var(--mui-palette-primary-main, currentColor)" />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {formatScheduledDate(session.scheduled_at)}
                          </Typography>
                        </Stack>
                        {session.goals ? (
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            <strong>Focus:</strong> {session.goals}
                          </Typography>
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                            No specific goals noted.
                          </Typography>
                        )}
                      </Box>
                    </Grid>

                    {/* Status & Interactive Actions */}
                    <Grid item xs={12} md={3} sx={{ textAlign: { md: 'right' } }}>
                      <Stack direction="column" spacing={1.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                        {/* Status Chip */}
                        <Chip
                          label={statusLabel}
                          size="small"
                          sx={{
                            bgcolor: statusBg,
                            color: statusColor,
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                            border: `1px solid ${statusColor}`
                          }}
                        />

                        {/* 1. If APPROVED / READY / LIVE: Open Session Button is available */}
                        {isApproved && (
                          <Stack direction="row" spacing={1}>
                            <Button
                              component={Link}
                              href={`/coaching/${session.id}`}
                              variant="contained"
                              color="primary"
                              startIcon={<Tv size={16} />}
                              sx={{
                                fontWeight: 800,
                                textTransform: 'none',
                                px: 2,
                                py: 0.8,
                                boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)',
                                '&:hover': {
                                  boxShadow: '0 0 25px rgba(0, 240, 255, 0.7)'
                                }
                              }}
                            >
                              Open Session
                            </Button>

                            {/* Coach can mark session completed */}
                            {isCoach && (
                              <Tooltip title="Mark coaching session completed">
                                <IconButton
                                  size="small"
                                  onClick={() => handleStatusUpdate(session.id, 'COMPLETED')}
                                  sx={{
                                    bgcolor: 'action.hover',
                                    color: 'success.main',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    '&:hover': { bgcolor: 'success.main', color: 'success.contrastText' }
                                  }}
                                >
                                  <CheckCircle2 size={16} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        )}

                        {/* 2. If REQUESTED: Actions for Coach vs Gamer */}
                        {isRequested && (
                          <>
                            {isCoach ? (
                              <Stack direction="row" spacing={1}>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  size="small"
                                  startIcon={<CheckCircle2 size={15} />}
                                  disabled={isUpdatingStatus}
                                  onClick={() => handleStatusUpdate(session.id, 'ACCEPTED')}
                                  sx={{ fontWeight: 800, textTransform: 'none' }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<XCircle size={15} />}
                                  disabled={isUpdatingStatus}
                                  onClick={() => handleStatusUpdate(session.id, 'CANCELLED')}
                                  sx={{ fontWeight: 700, textTransform: 'none' }}
                                >
                                  Decline
                                </Button>
                              </Stack>
                            ) : (
                              <Typography variant="caption" sx={{ color: '#f59e0b', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Clock size={13} /> Coach will review and approve
                              </Typography>
                            )}
                          </>
                        )}

                        {/* 3. If COMPLETED: "Open Session" is gone! Gamer can leave review */}
                        {isCompleted && (
                          <Stack direction="row" spacing={1} alignItems="center">
                            {isGamer && (
                              <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                startIcon={<Star size={15} />}
                                onClick={() => handleOpenReview(session)}
                                sx={{
                                  borderColor: 'rgba(0, 240, 255, 0.4)',
                                  color: 'primary.main',
                                  fontWeight: 700,
                                  textTransform: 'none'
                                }}
                              >
                                Leave Review
                              </Button>
                            )}
                            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                              Session Finished
                            </Typography>
                          </Stack>
                        )}

                        {/* 4. If CANCELLED: Informative label */}
                        {isCancelled && (
                          <Typography variant="caption" sx={{ color: 'error.main', fontStyle: 'italic' }}>
                            Request Cancelled
                          </Typography>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Review Dialog Modal */}
      <Dialog
        open={reviewModalOpen}
        onClose={() => !reviewSubmitting && setReviewModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '16px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Star size={20} color="var(--mui-palette-primary-main, currentColor)" /> Review Coaching Session
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', my: 2 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
              Rate your experience with <strong>{selectedSessionForReview?.coach_username}</strong>
            </Typography>
            <Rating
              value={reviewRating}
              onChange={(e, val) => setReviewRating(val || 5)}
              size="large"
              sx={{ color: 'primary.main' }}
            />
          </Box>

          <TextField
            label="Your Feedback / Tactical Review"
            multiline
            rows={3}
            fullWidth
            placeholder="Share how the coach helped your game sense, mechanics, or decision making..."
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.card',
                borderRadius: '8px'
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setReviewModalOpen(false)}
            disabled={reviewSubmitting}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitReview}
            disabled={reviewSubmitting}
            sx={{ fontWeight: 800 }}
          >
            {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
