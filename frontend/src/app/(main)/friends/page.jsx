'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Grid,
  Chip,
  Stack,
  Tabs,
  Tab,
  IconButton,
  Paper,
  Alert
} from '@mui/material';
import {
  Users,
  UserPlus,
  Check,
  X,
  MessageSquare,
  UserX,
  Clock
} from 'lucide-react';
import {
  useGetFriendsQuery,
  useGetFriendRequestsQuery,
  useAcceptFriendRequestMutation,
  useRejectFriendRequestMutation,
  useCancelFriendRequestMutation,
  useRemoveFriendMutation
} from '@/store/api/friendApi';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import useToast from '@/components/common/useToast';

export default function FriendsPage() {
  const [tabIndex, setTabIndex] = useState(0);
  const { showSuccess, showError, showInfo } = useToast();

  const { data: friendsData, isLoading: isFriendsLoading } = useGetFriendsQuery();
  const { data: requestsData, isLoading: isRequestsLoading } = useGetFriendRequestsQuery();

  const [acceptRequest, { isLoading: isAccepting }] = useAcceptFriendRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectFriendRequestMutation();
  const [cancelRequest, { isLoading: isCancelling }] = useCancelFriendRequestMutation();
  const [removeFriend, { isLoading: isRemoving }] = useRemoveFriendMutation();

  const [actionInProgressId, setActionInProgressId] = useState(null);

  const friends = friendsData?.data || [];
  const incomingRequests = requestsData?.data?.incoming || [];
  const outgoingRequests = requestsData?.data?.outgoing || [];

  const handleAccept = async (id) => {
    setActionInProgressId(id);
    try {
      const res = await acceptRequest(id).unwrap();
      showSuccess(res?.message || 'Friend request accepted!');
    } catch (err) {
      showError(err?.data?.message || 'Failed to accept friend request.');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleReject = async (id) => {
    setActionInProgressId(id);
    try {
      const res = await rejectRequest(id).unwrap();
      showInfo(res?.message || 'Friend request rejected.');
    } catch (err) {
      showError(err?.data?.message || 'Failed to reject friend request.');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleCancel = async (id) => {
    setActionInProgressId(id);
    try {
      const res = await cancelRequest(id).unwrap();
      showSuccess(res?.message || 'Friend request un-sent successfully.');
    } catch (err) {
      showError(err?.data?.message || 'Failed to cancel friend request.');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleRemove = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    setActionInProgressId(friendId);
    try {
      const res = await removeFriend(friendId).unwrap();
      showInfo(res?.message || 'Friend removed.');
    } catch (err) {
      showError(err?.data?.message || 'Failed to remove friend.');
    } finally {
      setActionInProgressId(null);
    }
  };


  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '0.15em' }}>
          YOUR GAMING NETWORK
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 900, mt: 0.5, mb: 1 }}>
          FRIENDS & SQUAD
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Connect with gamers, organize teams, and hop on voice / chat
        </Typography>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(e, val) => setTabIndex(val)}
          sx={{
            px: 2,
            '& .MuiTab-root': {
              fontWeight: 700,
              minHeight: 52,
              '&.Mui-selected': { color: 'primary.main' }
            }
          }}
        >
          <Tab label={`All Friends (${friends.length})`} />
          <Tab label={`Incoming Requests (${incomingRequests.length})`} />
          <Tab label={`Sent Requests (${outgoingRequests.length})`} />
        </Tabs>
      </Card>

      {/* Tab 0: Friends List */}
      {tabIndex === 0 && (
        <>
          {isFriendsLoading ? (
            <LoadingSpinner message="Loading your squad..." />
          ) : friends.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: 'center', bgcolor: 'background.card' }}>
              <Users size={48} color="currentColor" style={{ marginBottom: 16, opacity: 0.6 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                No friends yet
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Discover gamers, send friend requests, and grow your squad!
              </Typography>
              <Button component={Link} href="/discover" variant="contained" color="primary">
                Find Gamers
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {friends.map((f) => (
                <Grid item xs={12} sm={6} key={f.id}>
                  <Card sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar src={f.avatar_url} sx={{ width: 48, height: 48, border: '2px solid', borderColor: 'primary.main' }} />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                          {f.username}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                          {f.role} • {f.experience_level}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                      <IconButton component={Link} href={`/chat?recipient=${f.id}`} size="small" sx={{ color: 'primary.main' }} title="Send message">
                        <MessageSquare size={18} />
                      </IconButton>
                      <IconButton
                        onClick={() => handleRemove(f.id)}
                        disabled={actionInProgressId === f.id || isRemoving}
                        size="small"
                        sx={{ color: 'error.main' }}
                        title="Remove friend"
                      >
                        <UserX size={18} />
                      </IconButton>
                    </Stack>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Tab 1: Incoming Requests */}
      {tabIndex === 1 && (
        <Stack spacing={2}>
          {incomingRequests.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.card' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No pending incoming requests.
              </Typography>
            </Paper>
          ) : (
            incomingRequests.map((req) => (
              <Card key={req.id} sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar src={req.avatar_url} sx={{ width: 44, height: 44 }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {req.username}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Sent a friend request
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1.5}>
                  <Button
                    onClick={() => handleAccept(req.id)}
                    disabled={actionInProgressId === req.id || isAccepting}
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<Check size={16} />}
                  >
                    {actionInProgressId === req.id && isAccepting ? 'Accepting...' : 'Accept'}
                  </Button>
                  <Button
                    onClick={() => handleReject(req.id)}
                    disabled={actionInProgressId === req.id || isRejecting}
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<X size={16} />}
                  >
                    {actionInProgressId === req.id && isRejecting ? 'Declining...' : 'Decline'}
                  </Button>
                </Stack>
              </Card>
            ))
          )}
        </Stack>
      )}

      {/* Tab 2: Outgoing Requests */}
      {tabIndex === 2 && (
        <Stack spacing={2}>
          {outgoingRequests.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.card' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No pending sent requests.
              </Typography>
            </Paper>
          ) : (
            outgoingRequests.map((req) => (
              <Card key={req.id} sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar src={req.avatar_url} sx={{ width: 44, height: 44 }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {req.username}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Request Pending
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  onClick={() => handleCancel(req.id)}
                  disabled={actionInProgressId === req.id || isCancelling}
                  variant="outlined"
                  color="error"
                  size="small"
                >
                  {actionInProgressId === req.id && isCancelling ? 'Cancelling...' : 'Cancel Request'}
                </Button>
              </Card>
            ))
          )}
        </Stack>
      )}
    </Box>
  );
}
