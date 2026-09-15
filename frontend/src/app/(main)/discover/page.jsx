'use client';

import React, { useState, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Rating,
  useTheme
} from '@mui/material';
import {
  Search,
  Users,
  Shield,
  MessageSquare,
  UserPlus,
  UserMinus,
  Check,
  Star,
  Gamepad2,
  Trophy,
  Tv
} from 'lucide-react';
import { useGetCoachesQuery } from '@/store/api/coachApi';
import { useGetGamesQuery } from '@/store/api/gameApi';
import { useSearchUsersQuery } from '@/store/api/userApi';
import {
  useSendFriendRequestMutation,
  useCancelFriendRequestMutation,
  useGetFriendRequestsQuery,
  useGetFriendsQuery
} from '@/store/api/friendApi';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import useToast from '@/components/common/useToast';
import { useSelector } from 'react-redux';

const RANKS = ['All Ranks', 'Radiant', 'Immortal', 'Ascendant', 'Global Elite', 'Faceit Lvl 10', 'Master', 'Diamond'];

function DiscoverContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialGame = searchParams.get('game') || '';
  const { showSuccess, showError } = useToast();
  const { user } = useSelector((state) => state.auth);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [roleFilter, setRoleFilter] = useState('ALL'); // ALL, COACHES, PLAYERS
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedGame, setSelectedGame] = useState(initialGame);
  const [selectedRank, setSelectedRank] = useState('All Ranks');

  // Query coaches with search and filters
  const { data: coachesData, isLoading: isCoachesLoading } = useGetCoachesQuery({
    search: searchQuery.trim() || undefined,
    game: selectedGame || undefined,
    rank: selectedRank === 'All Ranks' ? undefined : selectedRank
  }, { refetchOnMountOrArgChange: true });

  // Query users/players with search and filters
  const { data: usersData, isLoading: isUsersLoading } = useSearchUsersQuery({
    search: searchQuery.trim() || undefined,
    game: selectedGame || undefined,
    rank: selectedRank === 'All Ranks' ? undefined : selectedRank,
    role: roleFilter === 'PLAYERS' ? 'USER' : undefined
  }, { refetchOnMountOrArgChange: true });

  const { data: gamesData } = useGetGamesQuery();
  const { data: friendRequestsData } = useGetFriendRequestsQuery();
  const { data: friendsData } = useGetFriendsQuery();

  const [sendFriendRequest, { isLoading: isSending }] = useSendFriendRequestMutation();
  const [cancelFriendRequest, { isLoading: isCancelling }] = useCancelFriendRequestMutation();

  const [actionInProgressUserId, setActionInProgressUserId] = useState(null);

  const games = gamesData?.data || [];
  const friendsList = friendsData?.data || [];
  const outgoingRequests = friendRequestsData?.data?.outgoing || [];

  // Map of target userId -> requestId for sent pending requests
  const outgoingMap = useMemo(() => {
    const map = new Map();
    outgoingRequests.forEach((req) => {
      if (req.receiver_id) map.set(req.receiver_id, req.id);
    });
    return map;
  }, [outgoingRequests]);

  // Set of friend userIds
  const friendsSet = useMemo(() => {
    return new Set(friendsList.map((f) => f.id));
  }, [friendsList]);

  // Normalize coaches and players
  const rawCoaches = useMemo(() => {
    return (coachesData?.data || []).filter((c) => c.user_id !== user?.id);
  }, [coachesData, user?.id]);

  const rawUsers = useMemo(() => {
    return (usersData?.data || []).filter((u) => {
      if (u.id === user?.id) return false;
      // ADMIN should never be visible to non-admins
      if (user?.role !== 'ADMIN' && u.role === 'ADMIN') return false;
      return true;
    });
  }, [usersData, user?.id, user?.role]);

  const coachItems = useMemo(() => {
    return rawCoaches.map((c) => ({
      ...c,
      isCoach: true,
      cardRole: 'COACH',
      user_id: c.user_id,
      linkUrl: `/coaches/${c.id}`,
      viewLabel: 'View Coach'
    }));
  }, [rawCoaches]);

  const playerItems = useMemo(() => {
    const coachUserIds = new Set(rawCoaches.map((c) => c.user_id));
    return rawUsers
      .filter((u) => !coachUserIds.has(u.id) && u.role !== 'COACH')
      .map((u) => ({
        ...u,
        isCoach: false,
        cardRole: u.role === 'ADMIN' ? 'ADMIN' : 'PLAYER',
        user_id: u.id,
        headline: u.headline || `${u.username} • ${u.experience_level || (u.role === 'ADMIN' ? 'Admin' : 'Gamer')}`,
        bio: u.bio || (u.role === 'ADMIN' ? 'Platform Administrator' : 'Competitive gamer on BeTrueGamers.'),
        game_name: u.game_name || 'All Games',
        highest_rank: u.highest_rank || u.experience_level || 'Intermediate',
        linkUrl: `/players/${u.id}`,
        viewLabel: 'View Profile'
      }));
  }, [rawUsers, rawCoaches]);

  // Combined and filtered display items
  const displayItems = useMemo(() => {
    let list = [];
    if (roleFilter === 'COACHES') {
      list = coachItems;
    } else if (roleFilter === 'PLAYERS') {
      list = playerItems;
    } else {
      list = [...coachItems, ...playerItems];
    }

    // Client-side quick filter for real-time instantaneous responsiveness
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter((item) => {
        const username = (item.username || '').toLowerCase();
        const headline = (item.headline || '').toLowerCase();
        const bio = (item.bio || '').toLowerCase();
        const game = (item.game_name || '').toLowerCase();
        const rank = (item.highest_rank || '').toLowerCase();
        const gamesList = (item.games || []).map((g) => (g.game_name || '').toLowerCase()).join(' ');
        return (
          username.includes(q) ||
          headline.includes(q) ||
          bio.includes(q) ||
          game.includes(q) ||
          rank.includes(q) ||
          gamesList.includes(q)
        );
      });
    }

    if (selectedGame) {
      list = list.filter((item) => {
        const matchesMain = (item.game_name || '').toLowerCase() === selectedGame.toLowerCase();
        const matchesGames = (item.games || []).some((g) => (g.game_name || '').toLowerCase() === selectedGame.toLowerCase());
        return matchesMain || matchesGames;
      });
    }

    if (selectedRank && selectedRank !== 'All Ranks') {
      list = list.filter((item) => {
        const matchesMain = (item.highest_rank || '').toLowerCase() === selectedRank.toLowerCase();
        const matchesGames = (item.games || []).some((g) => (g.highest_rank || '').toLowerCase() === selectedRank.toLowerCase());
        return matchesMain || matchesGames;
      });
    }

    return list;
  }, [roleFilter, coachItems, playerItems, searchQuery, selectedGame, selectedRank]);

  const handleAddFriend = async (targetUserId) => {
    setActionInProgressUserId(targetUserId);
    try {
      const res = await sendFriendRequest(targetUserId).unwrap();
      showSuccess(res?.message || 'Friend request sent successfully!');
    } catch (err) {
      showError(err?.data?.message || 'Failed to send request');
    } finally {
      setActionInProgressUserId(null);
    }
  };

  const handleUnsendFriendRequest = async (targetUserId) => {
    const requestId = outgoingMap.get(targetUserId) || targetUserId;
    setActionInProgressUserId(targetUserId);
    try {
      const res = await cancelFriendRequest(requestId).unwrap();
      showSuccess(res?.message || 'Friend request un-sent successfully.');
    } catch (err) {
      showError(err?.data?.message || 'Failed to cancel friend request');
    } finally {
      setActionInProgressUserId(null);
    }
  };

  const isLoading = isCoachesLoading || isUsersLoading;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '0.15em' }}>
          FIND YOUR SQUAD & MENTORS
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 900, mt: 0.5, mb: 1, color: 'text.primary' }}>
          DISCOVERY ARENA
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Connect with radiant coaches, find teammates by rank, and level up your competitive gameplay
        </Typography>
      </Box>

      {/* Filter Toolbar */}
      <Card sx={{ p: 3, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by name, game, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} color="#94a3b8" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={2.5}>
            <TextField
              select
              fullWidth
              label="Select Game"
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
            >
              <MenuItem value="">All Games</MenuItem>
              {games.map((g) => (
                <MenuItem key={g.id} value={g.name}>
                  {g.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4} md={2.5}>
            <TextField
              select
              fullWidth
              label="Rank Tier"
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
            >
              {RANKS.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <ToggleButtonGroup
              value={roleFilter}
              exclusive
              onChange={(e, val) => val && setRoleFilter(val)}
              fullWidth
              sx={{
                bgcolor: 'background.card',
                p: 0.5,
                borderRadius: '10px',
                border: '1px solid',
                borderColor: 'divider',
                '& .MuiToggleButton-root': {
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  py: 0.8,
                  color: 'text.secondary',
                  border: 'none',
                  borderRadius: '8px',
                  '&.Mui-selected': { 
                    bgcolor: 'primary.main', 
                    color: 'primary.contrastText',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }
                }
              }}
            >
              <ToggleButton value="ALL">All</ToggleButton>
              <ToggleButton value="COACHES">Coaches</ToggleButton>
              <ToggleButton value="PLAYERS">Players</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Card>

      {/* Discovery Results */}
      {isLoading ? (
        <LoadingSpinner message="Searching discovery arena..." />
      ) : displayItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            No coaches or players found matching your criteria. Try adjusting your filters.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {displayItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={`${item.cardRole}-${item.id}`}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  p: 3,
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 8px 30px rgba(0, 240, 255, 0.15)'
                  }
                }}
              >
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        src={item.avatar_url}
                        alt={item.username}
                        sx={{
                          width: 56,
                          height: 56,
                          border: '2px solid',
                          borderColor: item.isCoach ? 'secondary.main' : 'primary.main'
                        }}
                      />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                          {item.username}
                        </Typography>
                        {item.isCoach && item.rating_avg ? (
                          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                            <Rating value={parseFloat(item.rating_avg) || 5} precision={0.1} readOnly size="small" sx={{ color: 'accent.yellow' }} />
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                              {item.rating_avg}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              ({item.review_count || 0})
                            </Typography>
                          </Stack>
                        ) : (
                          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                            <Trophy size={14} color={theme.palette.primary.main} />
                            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                              {item.experience_level || 'Gamer'}
                            </Typography>
                          </Stack>
                        )}
                      </Box>
                    </Stack>

                    <Chip
                      label={item.cardRole}
                      size="small"
                      color={item.cardRole === 'COACH' ? 'secondary' : (item.cardRole === 'ADMIN' ? 'error' : 'primary')}
                      sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                    />
                  </Stack>

                  <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                    {item.headline}
                  </Typography>

                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6 }}>
                    {item.bio}
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
                    <Chip label={item.game_name || 'All Games'} size="small" sx={{ bgcolor: 'action.selected', color: 'primary.main', fontWeight: 700 }} />
                    {item.highest_rank && (
                      <Chip label={item.highest_rank} size="small" sx={{ bgcolor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(124, 58, 237, 0.12)', color: 'secondary.main', fontWeight: 700 }} />
                    )}
                    {item.isCoach && item.hourly_rate_usd ? (
                      <Chip label={`$${item.hourly_rate_usd}/hr`} size="small" sx={{ bgcolor: 'action.hover', fontWeight: 700 }} />
                    ) : (
                      <Chip label={item.country || 'Global'} size="small" sx={{ bgcolor: 'action.hover', fontWeight: 700 }} />
                    )}
                  </Stack>
                </Box>

                <Stack direction="row" spacing={1.5}>
                  <Button
                    component={Link}
                    href={item.linkUrl}
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="small"
                    sx={{ fontWeight: 700 }}
                  >
                    {item.viewLabel}
                  </Button>
                  {friendsSet.has(item.user_id) ? (
                    <Button
                      variant="outlined"
                      disabled
                      sx={{ minWidth: 44, px: 1, borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }}
                      title="Already Friends"
                    >
                      <Check size={18} />
                    </Button>
                  ) : outgoingMap.has(item.user_id) ? (
                    <Button
                      variant="outlined"
                      onClick={() => handleUnsendFriendRequest(item.user_id)}
                      disabled={actionInProgressUserId === item.user_id || isCancelling}
                      sx={{
                        minWidth: 44,
                        px: 1,
                        borderColor: 'rgba(239, 68, 68, 0.4)',
                        color: '#ef4444',
                        '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }
                      }}
                      title="Unsend / Cancel Friend Request"
                    >
                      <UserMinus size={18} />
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={() => handleAddFriend(item.user_id)}
                      disabled={actionInProgressUserId === item.user_id || isSending}
                      sx={{ minWidth: 44, px: 1, borderColor: 'divider', color: 'text.primary' }}
                      title="Add Friend"
                    >
                      <UserPlus size={18} />
                    </Button>
                  )}
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading discovery..." />}>
      <DiscoverContent />
    </Suspense>
  );
}
