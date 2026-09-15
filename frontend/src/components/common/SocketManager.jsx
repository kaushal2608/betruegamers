'use client';

import { useEffect } from 'react';
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
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      socketService.disconnect();
      return;
    }

    // Connect to Socket.IO with auth cookie/token
    const socket = socketService.connect();
    if (!socket) return;

    // 1. Presence Listeners
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

    // 2. Notification Listener
    const handleNewNotification = (notif) => {
      if (!notif) return;

      // Show real-time snackbar immediately
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

      // Increment badge count
      dispatch(incrementUnreadNotifications());

      // Invalidate RTK Query cache for notifications
      dispatch(notificationApi.util.invalidateTags(['Notification']));
    };

    // 3. Global Chat Message Received Listener
    const handleChatMessageReceived = ({ conversationId, message }) => {
      // Invalidate conversations to update last message & unread badge count
      dispatch(chatApi.util.invalidateTags(['Conversation']));

      // If user is not currently in chat page, show a quick snackbar toast
      if (!pathname?.startsWith('/chat')) {
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

    // 4. Coaching Status Changed & Request Listeners
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

    // 5. Friend Request & Accepted Listeners
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
  }, [dispatch, isAuthenticated, user?.id, pathname]);

  return null;
}
