# BeTrueGamers — API Specification

## Base URL
`/api`

All protected endpoints require the header:
`Authorization: Bearer <JWT_TOKEN>`

---

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/signup` | Public | Validate credentials, generate 6-digit OTP, send email |
| POST | `/verify-otp` | Public | Verify OTP code, hash password, create user & profile, issue JWT |
| POST | `/resend-otp` | Public | Generate and resend fresh 6-digit OTP |
| POST | `/forgot-password` | Public | Generate 6-digit password reset OTP and dispatch email |
| POST | `/reset-password` | Public | Verify reset OTP, update password hash, invalidate sessions |
| POST | `/login` | Public | Authenticate with email & password, return user & JWT |
| GET | `/me` | Authenticated | Retrieve authenticated user profile and roles |

---

## 2. Users & Profiles (`/api/users`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/:id` | Public | Get public gaming profile, badges, and linked games |
| PATCH | `/profile` | Authenticated | Update user full name, bio, region, discord tag, riot ID |
| GET | `/:id/games` | Public | Get games played by user |
| POST | `/games` | Authenticated | Link a competitive game with rank, role, hours played |
| DELETE | `/games/:gameId` | Authenticated | Unlink game from profile |

---

## 3. Games Catalog (`/api/games`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List games with search and genre filters |
| GET | `/:slug` | Public | Get game details by slug |
| POST | `/` | Admin | Create a new game in catalog |

---

## 4. Coaches & Coaching Sessions (`/api/coaches` & `/api/coaching`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/coaches` | Public | List coaches with rank, game, and rating filters |
| GET | `/api/coaches/:id` | Public | Get coach profile, specializations, rates, and reviews |
| POST | `/api/coaching/sessions` | Authenticated | Request a 1-on-1 coaching session with goals |
| GET | `/api/coaching/sessions` | Authenticated | List user coaching sessions |
| GET | `/api/coaching/sessions/:id` | Authenticated | Get session details & room metadata |
| PATCH | `/api/coaching/sessions/:id/status`| Authenticated | Update session status (`READY`, `LIVE`, `COMPLETED`, `CANCELLED`) |
| POST | `/api/coaching/reviews` | Authenticated | Submit 1-5 star review for completed session |

---

## 5. Friends System (`/api/friends`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated | List user's friends with online status |
| GET | `/requests` | Authenticated | List incoming and outgoing pending friend requests |
| POST | `/request` | Authenticated | Send friend request to a gamer |
| POST | `/requests/:id/accept` | Authenticated | Accept incoming friend request |
| POST | `/requests/:id/reject` | Authenticated | Reject incoming friend request |
| DELETE | `/requests/:id/cancel` | Authenticated | Cancel sent friend request |
| DELETE | `/:friendId` | Authenticated | Remove friend |

---

## 6. Real-Time Chat (`/api/conversations`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated | List all active conversations with last message |
| POST | `/` | Authenticated | Create or find 1-to-1 conversation with recipient |
| GET | `/:id/messages` | Authenticated | Fetch messages history for conversation |
| POST | `/:id/messages` | Authenticated | Send message in conversation |

---

## 7. Notifications (`/api/notifications`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated | Get user notifications and unread counter |
| PATCH | `/:id/read` | Authenticated | Mark specific notification as read |
| POST | `/read-all` | Authenticated | Mark all notifications as read |

---

## 8. Admin Control Center (`/api/admin`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/stats` | Admin | Total users, coaches, sessions, messages, and games |
| GET | `/users` | Admin | List and search users |
| PATCH | `/users/:id/block` | Admin | Block or unblock a user |
| PATCH | `/users/:id/role` | Admin | Change user role (`USER`, `COACH`, `ADMIN`) |
| PATCH | `/coaches/:id/verify` | Admin | Verify a coach profile |
