# ChatSphere - Full-Stack Real-Time Chat Application

ChatSphere is a modern, real-time chat application built with Java Spring Boot and React. It features multi-user support, real-time messaging using WebSockets, and a comprehensive Super Admin Dashboard for system moderation.

## Features

- **Real-Time Messaging**: Built with Spring WebSockets (STOMP) and SockJS.
- **Modern UI**: Crafted with React, TailwindCSS, and Framer Motion for smooth animations.
- **Authentication**: Secure JWT-based authentication with Role-Based Access Control (RBAC).
- **Super Admin Dashboard**:
    - Monitor system statistics (Total users, Active users, Messages).
    - Manage all users (View profile, Block/Unblock).
    - Moderation tools.
- **Chat Features**:
    - One-to-one and Group chats.
    - Message status (Sent/Delivered/Seen).
    - Typing indicators.
    - Responsive design for mobile and desktop.

## Tech Stack

- **Backend**: Java 21, Spring Boot 3.2.4, Spring Security, Spring Data JPA, PostgreSQL.
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Lucide React, StompJS.
- **Database**: PostgreSQL.

## Prerequisites

- JDK 21+
- Node.js 18+
- **PostgreSQL 15+**

## Database Setup (Local vs Cloud)

### Option A: Local PostgreSQL (On your laptop)
1. **Install**: Download from [PostgreSQL.org](https://www.postgresql.org/download/windows/).
2. **Create Database**: Run `CREATE DATABASE chatsphere;` in pgAdmin.
3. **Config**: Update `backend/src/main/resources/application.yml` with `localhost` credentials.

### Option B: Cloud Database (Online - Recommended)
If you don't want your database to "sleep" or "pause" due to inactivity, use **Aiven** or **Neon**:

1. **Aiven (Always On)**:
   - Go to [Aiven.io](https://aiven.io/) and sign up.
   - Create a **Free Plan** PostgreSQL project.
   - **Benefit**: It does not "sleep" or pause like Supabase.
2. **Neon (Fast Wake)**:
   - Go to [Neon.tech](https://neon.tech/).
   - **Benefit**: It might "suspend" to save energy, but it wakes up **instantly** (in <1s) the moment your app tries to connect.
3. **Update Config**: 
   - Open `backend/src/main/resources/application.yml`.
   - Replace the `url`, `username`, and `password` with your cloud credentials.

Example Cloud Config:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://ep-cool-water-123456.us-east-2.aws.neon.tech/chatsphere?sslmode=require
    username: your_cloud_username
    password: your_cloud_password
```

---

### Backend (Spring Boot)
1. Navigate to `/backend`.
2. Update `src/main/resources/application.yml` with your PostgreSQL credentials.
3. Run the application:
   ```bash
   mvn spring-boot:run
   ```
   The server will start on `http://localhost:8080`.

### Frontend (React)
1. Navigate to `/frontend`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## Sample Test Users

| Username | Password | Role |
|----------|----------|------|
| admin | password | ROLE_SUPER_ADMIN |
| user1 | password | ROLE_USER |
| user2 | password | ROLE_USER |

> [!NOTE]
> For the first time, you can register a user through the UI. To make a user a Super Admin, update their role to `ROLE_SUPER_ADMIN` in the `users` table via SQL or use the provided Admin Controller if a bootstrap script is added.

## Folder Structure

- `/backend`: Spring Boot source code, controllers, models, and security config.
- `/frontend`: React source code, components, pages, and Tailwind config.
# -ChatSphere
