'use client';

import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { usePathname } from 'next/navigation';
import { socketService } from '@/services/socket.service';
import {
  setOnlineUsers,
  userCameOnline,
  userWentOffline,
  showSnackbar,
  incrementUnreadNotifications
} from '@/store/slices/uiSlice';
import { notificationApi } from '@/store/api/notificationApi';
import { chatApi } from '@/store/api/chatApi';
import { coachingApi } from '@/store/api/coachingApi';
import { friendApi } from '@/store/api/friendApi';

export default function SocketManager() {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const { user, token, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // 1. Navigation & Route Switch Wake-Up: Ensure socket is active and presence is fresh when switching pages
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      socketService.ensureActive(token);
    }
  }, [pathname, isAuthenticated, user?.id, token]);

  // 2. Tab Inactivity / Sleep Wake-Up: Instantly restore presence when tab becomes active or window gains focus
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const handleWakeUp = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        socketService.ensureActive(token);
      }
    };

    document.addEventListener('visibilitychange', handleWakeUp);
    window.addEventListener('focus', handleWakeUp);

    return () => {
      document.removeEventListener('visibilitychange', handleWakeUp);
      window.removeEventListener('focus', handleWakeUp);
    };
  }, [isAuthenticated, user?.id, token]);

  // 3. Persistent Real-time Event Listeners (Independent of page route changes!)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      socketService.disconnect();
      return;
    }

    // Connect to Socket.IO with explicit auth token
    const socket = socketService.connect(token);
    if (!socket) return;

    // Presence Listeners
    const handlePresenceList = (users) => {
      dispatch(setOnlineUsers(users));
    };

    const handlePresenceOnline = ({ userId }) => {
      if (userId) {
        dispatch(userCameOnline(userId));
      }
    };

    const handlePresenceOffline = ({ userId }) => {
      if (userId) {
        dispatch(userWentOffline(userId));
      }
    };

    // Notification Listener
    const handleNewNotification = (notif) => {
      if (!notif) return;

      const text = notif.title && notif.message
        ? `${notif.title}: ${notif.message}`
        : notif.message || 'You have a new notification!';

      dispatch(
        showSnackbar({
          message: text,
          severity: 'info',
          autoHideDuration: 5000
        })
      );

      dispatch(incrementUnreadNotifications());
      dispatch(notificationApi.util.invalidateTags(['Notification']));
    };

    // Global Chat Message Received Listener
    const handleChatMessageReceived = ({ conversationId, message }) => {
      dispatch(chatApi.util.invalidateTags(['Conversation']));

      // Only show popup toast if not currently looking at the chat page
      if (!pathnameRef.current?.startsWith('/chat')) {
        const senderName = message?.sender_username || 'New message';
        const msgText = message?.content ? (message.content.length > 50 ? message.content.slice(0, 50) + '...' : message.content) : '';
        dispatch(
          showSnackbar({
            message: `💬 ${senderName}: ${msgText}`,
            severity: 'info',
            autoHideDuration: 4000
          })
        );
      }
    };

    // Coaching Status Changed & Request Listeners
    const handleCoachingStatusChanged = ({ status, sessionId }) => {
      dispatch(coachingApi.util.invalidateTags(['CoachingSession']));
      if (status === 'ACCEPTED') {
        dispatch(
          showSnackbar({
            message: '🎉 Coaching session approved! You can now join the session room.',
            severity: 'success',
            autoHideDuration: 6000
          })
        );
      }
    };

    const handleCoachingRequested = () => {
      dispatch(coachingApi.util.invalidateTags(['CoachingSession']));
      dispatch(
        showSnackbar({
          message: '📩 New coaching session request received! Check your notifications or sessions.',
          severity: 'info',
          autoHideDuration: 6000
        })
      );
    };

    // Friend Request & Accepted Listeners
    const handleFriendAccepted = () => {
      dispatch(friendApi.util.invalidateTags(['Friend', 'FriendRequest']));
    };

    const handleFriendRequest = () => {
      dispatch(friendApi.util.invalidateTags(['FriendRequest']));
    };

    // Query initial presence list in case server didn't emit
    socketService.emit('presence:query');

    socketService.on('presence:list', handlePresenceList);
    socketService.on('presence:online', handlePresenceOnline);
    socketService.on('presence:offline', handlePresenceOffline);
    socketService.on('notification:new', handleNewNotification);
    socketService.on('chat:message_received', handleChatMessageReceived);
    socketService.on('coaching:status_changed', handleCoachingStatusChanged);
    socketService.on('coaching:session_requested', handleCoachingRequested);
    socketService.on('friend:accepted', handleFriendAccepted);
    socketService.on('friend:request', handleFriendRequest);

    return () => {
      socketService.off('presence:list', handlePresenceList);
      socketService.off('presence:online', handlePresenceOnline);
      socketService.off('presence:offline', handlePresenceOffline);
      socketService.off('notification:new', handleNewNotification);
      socketService.off('chat:message_received', handleChatMessageReceived);
      socketService.off('coaching:status_changed', handleCoachingStatusChanged);
      socketService.off('coaching:session_requested', handleCoachingRequested);
      socketService.off('friend:accepted', handleFriendAccepted);
      socketService.off('friend:request', handleFriendRequest);
    };
  }, [dispatch, isAuthenticated, user?.id, token]);

  return null;
}
