'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  Button,
  IconButton,
  Chip,
  Stack,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  TextField,
  Alert,
  Tooltip,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
  useTheme
} from '@mui/material';
import {
  Tv,
  Mic,
  MicOff,
  ScreenShare,
  StopCircle,
  PhoneOff,
  Maximize2,
  Minimize2,
  Clock,
  Shield,
  Star,
  Users,
  CheckCircle2,
  X,
  Lock,
  Radio,
  MessageSquare,
  Send
} from 'lucide-react';
import {
  useGetSessionByIdQuery,
  useUpdateSessionStatusMutation,
  useSubmitReviewMutation
} from '@/store/api/coachingApi';
import { WebRTCService } from '@/services/webrtc.service';
import { socketService } from '@/services/socket.service';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AuthGuard from '@/components/common/AuthGuard';
import useToast from '@/components/common/useToast';

export default function CoachingSessionRoomPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId || 'live-arena';
  const isLiveArena = sessionId === 'live-arena' || sessionId === 'demo-session';

  const { user: authUser } = useSelector((state) => state.auth);
  const { showSuccess, showError, showInfo } = useToast();

  const { data: sessionData, isLoading: isSessionLoading } = useGetSessionByIdQuery(sessionId, {
    skip: !sessionId || isLiveArena
  });

  const [updateSessionStatus] = useUpdateSessionStatusMutation();
  const [submitReview, { isLoading: isSubmittingReview }] = useSubmitReviewMutation();

  const [webrtc, setWebrtc] = useState(null);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [connectionState, setConnectionState] = useState('connecting');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remoteScreenStream, setRemoteScreenStream] = useState(null);

  // Multi-User Live Arena State
  const [participants, setParticipants] = useState([]);
  const [activePresenter, setActivePresenter] = useState(null);
  const [isParticipantsDrawerOpen, setIsParticipantsDrawerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // In-Session Chat State (1-on-1 Coaching Sessions Only)
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const chatMessagesEndRef = useRef(null);
  const isChatDrawerOpenRef = useRef(false);
  isChatDrawerOpenRef.current = isChatDrawerOpen;

  // Review Dialog State (for booked 1-on-1 coaching sessions)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState({ error: '', success: '' });

  const arenaContainerRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);

  // Session data for booked 1-on-1 coaching fallback
  const session = sessionData?.data || {
    id: sessionId,
    game_name: isLiveArena ? 'Global Arena' : 'Valorant',
    duration_minutes: 60,
    status: 'LIVE',
    goals: isLiveArena ? 'Community Live Gameplay & Screen Share' : 'Aim training & decision making VOD review'
  };

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // WebRTC & Multi-user initialization
  useEffect(() => {
    if (!authUser) return;

    const service = new WebRTCService({
      sessionId,
      currentUser: authUser,
      onRemoteScreenStream: (stream) => {
        setRemoteScreenStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          if (stream) {
            remoteVideoRef.current.play().catch((e) => console.warn('Play video error:', e));
          }
        }
      },
      onConnectionState: (state) => {
        setConnectionState(state);
      },
      onParticipantsUpdate: (updatedList) => {
        setParticipants(updatedList || []);
      },
      onPresenterChange: (presenter) => {
        setActivePresenter(presenter);
        // If someone else stopped or started presenting
        if (!presenter) {
          setIsSharingScreen(false);
          setRemoteScreenStream(null);
          if (localVideoRef.current) localVideoRef.current.srcObject = null;
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        }
      },
      onScreenState: (isSharing) => {
        setIsSharingScreen(isSharing);
      }
    });

    service.initialize().catch(console.error);
    setWebrtc(service);

    return () => {
      service.cleanup();
    };
  }, [sessionId, authUser]);

  // Ensure remote stream is attached to video element when presenter changes or re-renders
  useEffect(() => {
    if (remoteVideoRef.current && remoteScreenStream) {
      remoteVideoRef.current.srcObject = remoteScreenStream;
      remoteVideoRef.current.play().catch((e) => console.warn('Play remote video error:', e));
    }
  }, [remoteScreenStream, activePresenter]);

  // In-Session Chat Socket Listener (1-on-1 Coaching Only)
  useEffect(() => {
    if (isLiveArena) return;

    const handleNewChatMessage = (msg) => {
      if (!msg) return;
      setChatMessages((prev) => [...prev, msg]);
      if (!isChatDrawerOpenRef.current && msg.sender?.id !== authUser?.id) {
        setUnreadChatCount((prev) => prev + 1);
      }
    };

    socketService.on('webrtc:chat_message', handleNewChatMessage);
    return () => {
      socketService.off('webrtc:chat_message', handleNewChatMessage);
    };
  }, [isLiveArena, authUser]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (isChatDrawerOpen && chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatDrawerOpen]);

  const handleApproveSession = async () => {
    try {
      await updateSessionStatus({ sessionId, status: 'ACCEPTED' }).unwrap();
      showSuccess('Session request approved! Both parties can now start the coaching session.');
    } catch (err) {
      showError(err?.data?.message || 'Failed to approve session');
    }
  };

  const handleToggleScreenShare = async () => {
    if (!webrtc) return;

    if (isSharingScreen) {
      webrtc.stopScreenShare();
      setIsSharingScreen(false);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      showInfo('You stopped screen sharing.');
    } else {
      // Check if someone else is already sharing
      const myPeerId = socketService.getSocket()?.id;
      if (activePresenter && activePresenter.socketId !== myPeerId) {
        showError(`${activePresenter.user?.username || 'Another participant'} is already sharing their screen.`);
        return;
      }

      try {
        const stream = await webrtc.startScreenShare();
        setIsSharingScreen(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        showSuccess('You are now sharing your screen to everyone in the arena!');
      } catch (err) {
        if (err?.name !== 'NotAllowedError') {
          showError(err?.message || 'Failed to start screen share.');
        }
      }
    }
  };

  const handleToggleMic = async () => {
    if (!webrtc) return;
    const nextMuteState = !isMicMuted;

    if (!nextMuteState) {
      try {
        await webrtc.toggleMicrophone(true);
        setIsMicMuted(false);
        showSuccess('Microphone unmuted.');
      } catch (err) {
        setIsMicMuted(true);
        const msg = err?.message || 'Could not access microphone.';
        showError(msg);
      }
    } else {
      try {
        await webrtc.toggleMicrophone(false);
        setIsMicMuted(true);
        showInfo('Microphone muted.');
      } catch (err) {
        console.warn('Error muting mic:', err);
        setIsMicMuted(true);
      }
    }
  };

  const handleToggleFullscreen = () => {
    if (!arenaContainerRef.current) return;
    if (!document.fullscreenElement) {
      arenaContainerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  const isCoach = Boolean(
    sessionData?.data?.coach_user_id === authUser?.id ||
    sessionData?.data?.coach?.userId === authUser?.id ||
    authUser?.role === 'COACH'
  );
  const isGamer = Boolean(
    sessionData?.data?.gamer_id === authUser?.id ||
    (!isCoach && sessionData?.data?.gamer?.id === authUser?.id) ||
    authUser?.role === 'GAMER'
  );

  const handleToggleChatDrawer = () => {
    setIsChatDrawerOpen((prev) => {
      if (!prev) setIsParticipantsDrawerOpen(false);
      return !prev;
    });
    setUnreadChatCount(0);
  };

  const handleToggleParticipantsDrawer = () => {
    setIsParticipantsDrawerOpen((prev) => {
      if (!prev) setIsChatDrawerOpen(false);
      return !prev;
    });
  };

  const handleSendChatMessage = (e) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim() || !sessionId) return;
    socketService.sendSessionChatMessage(sessionId, chatInputText.trim());
    setChatInputText('');
  };

  const handleEndSession = async () => {
    if (!isLiveArena) {
      try {
        await updateSessionStatus({ sessionId, status: 'COMPLETED' }).unwrap();
      } catch (e) {
        console.error(e);
      }
      // ONLY the gamer who booked this session can submit a review
      if (isGamer && !isCoach) {
        setReviewDialogOpen(true);
      } else {
        showSuccess('Coaching session completed.');
        router.push('/sessions');
      }
    } else {
      router.push('/home');
    }
  };

  const handleSaveReview = async () => {
    setReviewFeedback({ error: '', success: '' });
    try {
      if (!isLiveArena) {
        await submitReview({
          sessionId,
          rating,
          reviewText: reviewText.trim()
        }).unwrap();
      }
      showSuccess('Thank you! Your verified review has been published.');
      setReviewFeedback({ success: 'Thank you! Your verified review has been published.', error: '' });
      setTimeout(() => {
        setReviewDialogOpen(false);
        router.push('/sessions');
      }, 1500);
    } catch (err) {
      showError(err?.data?.message || 'Failed to submit review');
      setReviewFeedback({ error: err?.data?.message || 'Failed to submit review', success: '' });
    }
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const myPeerId = socketService.getSocket()?.id;
  const isSomeoneElsePresenting = Boolean(
    activePresenter &&
    activePresenter.socketId !== myPeerId &&
    (!authUser?.id || activePresenter.user?.id !== authUser.id)
  );
  const isMePresenting = Boolean(isSharingScreen);

  // Merge current user with socket participants if not present
  const allDisplayParticipants = (() => {
    const list = [...participants];
    const hasMe = list.some((p) => p.user?.id === authUser?.id || p.peerId === myPeerId);
    if (!hasMe && authUser) {
      list.unshift({
        peerId: myPeerId || 'self',
        user: authUser,
        isSharingScreen: isSharingScreen,
        isMicMuted: isMicMuted
      });
    }
    return list;
  })();

  const isSessionPending = !isLiveArena && sessionData?.data?.status === 'REQUESTED';

  if (isSessionPending) {
    return (
      <AuthGuard>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
          <Card sx={{ maxWidth: 540, p: 4, textAlign: 'center', borderRadius: '20px', bgcolor: 'background.paper', border: '1px solid', borderColor: isDark ? 'rgba(0, 240, 255, 0.3)' : 'divider', boxShadow: isDark ? '0 0 35px rgba(0, 240, 255, 0.15)' : '0 10px 30px rgba(0, 0, 0, 0.06)' }}>
            <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: isDark ? 'rgba(0, 240, 255, 0.1)' : 'rgba(2, 132, 199, 0.1)', border: '2px solid', borderColor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
              <Clock size={40} color={isDark ? "#00f0ff" : "#0284c7"} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
              {isCoach ? 'Coaching Session Request Pending' : 'Waiting for Coach Approval'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3.5, lineHeight: 1.6 }}>
              {isCoach
                ? `${sessionData?.data?.gamer_username || 'A gamer'} has requested this ${sessionData?.data?.duration_minutes || 60}-minute coaching session for ${sessionData?.data?.game_name || 'gameplay'}. Please approve the request to start the live coaching arena.`
                : `Your session request has been submitted to Coach ${sessionData?.data?.coach_username || ''}. Please wait for the coach to approve your request. Once approved, you can enter the live arena!`
              }
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button component={Link} href="/sessions" variant="outlined" sx={{ fontWeight: 700, borderRadius: '20px', px: 3 }}>
                Back to Sessions
              </Button>
              {isCoach && (
                <Button
                  onClick={handleApproveSession}
                  variant="contained"
                  color="primary"
                  sx={{ fontWeight: 800, borderRadius: '20px', px: 3.5 }}
                >
                  Approve Session Now
                </Button>
              )}
            </Stack>
          </Card>
        </Box>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <Box
        ref={arenaContainerRef}
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          color: 'text.primary',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Top Header Bar */}
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 1.5,
            bgcolor: isDark ? 'rgba(10, 14, 23, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '0.04em', color: 'text.primary' }}>
              BE<span style={{ color: isDark ? '#00f0ff' : '#0284c7' }}>TRUE</span>GAMERS
            </Typography>
            <Divider orientation="vertical" flexItem sx={{ borderColor: 'divider' }} />
            <Chip
              icon={<Radio size={14} color="#10b981" />}
              label={isLiveArena ? 'LIVE ARENA 🟢' : 'SESSION: LIVE 🟢'}
              size="small"
              sx={{
                bgcolor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontWeight: 800,
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            />
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', display: { xs: 'none', md: 'block' } }}>
              {session.game_name} • Live Coaching Session
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Live Session Timer */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                bgcolor: isDark ? 'rgba(0, 240, 255, 0.08)' : 'rgba(2, 132, 199, 0.08)',
                px: 2,
                py: 0.6,
                borderRadius: '20px',
                border: '1px solid',
                borderColor: isDark ? 'rgba(0, 240, 255, 0.2)' : 'rgba(2, 132, 199, 0.25)'
              }}
            >
              <Clock size={16} color={isDark ? "#00f0ff" : "#0284c7"} />
              <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace', color: 'primary.main' }}>
                {formatTimer(elapsedSeconds)}
              </Typography>
            </Stack>

            {/* In-Session 1-on-1 Chat Button (Hidden in Live Arena) */}
            {!isLiveArena && (
              <Tooltip title={isChatDrawerOpen ? 'Close Chat' : 'Open In-Session Chat'}>
                <Button
                  onClick={handleToggleChatDrawer}
                  variant="outlined"
                  size="small"
                  startIcon={
                    <Badge badgeContent={unreadChatCount} color="error">
                      <MessageSquare size={16} />
                    </Badge>
                  }
                  sx={{
                    borderColor: isChatDrawerOpen ? 'primary.main' : 'divider',
                    bgcolor: isChatDrawerOpen ? (isDark ? 'rgba(0, 240, 255, 0.1)' : 'rgba(2, 132, 199, 0.1)') : 'transparent',
                    color: isChatDrawerOpen ? 'primary.main' : 'text.primary',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: '20px',
                    px: 2
                  }}
                >
                  Chat
                </Button>
              </Tooltip>
            )}

            {/* Google Meet-Style Participants Toggle */}
            <Tooltip title="View Participants">
              <Button
                onClick={handleToggleParticipantsDrawer}
                variant="outlined"
                size="small"
                startIcon={<Users size={16} />}
                sx={{
                  borderColor: isParticipantsDrawerOpen ? 'primary.main' : 'divider',
                  bgcolor: isParticipantsDrawerOpen ? (isDark ? 'rgba(0, 240, 255, 0.1)' : 'rgba(2, 132, 199, 0.1)') : 'transparent',
                  color: isParticipantsDrawerOpen ? 'primary.main' : 'text.primary',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: '20px',
                  px: 2
                }}
              >
                People ({allDisplayParticipants.length})
              </Button>
            </Tooltip>

            {/* End / Leave Session */}
            <Button
              onClick={handleEndSession}
              variant="contained"
              color="error"
              size="small"
              startIcon={<PhoneOff size={16} />}
              sx={{ fontWeight: 700, borderRadius: '20px' }}
            >
              {isLiveArena ? 'Leave Arena' : 'End Session'}
            </Button>
          </Stack>
        </Box>

        {/* Main Stage & Right Panel Layout */}
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* Main Stage View */}
          <Box
            sx={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: { xs: 1, md: 2.5 },
              overflow: 'hidden',
              bgcolor: isDark ? '#06080d' : '#f8fafc'
            }}
          >
            {/* Screen Share Stage Container */}
            <Box
              sx={{
                width: '100%',
                height: '100%',
                maxHeight: 'calc(100vh - 150px)',
                bgcolor: isDark ? '#0a0d14' : '#ffffff',
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid',
                borderColor: isDark ? 'rgba(0, 240, 255, 0.25)' : 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isDark ? '0 12px 40px rgba(0, 0, 0, 0.8)' : '0 12px 30px rgba(0, 0, 0, 0.06)'
              }}
            >
              {/* Remote Screen Share Video (when peer is sharing) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: isSomeoneElsePresenting ? 'block' : 'none'
                }}
              />

              {/* Local Screen Share Preview (when current user is sharing) */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: isMePresenting ? 'block' : 'none'
                }}
              />

              {/* Empty Stage Placeholder when no one is sharing */}
              {!isMePresenting && !isSomeoneElsePresenting && (
                <Box sx={{ textAlign: 'center', p: 4, maxWidth: 540 }}>
                  <Box
                    sx={{
                      width: 86,
                      height: 86,
                      borderRadius: '50%',
                      bgcolor: isDark ? 'rgba(0, 240, 255, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                      border: '2px solid',
                      borderColor: isDark ? 'rgba(0, 240, 255, 0.4)' : 'rgba(2, 132, 199, 0.3)',
                      boxShadow: isDark ? '0 0 30px rgba(0, 240, 255, 0.2)' : '0 4px 15px rgba(2, 132, 199, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3
                    }}
                  >
                    <Tv size={44} color={isDark ? "#00f0ff" : "#0284c7"} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, mb: 1.5, letterSpacing: '-0.02em', color: 'text.primary' }}>
                    Live Screen Stage
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3.5, lineHeight: 1.6 }}>
                    No one is sharing their screen right now. Click below to share your gameplay in real-time with high-definition video and audio!
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<ScreenShare size={20} />}
                    onClick={handleToggleScreenShare}
                    sx={{
                      py: 1.6,
                      px: 4.5,
                      fontWeight: 800,
                      borderRadius: '28px',
                      boxShadow: isDark ? '0 0 25px rgba(0, 240, 255, 0.4)' : '0 4px 15px rgba(2, 132, 199, 0.3)'
                    }}
                  >
                    Start Screen Share
                  </Button>
                </Box>
              )}

              {/* Top Presenter Badge Overlay on Screen */}
              {activePresenter && (isSomeoneElsePresenting || isMePresenting) && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    bgcolor: isDark ? 'rgba(10, 14, 23, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(10px)',
                    px: 2,
                    py: 1,
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(0, 240, 255, 0.35)' : 'rgba(2, 132, 199, 0.35)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5
                  }}
                >
                  <Avatar
                    src={activePresenter.user?.avatar_url}
                    sx={{ width: 30, height: 30, border: '2px solid', borderColor: 'primary.main' }}
                  />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                      {isMePresenting ? 'You are presenting' : `${activePresenter.user?.username || 'Participant'} is presenting`}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                      Live 60fps Screen Stream
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          {/* Right-Side Google Meet-Style Participants Panel */}
          {isParticipantsDrawerOpen && (
            <Box
              sx={{
                width: { xs: '100%', sm: 340 },
                maxWidth: '100%',
                bgcolor: 'background.paper',
                borderLeft: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                zIndex: 20
              }}
            >
              {/* Panel Header */}
              <Box
                sx={{
                  p: 2.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', color: 'text.primary' }}>
                    People ({allDisplayParticipants.length})
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    In this Live Arena room
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setIsParticipantsDrawerOpen(false)}
                  size="small"
                  sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                >
                  <X size={18} />
                </IconButton>
              </Box>

              {/* Participants List */}
              <List sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
                {allDisplayParticipants.map((p, idx) => {
                  const isSelf = p.user?.id === authUser?.id || p.peerId === myPeerId;
                  const isPresentingThisUser = activePresenter?.socketId === p.peerId || (isSelf && isSharingScreen);

                  return (
                    <ListItem
                      key={p.peerId || idx}
                      sx={{
                        mb: 1,
                        p: 1.5,
                        borderRadius: '12px',
                        bgcolor: isPresentingThisUser
                          ? (isDark ? 'rgba(0, 240, 255, 0.08)' : 'rgba(2, 132, 199, 0.08)')
                          : (isDark ? 'rgba(255, 255, 255, 0.03)' : 'action.hover'),
                        border: '1px solid',
                        borderColor: isPresentingThisUser
                          ? (isDark ? 'rgba(0, 240, 255, 0.3)' : 'rgba(2, 132, 199, 0.3)')
                          : 'divider',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          variant="dot"
                          sx={{
                            '& .MuiBadge-badge': {
                              bgcolor: '#10b981',
                              boxShadow: '0 0 8px #10b981'
                            }
                          }}
                        >
                          <Avatar
                            src={p.user?.avatar_url}
                            alt={p.user?.username}
                            sx={{ width: 40, height: 40, border: '2px solid', borderColor: isPresentingThisUser ? 'primary.main' : 'divider' }}
                          >
                            {p.user?.username?.[0]?.toUpperCase() || 'G'}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                              {p.user?.username || 'Gamer'}
                            </Typography>
                            {isSelf && (
                              <Chip
                                label="YOU"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.65rem',
                                  bgcolor: isDark ? 'rgba(0, 240, 255, 0.2)' : 'rgba(2, 132, 199, 0.15)',
                                  color: 'primary.main',
                                  fontWeight: 800
                                }}
                              />
                            )}
                          </Stack>
                        }
                        secondary={
                          <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 0.5 }}>
                            {isPresentingThisUser && (
                              <Chip
                                icon={<ScreenShare size={12} color={isDark ? "#00f0ff" : "#0284c7"} />}
                                label="Sharing Screen"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.68rem',
                                  bgcolor: isDark ? 'rgba(0, 240, 255, 0.15)' : 'rgba(2, 132, 199, 0.12)',
                                  color: 'primary.main',
                                  fontWeight: 700
                                }}
                              />
                            )}
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {p.user?.role || 'Gamer'}
                            </Typography>
                          </Stack>
                        }
                      />

                      {/* Mic Status Indicator */}
                      <Box sx={{ ml: 1 }}>
                        {p.isMicMuted ? (
                          <Tooltip title="Microphone is muted">
                            <Box sx={{ p: 0.8, borderRadius: '50%', bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                              <MicOff size={16} />
                            </Box>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Microphone is unmuted">
                            <Box sx={{ p: 0.8, borderRadius: '50%', bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }}>
                              <Mic size={16} />
                            </Box>
                          </Tooltip>
                        )}
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}

          {/* Right-Side 1-on-1 In-Session Chat Drawer (Only for 1-on-1 Coaching, Not in Live Arena) */}
          {!isLiveArena && isChatDrawerOpen && (
            <Box
              sx={{
                width: { xs: '100%', sm: 360 },
                maxWidth: '100%',
                bgcolor: 'background.paper',
                borderLeft: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                zIndex: 20
              }}
            >
              {/* Chat Header */}
              <Box
                sx={{
                  p: 2,
                  px: 2.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: 'text.primary' }}>
                    Session Chat
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Live messages with {isCoach ? 'Gamer' : 'Coach'}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setIsChatDrawerOpen(false)}
                  size="small"
                  sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                >
                  <X size={18} />
                </IconButton>
              </Box>

              {/* Chat Messages Body */}
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.8,
                  bgcolor: isDark ? '#080a0f' : '#f8fafc'
                }}
              >
                {chatMessages.length === 0 ? (
                  <Box sx={{ textAlign: 'center', my: 'auto', py: 6, px: 2 }}>
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        bgcolor: isDark ? 'rgba(0, 240, 255, 0.08)' : 'rgba(2, 132, 199, 0.1)',
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(0, 240, 255, 0.2)' : 'rgba(2, 132, 199, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        color: 'primary.main'
                      }}
                    >
                      <MessageSquare size={24} />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                      No messages yet
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', maxWidth: 220, mx: 'auto' }}>
                      Coordinate game tactics, share links, or give feedback in real time!
                    </Typography>
                  </Box>
                ) : (
                  chatMessages.map((msg) => {
                    const isSelf = msg.sender?.id === authUser?.id;
                    const formattedTime = new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <Box
                        key={msg.id}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isSelf ? 'flex-end' : 'flex-start'
                        }}
                      >
                        {!isSelf && (
                          <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.5, pl: 0.5 }}>
                            <Avatar
                              src={msg.sender?.avatar_url}
                              sx={{ width: 20, height: 20, border: '1px solid', borderColor: 'primary.main' }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {msg.sender?.username}
                            </Typography>
                            <Chip
                              label={msg.sender?.role === 'COACH' ? 'COACH' : 'GAMER'}
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: '0.6rem',
                                bgcolor: msg.sender?.role === 'COACH' ? 'rgba(255, 0, 85, 0.15)' : 'rgba(2, 132, 199, 0.15)',
                                color: msg.sender?.role === 'COACH' ? '#ff0055' : 'primary.main',
                                fontWeight: 800
                              }}
                            />
                          </Stack>
                        )}
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: isSelf ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                            bgcolor: isSelf
                              ? (isDark ? 'rgba(0, 240, 255, 0.15)' : 'primary.main')
                              : (isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff'),
                            border: '1px solid',
                            borderColor: isSelf
                              ? (isDark ? 'rgba(0, 240, 255, 0.35)' : 'primary.main')
                              : 'divider',
                            maxWidth: '85%',
                            wordBreak: 'break-word',
                            boxShadow: isSelf
                              ? (isDark ? '0 2px 10px rgba(0, 240, 255, 0.15)' : '0 2px 8px rgba(2, 132, 199, 0.25)')
                              : '0 1px 4px rgba(0,0,0,0.05)'
                          }}
                        >
                          <Typography variant="body2" sx={{ color: isSelf && !isDark ? '#ffffff' : 'text.primary', fontSize: '0.88rem', lineHeight: 1.45 }}>
                            {msg.text}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', mt: 0.4, px: 0.5 }}>
                          {formattedTime}
                        </Typography>
                      </Box>
                    );
                  })
                )}
                <div ref={chatMessagesEndRef} />
              </Box>

              {/* Chat Input Bar */}
              <Box
                component="form"
                onSubmit={handleSendChatMessage}
                sx={{
                  p: 2,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: 'background.paper'
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message..."
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                  autoComplete="off"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'background.default',
                      borderRadius: '20px',
                      fontSize: '0.88rem',
                      '& fieldset': {
                        borderColor: 'divider'
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main'
                      }
                    }
                  }}
                />
                <IconButton
                  type="submit"
                  disabled={!chatInputText.trim()}
                  sx={{
                    bgcolor: chatInputText.trim() ? 'primary.main' : 'action.hover',
                    color: chatInputText.trim() ? '#ffffff' : 'text.disabled',
                    p: 1.2,
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    }
                  }}
                >
                  <Send size={18} />
                </IconButton>
              </Box>
            </Box>
          )}
        </Box>

        {/* Bottom Floating Arena Control Bar */}
        <Box
          sx={{
            py: 2,
            px: 3,
            bgcolor: isDark ? 'rgba(10, 14, 23, 0.96)' : 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 15
          }}
        >
          <Stack direction="row" spacing={{ xs: 1.5, sm: 2.5 }} alignItems="center">
            {/* Mic Toggle Button */}
            <Tooltip title={isMicMuted ? 'Turn On Microphone' : 'Mute Microphone'}>
              <IconButton
                onClick={handleToggleMic}
                sx={{
                  bgcolor: isMicMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: isMicMuted ? '#ef4444' : '#10b981',
                  border: '1px solid',
                  borderColor: isMicMuted ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)',
                  p: 1.6,
                  '&:hover': {
                    bgcolor: isMicMuted ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                  }
                }}
              >
                {isMicMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </IconButton>
            </Tooltip>

            {/* Screen Share Button (Single Presenter Lock) */}
            {isMePresenting ? (
              <Button
                variant="contained"
                color="error"
                startIcon={<StopCircle size={20} />}
                onClick={handleToggleScreenShare}
                sx={{
                  px: 3.5,
                  py: 1.3,
                  fontWeight: 800,
                  borderRadius: '28px',
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
                }}
              >
                Stop Sharing
              </Button>
            ) : isSomeoneElsePresenting ? (
              <Tooltip title={`${activePresenter?.user?.username || 'Another participant'} is currently sharing their screen`}>
                <span>
                  <Button
                    variant="outlined"
                    disabled
                    startIcon={<Lock size={18} />}
                    sx={{
                      px: 3,
                      py: 1.3,
                      fontWeight: 800,
                      borderRadius: '28px',
                      borderColor: 'divider',
                      color: 'text.disabled'
                    }}
                  >
                    {activePresenter?.user?.username || 'Participant'} is Sharing
                  </Button>
                </span>
              </Tooltip>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<ScreenShare size={20} />}
                onClick={handleToggleScreenShare}
                sx={{
                  px: 3.5,
                  py: 1.3,
                  fontWeight: 800,
                  borderRadius: '28px',
                  boxShadow: isDark ? '0 0 20px rgba(0, 240, 255, 0.35)' : '0 4px 15px rgba(2, 132, 199, 0.3)'
                }}
              >
                Share Screen
              </Button>
            )}

            {/* In-Session 1-on-1 Chat Button (Hidden in Live Arena) */}
            {!isLiveArena && (
              <Tooltip title={isChatDrawerOpen ? 'Close Chat' : 'Open In-Session Chat'}>
                <IconButton
                  onClick={handleToggleChatDrawer}
                  sx={{
                    bgcolor: isChatDrawerOpen
                      ? (isDark ? 'rgba(0, 240, 255, 0.2)' : 'rgba(2, 132, 199, 0.15)')
                      : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'action.hover'),
                    color: isChatDrawerOpen ? 'primary.main' : 'text.secondary',
                    border: '1px solid',
                    borderColor: isChatDrawerOpen ? 'primary.main' : 'divider',
                    p: 1.6,
                    '&:hover': { color: 'text.primary' }
                  }}
                >
                  <Badge badgeContent={unreadChatCount} color="error">
                    <MessageSquare size={22} />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}

            {/* Participants Toggle Button */}
            <Tooltip title="Toggle Participants List">
              <IconButton
                onClick={handleToggleParticipantsDrawer}
                sx={{
                  bgcolor: isParticipantsDrawerOpen
                    ? (isDark ? 'rgba(0, 240, 255, 0.2)' : 'rgba(2, 132, 199, 0.15)')
                    : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'action.hover'),
                  color: isParticipantsDrawerOpen ? 'primary.main' : 'text.secondary',
                  border: '1px solid',
                  borderColor: isParticipantsDrawerOpen ? 'primary.main' : 'divider',
                  p: 1.6,
                  '&:hover': { color: 'text.primary' }
                }}
              >
                <Users size={22} />
              </IconButton>
            </Tooltip>

            {/* Fullscreen Toggle */}
            <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
              <IconButton
                onClick={handleToggleFullscreen}
                sx={{
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'action.hover',
                  color: 'text.secondary',
                  p: 1.6,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { color: 'text.primary' }
                }}
              >
                {isFullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
              </IconButton>
            </Tooltip>

            {/* Leave Room Button */}
            <Tooltip title="Leave Arena">
              <IconButton
                onClick={handleEndSession}
                sx={{
                  bgcolor: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  p: 1.6,
                  '&:hover': {
                    bgcolor: 'rgba(239, 68, 68, 0.35)'
                  }
                }}
              >
                <PhoneOff size={22} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Post-Session Review Dialog (Only for formal booked coaching sessions and ONLY for the gamer) */}
        {!isLiveArena && isGamer && !isCoach && (
          <Dialog
            open={reviewDialogOpen}
            onClose={() => setReviewDialogOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: isDark ? 'rgba(0, 240, 255, 0.3)' : 'divider',
                borderRadius: '16px'
              }
            }}
          >
            <DialogTitle sx={{ fontWeight: 800, textAlign: 'center', pt: 3, color: 'text.primary' }}>
              Rate Your Coaching Session
            </DialogTitle>
            <DialogContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                How was your 1-on-1 gameplay review session? Your review helps other players find the best coaches.
              </Typography>

              <Rating
                value={rating}
                onChange={(e, val) => setRating(val || 5)}
                size="large"
                sx={{ mb: 3, color: isDark ? '#00f0ff' : 'primary.main' }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Write feedback about tips, communication, and key learnings..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                sx={{ mb: 2 }}
              />

              {reviewFeedback.error && (
                <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
                  {reviewFeedback.error}
                </Alert>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setReviewDialogOpen(false);
                  router.push('/sessions');
                }}
              >
                Skip
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveReview}
                disabled={isSubmittingReview}
              >
                Submit Verified Review
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </AuthGuard>
  );
}
