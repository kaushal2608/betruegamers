# BeTrueGamers — Real-Time & WebRTC Specification

## 1. Socket.IO Architecture

Socket.IO is used exclusively for:
- User presence tracking
- Instant messaging & typing states
- Real-time application notifications
- WebRTC peer connection signaling

### Connection & Authentication
Clients connect with a valid JWT token:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: 'jwt_token_here' }
});
```

The server verifies the token in a handshake middleware and binds the authenticated user record to `socket.user`.

---

## 2. Event Registry

### Presence
- `presence:query` -> Client asks for list of online users.
- `presence:list` -> Server returns array of online `userId`s.
- `presence:online` -> Broadcast: `{ userId }` came online.
- `presence:offline` -> Broadcast: `{ userId }` disconnected.

### Chat
- `chat:join` (`{ conversationId }`) -> Client joins room `conversation:<conversationId>`.
- `chat:leave` (`{ conversationId }`) -> Client leaves room.
- `chat:send_message` (`{ conversationId, content }`) -> Saves message in Postgres and broadcasts to conversation room.
- `chat:message` -> Event received by peers in the room with full message payload.
- `chat:typing` (`{ conversationId }`) -> Emits `chat:user_typing` to conversation room.
- `chat:stop-typing` (`{ conversationId }`) -> Emits `chat:user_stop_typing` to conversation room.

### Notifications
- `notification:new` -> Emitted to `user:<userId>` room when friend requests, session invites, or system announcements trigger.

### WebRTC Signaling
- `webrtc:join_room` (`{ sessionId }`) -> Joins room `session:<sessionId>`.
- `webrtc:peer_joined` -> Broadcast to session room indicating a peer entered.
- `webrtc:offer` (`{ sessionId, offer, targetPeerId }`) -> Relayed to target peer.
- `webrtc:answer` (`{ sessionId, answer, targetPeerId }`) -> Relayed to initiator.
- `webrtc:ice_candidate` (`{ sessionId, candidate, targetPeerId }`) -> Relayed to peer.
- `webrtc:screen_state` (`{ sessionId, isSharing }`) -> Updates screen share state.
- `webrtc:leave_room` (`{ sessionId }`) -> Notifies peer of departure.

---

## 3. WebRTC Screen Sharing Implementation

The browser captures display media directly using standard browser APIs:
```javascript
const stream = await navigator.mediaDevices.getDisplayMedia({
  video: { cursor: 'always', frameRate: { max: 60 } },
  audio: true
});

stream.getTracks().forEach(track => {
  peerConnection.addTrack(track, stream);
});
```

Video and audio streams are exchanged directly peer-to-peer using Google public STUN servers (`stun:stun.l.google.com:19302`), providing zero latency without routing video data through the Node.js server.
