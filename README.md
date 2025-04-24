# Purple Music – Backend 🎚️
**NestJS API server for the Purple Music studio booking platform**

This is the backend for **Purple Music**, a real-world SaaS project built to automate bookings for a music studio. It handles authentication, data access, email verification, and business logic for the platform.

---

## 🛠️ Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/) + PostgreSQL
- **Auth**: [Passport.js](http://www.passportjs.org/)
- **Email**: [Resend](https://resend.com/) for transactional email
- **Docs**: Swagger / OpenAPI auto-generated from decorators
- **Testing**: Jest (currently WIP)
- **Validation**: class-validator + class-transformer

---

## 🔐 Authentication System

Fully modular auth system using Passport.js with the following strategies:

- Local credentials (bcrypt hashed passwords)
- Telegram OAuth
- Yandex OAuth

Tokens are issued using JWT and securely stored in cookies (handled by the frontend). Email verification and password resets are handled through secure token-based flows.

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend (Next.js)
    participant Backend as Backend (Nest.js)
    participant Resend as Resend API
    participant Email as User's Email

    rect rgb(191, 223, 255)
    note over User,Email: Registration Flow
    User->>Frontend: Submits registration form (email, password)
    Frontend->>Backend: POST /register (email, password)
    Backend->>Backend: Validate input, create user
    Backend->>Backend: Generate verification JWT
    Backend->>Resend: Send verification email with token
    Resend->>Email: Deliver verification email
    Email->>User: User checks email
    end

    rect rgb(255, 214, 153)
    note over User,Email: Email Verification Flow
    User->>Email: Clicks verification link
    Email->>Frontend: Opens /verify?token=<token>
    Frontend->>Backend: POST /verify (token)
    Backend->>Backend: Verify JWT token
    Backend->>Backend: Mark user as verified
    Backend->>Frontend: 200 OK (verified)
    Frontend->>User: Show verification status
    end

    rect rgb(200, 255, 200)
    note over User,Backend: Login Flow
    User->>Frontend: Enters email & password
    Frontend->>Backend: POST /login (email, password)
    Backend->>Backend: Check credentials
    Backend->>Backend: Generate access JWT
    Backend->>Frontend: Return access token
    Frontend->>Frontend: Store token in secure storage
    Frontend->>User: Redirect to dashboard
    end

    rect rgb(255, 200, 200)
    note over User,Backend: Authorized Request Flow
    User->>Frontend: Performs authorized action
    Frontend->>Backend: Request with JWT in header
    Backend->>Backend: Verify JWT
    Backend->>Backend: Check user permissions
    Backend->>Frontend: Return protected data
    Frontend->>User: Display results
    end
```

---

## 🗃️ Database

- Managed with Prisma and PostgreSQL
- Schema designed from scratch
- Includes:
    - Users
    - Bookings
    - Studios
    - Availability
    - Email verification tokens, password reset tokens, etc.

---

## 📚 API Documentation

- Fully documented using **Swagger**
- Available at `/api/docs` when the server is running
- Auto-generated from decorators and DTOs

---

## 📁 Project Structure (simplified)

```bash
/src
├── auth               # Passport strategies + auth service
├── booking            # Booking-related logic
├── time-slots         # Current taken slots
├── free-slots         # Dynamically calculated free slots out of taken slots
├── studio             # Studio and schedule management
├── users              # User management
├── common             # Exceptions, mails, etc
├── main.ts            # Entry point
/prisma
├── migrations        # Prisma migrations
├── schema.prisma      # Prisma schema
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client
npm prisma generate

# Run development server
npm start:dev
```

Requires:
- `.env` file with database URL, JWT secret, Resend API key, OAuth secrets, etc.

---

## 🧪 Tests

Basic test setup using **Jest**. Test coverage is limited for now and a work in progress.

```bash
$ npm run test

# test coverage
$ npm run test:cov
```

---

## 📋 TODOs & Improvements

- [ ] Expand unit and e2e tests
- [ ] Add rate limiting and better logging

## 🤖 Integration Points

- Frontend (Next.js app via REST API)
- Telegram Mini App (auth integration)
- Docker-based infra (home lab hosted)

## 🧑‍💻 Author

Built and maintained by @KhoDis. Part of a fullstack real-world project for managing a real studio’s operations.


## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e
```
