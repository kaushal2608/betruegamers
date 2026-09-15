import { friendRepository } from '../repositories/friend.repository.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { getIO } from '../config/socket.js';

export const friendService = {
  async sendFriendRequest(sender, receiverId) {
    if (sender.id === receiverId) {
      const error = new Error('You cannot send a friend request to yourself');
      error.statusCode = 400;
      throw error;
    }

    // Check if already friends
    const isFriend = await friendRepository.getFriendship(sender.id, receiverId);
    if (isFriend) {
      const error = new Error('You are already friends with this gamer');
      error.statusCode = 400;
      throw error;
    }

    // Check existing pending request
    const existingReq = await friendRepository.getExistingRequest(sender.id, receiverId);
    if (existingReq) {
      const error = new Error('A friend request between you and this gamer is already pending');
      error.statusCode = 400;
      throw error;
    }

    const request = await friendRepository.createRequest(sender.id, receiverId);

    // Create Notification in DB
    const notif = await notificationRepository.createNotification({
      userId: receiverId,
      type: 'FRIEND_REQUEST',
      title: 'New Friend Request',
      message: `${sender.username} sent you a friend request!`,
      data: { requestId: request.id, senderId: sender.id, username: sender.username }
    });

    // Real-Time Socket dispatch
    try {
      const io = getIO();
      io.to(`user:${receiverId}`).emit('notification:new', notif);
      io.to(`user:${receiverId}`).emit('friend:request', { request, sender });
    } catch (e) {
      // Socket may not be initialized yet in test mode
    }

    return request;
  },

  async acceptFriendRequest(requestId, currentUserId, currentUsername) {
    const request = await friendRepository.getRequestById(requestId);
    if (!request) {
      const error = new Error('Friend request not found');
      error.statusCode = 404;
      throw error;
    }

    if (request.receiver_id !== currentUserId) {
      const error = new Error('You are not authorized to accept this friend request');
      error.statusCode = 403;
      throw error;
    }

    await friendRepository.acceptRequest(requestId, request.sender_id, request.receiver_id);

    // Create Notification for the original sender
    const notif = await notificationRepository.createNotification({
      userId: request.sender_id,
      type: 'FRIEND_ACCEPTED',
      title: 'Friend Request Accepted',
      message: `${currentUsername} accepted your friend request!`,
      data: { friendId: currentUserId, username: currentUsername }
    });

    // Real-Time Socket dispatch
    try {
      const io = getIO();
      io.to(`user:${request.sender_id}`).emit('notification:new', notif);
      io.to(`user:${request.sender_id}`).emit('friend:accepted', { friendId: currentUserId });
    } catch (e) {}

    return { message: 'Friend request accepted' };
  },

  async rejectFriendRequest(requestId, currentUserId) {
    const request = await friendRepository.getRequestById(requestId);
    if (!request || request.receiver_id !== currentUserId) {
      const error = new Error('Friend request not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    await friendRepository.rejectRequest(requestId);
    return { message: 'Friend request rejected' };
  },

  async cancelFriendRequest(requestId, currentUserId) {
    await friendRepository.cancelRequest(requestId, currentUserId);
    return { message: 'Friend request cancelled' };
  },

  async removeFriend(currentUserId, friendId) {
    await friendRepository.removeFriendship(currentUserId, friendId);
    return { message: 'Friend removed' };
  },

  async getFriends(userId) {
    return await friendRepository.getFriendsList(userId);
  },

  async getPendingRequests(userId) {
    return await friendRepository.getPendingRequests(userId);
  }
};
