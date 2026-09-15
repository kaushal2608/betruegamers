'use client';

import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  Grid,
  Avatar,
  TextField,
  IconButton,
  Stack,
  Divider,
  Paper,
  InputBase,
  Chip,
  Badge,
  CircularProgress,
  Button,
  useTheme
} from '@mui/material';
import {
  Send,
  Search,
  MessageSquare,
  Smile,
  Shield,
  Circle,
  UserPlus,
  AlertCircle,
  ChevronUp
} from 'lucide-react';
import {
  chatApi,
  useGetConversationsQuery,
  useStartConversationMutation,
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useSendMessageMutation,
  useMarkConversationAsReadMutation
} from '@/store/api/chatApi';
import { useGetFriendsQuery } from '@/store/api/friendApi';
import { socketService } from '@/services/socket.service';
import LoadingSpinner from '@/components/common/LoadingSpinner';

function ChatContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const recipientParam = searchParams.get('recipient');
  const { user } = useSelector((state) => state.auth);
  const { onlineUsers } = useSelector((state) => state.ui);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeConvId, setActiveConvId] = useState(null);
  const [loadingChatId, setLoadingChatId] = useState(null);
  const [activeRecipient, setActiveRecipient] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [localMessages, setLocalMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { data: convsData, isLoading: isConvsLoading, refetch: refetchConvs } = useGetConversationsQuery();
  const { data: friendsData } = useGetFriendsQuery();
  const [startConversation] = useStartConversationMutation();
  const [markConversationAsRead] = useMarkConversationAsReadMutation();
  const [sendMessageMutation] = useSendMessageMutation();
  const [triggerGetOlderMessages] = useLazyGetMessagesQuery();

  const friendsList = friendsData?.data || [];
  const conversations = convsData?.data || [];

  // Set of accepted friend IDs
  const friendIdSet = useMemo(() => new Set(friendsList.map((f) => f.id)), [friendsList]);

  // Conversations where actual messages have taken place with an accepted friend (convo ho rakhi h)
  const activeExistingConversations = useMemo(() => {
    return conversations.filter(
      (c) =>
        friendIdSet.has(c.participant_id) &&
        Boolean(c.last_message_content || c.last_message_time)
    );
  }, [conversations, friendIdSet]);

  // Display list: Active conversations + draft friend conversation if user clicked someone from Home/Friends or Search
  const displayConversations = useMemo(() => {
    if (
      activeConvId &&
      activeRecipient &&
      !activeExistingConversations.some(
        (c) => c.id === activeConvId || c.participant_id === activeRecipient.id
      )
    ) {
      const draftConv = {
        id: activeConvId,
        participant_id: activeRecipient.id,
        participant_name: activeRecipient.name,
        participant_avatar: activeRecipient.avatar,
        participant_role: activeRecipient.role,
        last_message_content:
          localMessages.length > 0
            ? localMessages[localMessages.length - 1]?.content
            : 'No messages yet',
        last_message_time: new Date().toISOString(),
        unread_count: 0
      };
      return [draftConv, ...activeExistingConversations];
    }
    return activeExistingConversations;
  }, [activeExistingConversations, activeConvId, activeRecipient, localMessages]);

  // Filter existing active conversations by search
  const filteredConversations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return displayConversations;
    return displayConversations.filter((c) =>
      (c.participant_name || '').toLowerCase().includes(q)
    );
  }, [displayConversations, searchQuery]);

  // Only FRIENDS appear in search to start a new chat (non-friends will never show up!)
  const newFriendsToMessage = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q || !friendsList) return [];
    const activeParticipantIds = new Set(displayConversations.map((c) => c.participant_id));
    return friendsList.filter(
      (f) =>
        f.id !== user?.id &&
        !activeParticipantIds.has(f.id) &&
        (f.username || '').toLowerCase().includes(q)
    );
  }, [searchQuery, friendsList, displayConversations, user?.id]);

  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    isFetching: isMessagesFetching,
    isError: isMessagesError,
    error: messagesError,
    refetch: refetchMessages
  } = useGetMessagesQuery(
    { conversationId: activeConvId, limit: 10, offset: 0 },
    { skip: !activeConvId, refetchOnMountOrArgChange: true }
  );

  // 1. Handle navigation with ?recipient=... (e.g. from Friends list or Home feed)
  useEffect(() => {
    if (!recipientParam || !user || recipientParam === user.id) return;

    // First check if conversation already exists in loaded list
    const existing = conversations.find((c) => c.participant_id === recipientParam);
    if (existing) {
      if (activeConvId !== existing.id) {
        setLocalMessages([]);
        setHasMore(false);
        setIsLoadingOlder(false);
        setTypingUsers(new Set());
        setLoadingChatId(existing.id);
        setActiveConvId(existing.id);
        setActiveRecipient({
          id: existing.participant_id,
          name: existing.participant_name,
          avatar: existing.participant_avatar,
          role: existing.participant_role
        });
        markConversationAsRead(existing.id);
      }
      // Clear URL parameter so subsequent conversation clicks are never overridden
      router.replace('/chat', { scroll: false });
      return;
    }

    // If not found in current list, create or get via API
    setLoadingChatId('new');
    const f = friendsList.find((fr) => fr.id === recipientParam);
    if (f) {
      setActiveRecipient({
        id: f.id,
        name: f.username,
        avatar: f.avatar_url,
        role: f.role
      });
    }

    startConversation(recipientParam)
      .unwrap()
      .then((res) => {
        if (res?.data) {
          setLocalMessages([]);
          setTypingUsers(new Set());
          setLoadingChatId(res.data.id);
          setActiveConvId(res.data.id);
          setActiveRecipient({
            id: res.data.participant_id || f?.id || recipientParam,
            name: res.data.participant_name || f?.username || 'Gamer',
            avatar: res.data.participant_avatar || f?.avatar_url,
            role: res.data.participant_role || f?.role
          });
          // Clear URL parameter once created
          router.replace('/chat', { scroll: false });
        }
      })
      .catch((err) => {
        console.error(err);
        setLoadingChatId(null);
      });
  }, [recipientParam, user, conversations, friendsList, activeConvId, startConversation, markConversationAsRead, router]);

  // 2. Set default active conversation if none selected (from displayConversations only!)
  useEffect(() => {
    if (!activeConvId && !recipientParam && displayConversations.length > 0) {
      const firstConv = displayConversations[0];
      setLoadingChatId(firstConv.id);
      setActiveConvId(firstConv.id);
      setActiveRecipient({
        id: firstConv.participant_id,
        name: firstConv.participant_name,
        avatar: firstConv.participant_avatar,
        role: firstConv.participant_role
      });
      markConversationAsRead(firstConv.id);
    }
  }, [displayConversations, activeConvId, recipientParam, markConversationAsRead]);

  // 3. Keep activeRecipient details in sync with displayConversations
  useEffect(() => {
    if (activeConvId && displayConversations.length > 0) {
      const match = displayConversations.find((c) => c.id === activeConvId);
      if (match && match.participant_name) {
        setActiveRecipient((prev) => {
          if (
            !prev ||
            prev.id !== match.participant_id ||
            prev.name !== match.participant_name ||
            prev.avatar !== match.participant_avatar
          ) {
            return {
              id: match.participant_id,
              name: match.participant_name,
              avatar: match.participant_avatar,
              role: match.participant_role
            };
          }
          return prev;
        });
      }
    }
  }, [displayConversations, activeConvId]);

  // 4. Sync initial 10 messages from query into local state
  useEffect(() => {
    if (messagesData) {
      const msgs = messagesData.data || [];
      if (msgs.length > 0 && msgs[0].conversation_id !== activeConvId) {
        return;
      }
      setLocalMessages(msgs);
      setHasMore(messagesData.pagination?.has_more ?? false);
      setLoadingChatId(null);
      if (activeConvId && msgs.length > 0) {
        markConversationAsRead(activeConvId);
      }
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      });
    } else if (isMessagesError) {
      setLoadingChatId(null);
    }
  }, [messagesData, activeConvId, isMessagesError, markConversationAsRead]);

  // Safety hook: clear loadingChatId if message query finishes fetching
  useEffect(() => {
    if (!isMessagesLoading && !isMessagesFetching && loadingChatId) {
      setLoadingChatId(null);
    }
  }, [isMessagesLoading, isMessagesFetching, loadingChatId]);

  // 5. Auto scroll to bottom only when newest message changes or user sends/receives
  const latestMessageId = localMessages.length > 0 ? localMessages[localMessages.length - 1]?.id : null;
  useEffect(() => {
    if (latestMessageId && !isLoadingOlder) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [latestMessageId, typingUsers]);

  // 5b. Fetch older 10 messages on scroll up
  const handleLoadOlderMessages = async () => {
    if (!activeConvId || !hasMore || isLoadingOlder) return;

    setIsLoadingOlder(true);
    const container = messagesContainerRef.current;
    const prevScrollHeight = container ? container.scrollHeight : 0;
    const prevScrollTop = container ? container.scrollTop : 0;

    try {
      const res = await triggerGetOlderMessages({
        conversationId: activeConvId,
        limit: 10,
        offset: localMessages.length
      }).unwrap();

      if (res?.data && res.data.length > 0) {
        setLocalMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newOlder = res.data.filter((m) => !existingIds.has(m.id));
          return [...newOlder, ...prev];
        });

        setHasMore(res.pagination?.has_more ?? false);

        // Preserve scroll position
        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
          }
        });
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setIsLoadingOlder(false);
    }
  };

  const handleScroll = (e) => {
    const target = e.currentTarget;
    if (target.scrollTop < 40 && hasMore && !isLoadingOlder) {
      handleLoadOlderMessages();
    }
  };

  // 6. Real-time Socket.IO Listeners
  useEffect(() => {
    if (!activeConvId) return;

    socketService.connect();
    socketService.joinConversation(activeConvId);

    const handleIncomingMessage = (msg) => {
      if (msg.conversation_id === activeConvId) {
        setLocalMessages((prev) => {
          // If already in list or replaces optimistic pending message, update it
          if (prev.some((m) => m.id === msg.id)) return prev;
          const hasOptimistic = prev.some(
            (m) => m.isPending && m.content === msg.content && m.sender_id === msg.sender_id
          );
          if (hasOptimistic) {
            return prev.map((m) =>
              m.isPending && m.content === msg.content && m.sender_id === msg.sender_id ? msg : m
            );
          }
          return [...prev, msg];
        });
        markConversationAsRead(activeConvId);
      } else {
        if (msg?.conversation_id) {
          dispatch(chatApi.util.invalidateTags([{ type: 'Message', id: msg.conversation_id }]));
        }
        refetchConvs();
      }
    };

    const handleMessageReceived = (data) => {
      const convId = data?.conversationId || data?.message?.conversation_id;
      if (convId) {
        dispatch(chatApi.util.invalidateTags([{ type: 'Message', id: convId }]));
      }
      refetchConvs();
    };

    const handleUserTyping = ({ conversationId, username }) => {
      // STRICT FILTER: Only show typing if it belongs to this active conversation AND is from active recipient
      if (conversationId === activeConvId && activeRecipient && username === activeRecipient.name) {
        setTypingUsers((prev) => new Set(prev).add(username));

        // Auto-clear typing indicator after 3 seconds
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUsers((prev) => {
            const updated = new Set(prev);
            updated.delete(username);
            return updated;
          });
        }, 3000);
      }
    };

    const handleUserStopTyping = ({ conversationId, username }) => {
      if (conversationId === activeConvId) {
        setTypingUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(username);
          return updated;
        });
      }
    };

    socketService.on('chat:message', handleIncomingMessage);
    socketService.on('chat:message_received', handleMessageReceived);
    socketService.on('chat:user_typing', handleUserTyping);
    socketService.on('chat:user_stop_typing', handleUserStopTyping);

    return () => {
      socketService.leaveConversation(activeConvId);
      socketService.off('chat:message', handleIncomingMessage);
      socketService.off('chat:message_received', handleMessageReceived);
      socketService.off('chat:user_typing', handleUserTyping);
      socketService.off('chat:user_stop_typing', handleUserStopTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [activeConvId, activeRecipient, refetchConvs, markConversationAsRead, dispatch]);

  // Switching conversations: Immediately clear previous messages & typing to avoid leaking!
  const handleSelectConversation = (conv) => {
    if (conv.id === activeConvId) return;
    setLocalMessages([]);
    setHasMore(false);
    setIsLoadingOlder(false);
    setTypingUsers(new Set());
    setLoadingChatId(conv.id);
    setActiveConvId(conv.id);
    setActiveRecipient({
      id: conv.participant_id,
      name: conv.participant_name,
      avatar: conv.participant_avatar,
      role: conv.participant_role
    });
    markConversationAsRead(conv.id);
  };

  // Start chat with a friend found in search
  const handleStartNewChat = async (targetFriend) => {
    setSearchQuery('');
    setLocalMessages([]);
    setTypingUsers(new Set());
    setLoadingChatId('new');
    setActiveRecipient({
      id: targetFriend.id,
      name: targetFriend.username,
      avatar: targetFriend.avatar_url,
      role: targetFriend.role
    });

    try {
      const res = await startConversation(targetFriend.id).unwrap();
      if (res?.data) {
        setLoadingChatId(res.data.id);
        setActiveConvId(res.data.id);
        setActiveRecipient({
          id: res.data.participant_id || targetFriend.id,
          name: res.data.participant_name || targetFriend.username,
          avatar: res.data.participant_avatar || targetFriend.avatar_url,
          role: res.data.participant_role || targetFriend.role
        });
      }
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setLoadingChatId(null);
    }
  };

  // Send message with instant optimistic update (never blocking typing of next message!)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConvId) return;

    const content = messageInput.trim();
    setMessageInput('');
    socketService.sendStopTyping(activeConvId);

    // 1. Optimistic message added to localMessages immediately with unique temp ID
    const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const optimisticMsg = {
      id: tempId,
      conversation_id: activeConvId,
      sender_id: user?.id,
      content,
      created_at: new Date().toISOString(),
      sender_username: user?.username,
      sender_avatar: user?.avatar_url,
      isPending: true
    };

    setLocalMessages((prev) => [...prev, optimisticMsg]);

    // Send asynchronously without locking user out of typing the next message
    sendMessageMutation({ conversationId: activeConvId, content })
      .unwrap()
      .then((res) => {
        if (res?.data) {
          // Replace optimistic message with actual DB record
          setLocalMessages((prev) =>
            prev.map((m) => (m.id === tempId ? res.data : m))
          );
        }
        refetchConvs();
      })
      .catch((err) => {
        console.error('Failed to send message:', err);
        // Remove failed optimistic message
        setLocalMessages((prev) => prev.filter((m) => m.id !== tempId));
      });
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    if (activeConvId) {
      socketService.sendTyping(activeConvId);
      clearTimeout(window.inputTypingTimeout);
      window.inputTypingTimeout = setTimeout(() => {
        socketService.sendStopTyping(activeConvId);
      }, 2000);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', height: 'calc(100vh - 120px)' }}>
      <Card sx={{ height: '100%', display: 'flex', overflow: 'hidden', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        {/* Left: Conversations Sidebar */}
        <Box
          sx={{
            width: { xs: '100%', md: 340 },
            display: { xs: activeConvId ? 'none' : 'flex', md: 'flex' },
            flexDirection: 'column',
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: isDark ? '#0c1017' : '#f8fafc'
          }}
        >
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary' }}>
              COMMUNICATION ARENA
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: isDark ? 'background.card' : '#ffffff',
                borderRadius: '8px',
                px: 1.5,
                py: 0.5,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Search size={16} color={theme.palette.text.secondary} />
              <InputBase
                placeholder="Search chats or friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ ml: 1, fontSize: '0.85rem', color: 'text.primary', width: '100%' }}
              />
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
            {isConvsLoading ? (
              <LoadingSpinner message="Loading conversations..." size={32} />
            ) : filteredConversations.length === 0 && newFriendsToMessage.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  {searchQuery.trim() ? 'No friends or chats match your search.' : 'No active conversations yet.'}
                </Typography>
                {!searchQuery.trim() && (
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                    Type a friend's name in search above to start a chat!
                  </Typography>
                )}
              </Box>
            ) : (
              <>
                {/* Active / Existing Conversations */}
                {filteredConversations.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  const isConvOnline = conv.participant_id && onlineUsers?.includes(conv.participant_id);
                  const hasUnread = !isActive && (conv.unread_count || 0) > 0;

                  return (
                    <Paper
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      sx={{
                        p: 1.8,
                        mb: 1,
                        cursor: 'pointer',
                        borderRadius: '8px',
                        bgcolor: isActive
                          ? isDark
                            ? 'rgba(0, 240, 255, 0.12)'
                            : 'rgba(2, 132, 199, 0.12)'
                          : 'transparent',
                        border: '1px solid',
                        borderColor: isActive
                          ? isDark
                            ? 'rgba(0, 240, 255, 0.3)'
                            : 'rgba(2, 132, 199, 0.3)'
                          : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          variant="dot"
                          sx={{
                            '& .MuiBadge-badge': {
                              bgcolor: isConvOnline ? theme.palette.accent.emerald : theme.palette.text.disabled,
                              boxShadow: isConvOnline ? `0 0 6px ${theme.palette.accent.emerald}` : 'none'
                            }
                          }}
                        >
                          <Avatar src={conv.participant_avatar} alt={conv.participant_name} sx={{ width: 44, height: 44 }} />
                        </Badge>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', noWrap: true }}>
                              {conv.participant_name}
                            </Typography>
                            <Stack direction="row" spacing={0.6} alignItems="center">
                              {conv.participant_role === 'COACH' && (
                                <Chip label="COACH" size="small" color="secondary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }} />
                              )}
                              {hasUnread && (
                                <Chip
                                  label={conv.unread_count}
                                  size="small"
                                  color="primary"
                                  sx={{
                                    height: 20,
                                    minWidth: 20,
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    boxShadow: isDark ? '0 0 8px rgba(0, 240, 255, 0.4)' : '0 2px 6px rgba(2, 132, 199, 0.3)'
                                  }}
                                />
                              )}
                            </Stack>
                          </Stack>
                          <Typography
                            variant="caption"
                            sx={{
                              color: hasUnread ? 'primary.main' : 'text.secondary',
                              fontWeight: hasUnread ? 700 : 400,
                              display: 'block',
                              noWrap: true
                            }}
                          >
                            {conv.last_message_content || 'No messages yet'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  );
                })}

                {/* Friends Found via Search to Start a New Chat */}
                {newFriendsToMessage.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ px: 1, py: 0.8 }}>
                      <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '0.08em' }}>
                        FRIENDS (START CHAT)
                      </Typography>
                    </Box>
                    {newFriendsToMessage.map((f) => {
                      const isFriendOnline = onlineUsers?.includes(f.id);
                      return (
                        <Paper
                          key={f.id}
                          onClick={() => handleStartNewChat(f)}
                          sx={{
                            p: 1.5,
                            mb: 1,
                            cursor: 'pointer',
                            borderRadius: '8px',
                            bgcolor: 'action.hover',
                            border: '1px dashed',
                            borderColor: 'divider',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: isDark ? 'rgba(0, 240, 255, 0.08)' : 'rgba(2, 132, 199, 0.08)',
                              borderColor: 'primary.main'
                            }
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Badge
                              overlap="circular"
                              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                              variant="dot"
                              sx={{
                                '& .MuiBadge-badge': {
                                  bgcolor: isFriendOnline ? theme.palette.accent.emerald : theme.palette.text.disabled
                                }
                              }}
                            >
                              <Avatar src={f.avatar_url} alt={f.username} sx={{ width: 40, height: 40 }} />
                            </Badge>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', noWrap: true }}>
                                  {f.username}
                                </Typography>
                                <Chip label={f.role || 'GAMER'} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                              </Stack>
                              <Typography variant="caption" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <UserPlus size={12} /> Click to start messaging
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>

        {/* Right: Message Feed & Chat Window */}
        <Box sx={{ flex: 1, display: { xs: activeConvId ? 'flex' : 'none', md: 'flex' }, flexDirection: 'column' }}>
          {activeConvId ? (
            <>
              {/* Chat Header */}
              {(() => {
                const isRecipientOnline = Boolean(
                  activeRecipient?.id && onlineUsers?.includes(activeRecipient.id)
                );
                return (
                  <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        sx={{
                          '& .MuiBadge-badge': {
                            bgcolor: isRecipientOnline ? theme.palette.accent.emerald : theme.palette.text.disabled,
                            boxShadow: isRecipientOnline ? `0 0 6px ${theme.palette.accent.emerald}` : 'none'
                          }
                        }}
                      >
                        <Avatar src={activeRecipient?.avatar} sx={{ width: 40, height: 40, border: '2px solid', borderColor: 'primary.main' }} />
                      </Badge>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {activeRecipient?.name || 'Gamer'}
                        </Typography>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                          <Typography
                            variant="caption"
                            sx={{
                              color: isRecipientOnline ? theme.palette.accent.emerald : 'text.secondary',
                              fontWeight: 700
                            }}
                          >
                            {isRecipientOnline ? 'Online' : 'Offline'}
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                );
              })()}

              {/* Messages Scroll Area */}
              <Box
                ref={messagesContainerRef}
                onScroll={handleScroll}
                sx={{
                  flex: 1,
                  p: 3,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  bgcolor: isDark ? 'transparent' : '#f8fafc',
                  scrollbarWidth: 'thin',
                  scrollbarColor: isDark ? '#242e44 transparent' : '#cbd5e1 transparent',
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-track': { background: 'transparent' },
                  '&::-webkit-scrollbar-thumb': {
                    background: isDark ? '#242e44' : '#cbd5e1',
                    borderRadius: '4px'
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: isDark ? '#334155' : '#94a3b8'
                  }
                }}
              >
                {/* Older Messages Loading Indicator / Trigger */}
                {hasMore && (
                  <Box sx={{ textAlign: 'center', my: 1 }}>
                    <Button
                      variant="text"
                      size="small"
                      onClick={handleLoadOlderMessages}
                      disabled={isLoadingOlder}
                      startIcon={isLoadingOlder ? <CircularProgress size={14} sx={{ color: 'primary.main' }} /> : <ChevronUp size={16} />}
                      sx={{
                        color: 'primary.main',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        bgcolor: isDark ? 'rgba(0, 240, 255, 0.08)' : 'rgba(2, 132, 199, 0.08)',
                        borderRadius: '20px',
                        px: 2.5,
                        py: 0.6,
                        textTransform: 'none',
                        '&:hover': { bgcolor: isDark ? 'rgba(0, 240, 255, 0.18)' : 'rgba(2, 132, 199, 0.18)' }
                      }}
                    >
                      {isLoadingOlder ? 'Loading older messages...' : 'Load older messages'}
                    </Button>
                  </Box>
                )}
                {isMessagesError && localMessages.length === 0 ? (
                  <Box sx={{ my: 'auto', textAlign: 'center', p: 3 }}>
                    <AlertCircle size={42} color={theme.palette.error.main} style={{ marginBottom: 12 }} />
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'error.main', mb: 0.5 }}>
                      {messagesError?.data?.message || 'Failed to load messages'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                      {messagesError?.status === 429
                        ? 'Too many requests. Please try again in a moment.'
                        : 'Could not retrieve messages from server.'}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setLoadingChatId(activeConvId);
                        refetchMessages();
                      }}
                      sx={{
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      Retry
                    </Button>
                  </Box>
                ) : ((isMessagesLoading || isMessagesFetching || Boolean(loadingChatId)) && localMessages.length === 0) ? (
                  <LoadingSpinner message="Loading messages..." size={32} />
                ) : localMessages.length === 0 ? (
                  <Box sx={{ my: 'auto', textAlign: 'center' }}>
                    <MessageSquare size={40} color={theme.palette.text.disabled} style={{ marginBottom: 8 }} />
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      Start of conversation
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Say hello, coordinate ranked matches, or arrange coaching VOD reviews!
                    </Typography>
                  </Box>
                ) : (
                  localMessages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <Box
                        key={msg.id}
                        sx={{
                          display: 'flex',
                          justifyContent: isMe ? 'flex-end' : 'flex-start',
                          alignItems: 'flex-end',
                          gap: 1.2,
                          opacity: msg.isPending ? 0.7 : 1
                        }}
                      >
                        {!isMe && <Avatar src={msg.sender_avatar} sx={{ width: 28, height: 28 }} />}
                        <Box
                          sx={{
                            maxWidth: '70%',
                            p: 1.8,
                            borderRadius: '12px',
                            bgcolor: isMe ? 'primary.main' : 'background.paper',
                            color: isMe ? 'primary.contrastText' : 'text.primary',
                            border: isMe ? 'none' : '1px solid',
                            borderColor: 'divider',
                            boxShadow: isMe
                              ? isDark
                                ? '0 4px 15px rgba(0, 240, 255, 0.25)'
                                : '0 4px 15px rgba(2, 132, 199, 0.25)'
                              : isDark
                                ? 'none'
                                : '0 2px 8px rgba(0, 0, 0, 0.04)'
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: isMe ? 600 : 400, lineHeight: 1.5, wordBreak: 'break-word' }}>
                            {msg.content}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              textAlign: 'right',
                              mt: 0.5,
                              color: isMe ? (isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)') : 'text.secondary',
                              fontSize: '0.68rem'
                            }}
                          >
                            {msg.isPending
                              ? 'Sending...'
                              : new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })
                )}

                {/* Typing Indicator — Only shown for the current conversation and active recipient */}
                {typingUsers.size > 0 && (
                  <Typography variant="caption" sx={{ color: 'primary.main', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Circle size={6} fill={theme.palette.primary.main} color={theme.palette.primary.main} />
                    {Array.from(typingUsers).join(', ')} is typing...
                  </Typography>
                )}

                <div ref={messagesEndRef} />
              </Box>

              {/* Message Input Box */}
              <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <TextField
                    fullWidth
                    placeholder="Type your message... (Press Enter to send)"
                    value={messageInput}
                    onChange={handleInputChange}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: isDark ? 'background.card' : '#ffffff',
                        borderRadius: '8px'
                      }
                    }}
                  />
                  <IconButton
                    type="submit"
                    color="primary"
                    disabled={!messageInput.trim()}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      p: 1.2,
                      '&:hover': { bgcolor: 'primary.light' },
                      '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'text.disabled' }
                    }}
                  >
                    <Send size={18} />
                  </IconButton>
                </Stack>
              </Box>
            </>
          ) : (
            <Box sx={{ m: 'auto', textAlign: 'center', p: 4 }}>
              <MessageSquare size={48} color={theme.palette.text.disabled} style={{ marginBottom: 12, opacity: 0.6 }} />
              <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 700, mb: 0.8 }}>
                Your Communication Arena
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.disabled', maxWidth: 360, mx: 'auto' }}>
                Select an active conversation from the sidebar or search your friends above to start chatting!
              </Typography>
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading chat arena..." />}>
      <ChatContent />
    </Suspense>
  );
}
