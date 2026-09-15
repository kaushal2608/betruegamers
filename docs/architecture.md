# BeTrueGamers — Architecture Documentation

## 1. High-Level Architecture

BeTrueGamers is architected as a modular full-stack application separating concerns across UI presentation, global state, domain business logic, relational persistence, and real-time signaling:

```text
                        ┌─────────────────────────────────────────┐
                        │      Next.js (App Router, JS/JSX)       │
                        │    MUI + Redux Toolkit + RTK Query      │
                        └───────────────────┬─────────────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
                REST API                Socket.IO                 WebRTC
             (Axios / Fetch)       (Real-time Events)       (PeerConnection)
                    │                       │                       │
                    ▼                       ▼                       │
              ┌───────────┐          ┌────────────┐                 │
              │  Express  │          │ Socket.IO  │                 │
              │  Backend  │          │   Server   │                 │
              └─────┬─────┘          └────────────┘                 │
                    │                                               │
                    ▼                                               │
            ┌───────────────┐                                       │
            │  PostgreSQL   │                                       │
            │  (Supabase)   │                                       │
            └───────────────┘                                       │
                                                                    │
                         Gamer ◄──────── WebRTC ─────────► Coach
                                  (Live Screen Share)
```

---

## 2. Backend Design Patterns

The backend follows an explicit layered architecture:
`Route -> Controller -> Service -> Repository -> PostgreSQL`

- **Routes**: Define URL paths, HTTP verbs, and mount validation/authentication middlewares.
- **Controllers**: Thin request orchestrators handling input extraction and response formatting.
- **Services**: Pure business logic (e.g. OTP validation, fee calculations, notification dispatches, chat room logic).
- **Repositories**: Raw SQL execution via connection pool (`pg.Pool`), transactions, and data sanitization.
- **Middlewares**:
  - `auth.middleware.js`: Verifies JWT bearer tokens and extracts current user identity.
  - `role.middleware.js`: RBAC authorization enforcing `USER`, `COACH`, or `ADMIN`.
  - `validation.middleware.js`: Runtime schema validation with Zod.
  - `error.middleware.js`: Centralized error catching and uniform error JSON formatting.

---

## 3. Real-Time & WebRTC Architecture

1. **Signaling**:
   - The Socket.IO server authenticates connections on handshake with JWTs.
   - Rooms are segregated by domain:
     - `user:<userId>` for personal notifications and friend events.
     - `conversation:<conversationId>` for group or 1-to-1 chat.
     - `session:<sessionId>` for WebRTC SDP offers, answers, and ICE candidate exchange.

2. **WebRTC Stream**:
   - Audio and Video streams flow peer-to-peer using `RTCPeerConnection`.
   - Video is captured via `navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })`.
   - Zero video payload traverses the Node.js server, ensuring ultra-low latency and maximum scalability.
