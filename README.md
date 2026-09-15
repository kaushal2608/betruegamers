# BeTrueGamers — Production-Grade Gaming Platform

BeTrueGamers is a modern social gaming and live coaching platform where competitive gamers can build gaming identities, discover players and coaches, manage friendships, chat in real time, receive live notifications, and participate in 1-on-1 coaching sessions featuring real-time WebRTC screen sharing.

---

## 🎮 Key Features

- **Gamer Identity & Profiles**: Show off peak competitive ranks, game accounts (Riot ID, Steam ID, Discord Tag), played games, hours, and experience tiers.
- **Games Catalog**: Browse esports titles (Valorant, CS2, Fortnite, Apex Legends, GTA V, Minecraft) with active player statistics and associated coaches.
- **Player & Coach Discovery**: Multi-filter discovery arena by Game, Rank, Role, Experience, and Availability.
- **Friend System**: Send, accept, decline, and cancel friend requests with pair-ordered uniqueness and real-time alerts.
- **Real-Time 1-on-1 Chat**: Low-latency messaging, typing indicators, read receipts, and conversation histories powered by Socket.IO.
- **Pro Coaching Workflow**: Request 1-on-1 coaching sessions with custom goals and durations, coach acceptance flow, and status transitions (`REQUESTED` -> `ACCEPTED` -> `READY` -> `LIVE` -> `COMPLETED`).
- **WebRTC Live Screen Sharing**: Zero-latency peer-to-peer 60fps screen and audio streaming with mute controls, status indicators, and elapsed timer.
- **Verified Reviews & Ratings**: Post-session star ratings and feedback that update coach metrics in real time.
- **Admin Control Center**: Analytics overview (users, coaches, sessions, messages), user suspension/blocking, role management, and coach verification.
- **Email OTP Verification**: Secure 6-digit email verification with attempt limits and countdown cooldowns via Nodemailer.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14+ (App Router, JavaScript/JSX), Material UI (Dark Gaming Theme), Redux Toolkit, RTK Query, Socket.IO Client, WebRTC APIs |
| **Backend** | Node.js (ES Modules, JavaScript), Express.js, Socket.IO, Prisma ORM (`@prisma/client`), JWT, bcryptjs, Zod validation |
| **Database** | Supabase PostgreSQL 14+ with Prisma schema and relations (No Docker required) |
| **Real-Time & Media** | Socket.IO for signaling & presence; WebRTC (`RTCPeerConnection` & `getDisplayMedia`) for screen sharing |

---

## 📁 Repository Structure

```text
betruegamers/
├── .gitignore                # Global git ignore configuration
├── .env.example              # Environment variables reference template
├── docs/
│   ├── architecture.md       # High-level architecture & design patterns
│   ├── api.md                # Complete REST API specification
│   ├── database.md           # ERD & Prisma schema documentation
│   └── realtime.md           # Socket.IO & WebRTC signaling specification
├── backend/                  # Node.js + Express + Socket.IO server (ES Modules)
│   ├── package.json          # Backend dependencies and scripts
│   ├── prisma/
│   │   ├── schema.prisma     # Prisma ORM schema for Supabase
│   │   └── seed.js           # Prisma seed script
│   ├── src/                  # Express app, controllers, routes, sockets, config
│   └── test-api.js           # Automated endpoint test suite
└── frontend/                 # Next.js 14 App Router (JavaScript / JSX)
    ├── package.json          # Frontend dependencies and scripts
    ├── public/               # Public assets and icons
    └── src/                  # Next.js app pages, components, store, theme
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node v22.6.0)
- npm 9+
- Supabase account (or any PostgreSQL database)
- **No Docker required!**

### 2. Installation
Install dependencies for both backend and frontend:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Variables & Supabase Setup
- In `backend/`, copy `.env.example` to `.env`:
  ```bash
  cd backend
  cp .env.example .env
  ```
- In `frontend/`, copy `.env.example` to `.env.local`:
  ```bash
  cd frontend
  cp .env.example .env.local
  ```

Add your Supabase PostgreSQL credentials to `backend/.env`:
```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

### 4. Prisma Migration & Seed
Push the Prisma schema directly to your Supabase PostgreSQL database:
```bash
cd backend
npm run prisma:push
npm run prisma:seed
```

### 5. Running the Application
Run backend and frontend independently in two separate terminals:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```
*(Runs backend server on `http://localhost:5000`)*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
*(Runs Next.js frontend on `http://localhost:3000`)*

---

## 🧪 Verification & Testing
Run the backend test suite:
```bash
cd backend
node test-api.js
```
Run Next.js build verification:
```bash
cd frontend
npm run build
```

---

## 📄 License
MIT License. Built for competitive gamers and esports coaches.
