# Odoo Appointment Booking

>A full-stack appointment booking system with admin panel, organizer/staff management, customer bookings, and secure cancellation/refund flows.

## Overview

This repository contains a two-part application:

- `backend/` - Node.js + Express API server (PostgreSQL via Prisma / pg), authentication, booking logic, email notifications, and file uploads (Cloudinary).
- `frontend/` - Next.js (App Router) front-end with an admin interface, organizer dashboards, and customer booking pages. Styled with Tailwind CSS and using Redux Toolkit for state management.

The project is designed to manage appointment types, staff, resources, and bookings. It includes:

- Admin panel with user & appointment management
- Organizer and staff flows to manage availability
- Customer booking flow with customizable questions per appointment
- Payment and refund handling (with safe cancellation policies)

## Key Features

- Multi-role authentication: Admin, Organizer, Staff, Customer
- Admin dashboard with statistics and navigation
- Appointment types with custom questions (short/long text, multiple choice, dropdown, yes/no, date, number)
- Booking lifecycle: create, cancel (with refund calculation), reschedule
- Email notifications and password reset flow
- Image uploads via Cloudinary
- PostgreSQL database with Prisma and raw queries where needed

## Tech Stack

- Backend: Node.js, Express, PostgreSQL (pg), Prisma
- Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS
- State: Redux Toolkit
- Other: Framer Motion, Lucide icons, Axios, Nodemailer

## Quickstart (Development)

Make sure you have Node.js (>= 18), npm/yarn, and PostgreSQL installed.

1. Clone the repo

```powershell
git clone https://github.com/sujal690/Odoo_Appointment_Booking.git
cd Odoo_Appointment_Booking
```

2. Backend setup

```powershell
cd backend
npm install
# Create a .env file with the variables listed below
npm run dev
```

3. Frontend setup

```powershell
cd frontend
npm install
# Create a .env.local file (see below)
npm run dev
```

Open the frontend at http://localhost:3000 and the backend at http://localhost:5000 (defaults used in this project).

## Environment Variables

Create a `backend/.env` file and set at minimum:

```
DATABASE_URL=postgresql://user:password@localhost:5432/yourdb
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
# Optional SMTP settings for real emails
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=yourpassword
SMTP_FROM="Odoo Appointment" <noreply@example.com>
```

Create a `frontend/.env.local` file with:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Database & Migrations

This project uses Prisma for schema and migrations. To run migrations (or the provided migration script):

```powershell
cd backend
npm run migrate
```

Check `backend/prisma` and `backend/db/migrations` for migration files.

## Contributing

Contributions are welcome. Please open an issue for discussion and submit PRs against the `main` branch. Follow the existing code style (ESLint/Prettier not enforced in repo) and include tests where appropriate.

## License

This project is provided as-is for educational/demo purposes.
