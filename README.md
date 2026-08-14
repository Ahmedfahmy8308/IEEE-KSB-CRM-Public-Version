<div align="center">

<img src="https://upload.wikimedia.org/wikipedia/commons/2/21/IEEE_logo.svg" alt="IEEE Logo" width="120" />

# ⚡ IEEE KSB CRM

### Enterprise Candidate & Event Operations Platform

**Official CRM and Operations Management Platform for IEEE Kafr El-Sheikh Student Branch (IEEE KSB) — streamlining applicant recruitment, multi-season interviews, Welcome Day attendee logistics, live QR check-ins, automated email dispatch, and Google Sheets integration.**

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-11-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Google Sheets](https://img.shields.io/badge/Google%20Sheets-API%20v4-34A853?style=for-the-badge&logo=googlesheets&logoColor=white)](https://developers.google.com/sheets/api)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5-0170FE?style=for-the-badge&logo=antdesign&logoColor=white)](https://ant.design/)

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A5%2018.18-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)
[![Engineered by UFUQ Tech](https://img.shields.io/badge/Engineered%20by-UFUQ%20Tech-0A84FF?style=flat-square)](https://ufuq-tech.com)

</div>

---

## 🌐 Official Production & Mirror Domains

| Domain Type | URL | Description |
|---|---|---|
| **Primary Domain** | [crm.ieee-ksb.org](https://crm.ieee-ksb.org) | Official IEEE KSB CRM Production Portal |
| **Mirror Domain** | [ieee-ksb.ufuq-tech.com](https://ieee-ksb.ufuq-tech.com) | UFUQ Tech Dedicated Cloud Mirror |
| **IEEE KSB Website** | [ieee-ksb.org](https://ieee-ksb.org) | IEEE Kafr El-Sheikh Student Branch Official Website |
| **Parent Organization** | [ieee.org](https://www.ieee.org) | Institute of Electrical and Electronics Engineers (IEEE) |

---

## 🎬 Video Demos

| Video | Description |
|---|---|
| [▶️ Full System Walkthrough](https://drive.google.com/file/d/1QI-BJKc6EPBEfKN_oHe83fL3_EIudNIb/view?usp=drive_link) | Complete walkthrough of the entire CRM system architecture |
| [▶️ Board System Features](https://drive.google.com/file/d/1623X_vd6iWfo-kBZ2V9ZCz75up3t4zKN/view?usp=sharing) | Walkthrough focused on the Board & Committee-level workflows |

---

## 📁 Google Drive Resources

| Resource | Link |
|---|---|
| **Main Folder** (all project assets) | [Open in Drive](https://drive.google.com/drive/folders/1cpxpDejDjHklKV54yYt2zrfrf3ICRfYa?usp=drive_link) |
| **Database Templates** | [Open in Drive](https://drive.google.com/drive/folders/1MPq6a1yDNz_-2t7Vcnrdfzq14zFGIcc5?usp=drive_link) |
| **Forms Folder** (requirements) | [Open in Drive](https://drive.google.com/drive/folders/1iSiyJwbayA1Wx_bJ4kkoHTFa1mkBhNGz?usp=drive_link) |
| **Videos Folder** (tutorials & demos) | [Open in Drive](https://drive.google.com/drive/folders/1yGkRMqCMPk6_OOsH5i9z13vtGcIUa-OE?usp=drive_link) |

---

## Table of Contents

- [Official Production & Mirror Domains](#-official-production--mirror-domains)
- [Video Demos](#-video-demos)
- [Google Drive Resources](#-google-drive-resources)
- [Features](#features)
- [System Architecture & Modules](#system-architecture--modules)
  - [1. Authentication & Role-Based Access (RBAC)](#1-authentication--role-based-access-rbac)
  - [2. Interview Management](#2-interview-management)
  - [3. Welcome Day Event Management](#3-welcome-day-event-management)
  - [4. Automated Email Dispatch Engine](#4-automated-email-dispatch-engine)
  - [5. Google Forms Pull Engine (Real-Time Import)](#5-google-forms-pull-engine-real-time-import)
  - [6. Data Integrity & Validation System](#6-data-integrity--validation-system)
  - [7. Cloud Runtime Configuration](#7-cloud-runtime-configuration)
  - [8. Google Sheets Enterprise Data Layer](#8-google-sheets-enterprise-data-layer)
- [API Reference](#api-reference)
- [Pages & UI Components](#pages--ui-components)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started with pnpm](#getting-started-with-pnpm)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Authors & Acknowledgments](#authors--acknowledgments)
- [License](#license)

---

## Features

| Module | Highlights |
|---|---|
| **Interviews** | Multi-season (`S1` / `S2`) applicant tracking, committee breakdown, automated schedule slotting, fuzzy search & filter, detailed applicant profiles with field-level role gating |
| **Welcome Day** | Attendee lifecycle management, automated ticket ID & QR-code generation, batch ZIP export, real-time camera scanner, payment verification |
| **Email Engine** | High-throughput batch email dispatch with responsive HTML templates (invitation, acceptance, rejection), test mode, approved-email queue, WhatsApp group link injection |
| **Pull Engine** | Real-time import from external Google Forms response sheets into the centralized database with timestamp deduplication and Arabic/English locale parsing |
| **Validation** | Duplicate detection (emails, phone numbers, form addresses), email-mismatch reports with 1-click batch auto-resolution |
| **Auth & RBAC** | Secure JWT HTTP-only cookies, granular role hierarchy (`ChairMan` → `Highboard` → `Board` → `Member`), field-level editing permissions |
| **Chairman Config** | In-app modal to modify sheet mappings, email throttling, and pull endpoints on the fly with zero redeployment |
| **Analytics** | Real-time interactive dashboard statistics cards, committee breakdowns with responsive data tables |

---

## System Architecture & Modules

### 1. Authentication & Role-Based Access (RBAC)

| Function | Description |
|---|---|
| **Login & Verification** | Authenticates credentials against the centralized `Users` sheet with salted bcrypt hashing, issuing a signed JWT in an HTTP-only cookie (7-day validity). |
| **Role Hierarchy** | `ChairMan` (unrestricted access) → `highboard` (branch-wide analytics, restricted fields) → `board` (committee-scoped view and evaluations). |
| **Field-level Security** | `ChairMan` can edit all 31 columns. `Highboard`/`Board` can only modify `state`, `note`, and `approved`. |
| **Committee Scoping** | Board members only access candidate records assigned to their specific committee. |
| **Season Access Gate** | Each user profile defines season permissions (`S1`, `S2`, `S1,S2`, or `all`). |

### 2. Interview Management

| Function | Description |
|---|---|
| **Multi-Season Architecture** | Dual independent schema tabs for Season 1 (28 columns, A–AB) and Season 2 (31 columns, A–AE with cross-season S1 ID validation and Interview Mode). |
| **Candidate Search & Filter** | Real-time fuzzy query across candidate ID, phone number, email address, and full name. |
| **Audit Logging** | Every modification appends a timestamped log entry with the actor's username to the candidate's `log` column. |
| **Automated Slot Scheduler** | Auto-calculates interview time slots across active days (Sun–Thu) given start/end dates, work hours, slot duration, and parallel interview panels. |
| **Automated ID Generation** | Generates collision-free 5-digit numeric IDs for applicants upon pull or manual creation. |
| **Cross-Season S1 ID Matcher** | For Season 2 applicants, cross-verifies self-reported S1 IDs against Season 1 records to classify as `Matched`, `Need Review`, or `Wrong ID`. |
| **Active Interviews Room** | Live status feed of candidates currently in `Wait in Reception` or `In Interview`, polling automatically every 30 seconds. |

### 3. Welcome Day Event Management

| Function | Description |
|---|---|
| **Attendee Tracking** | 17-column structured schema: personal information, committee preference, transaction reference, check-in status, QR payload, and audit logs. |
| **Sensitive Data Protection** | Protected attributes (national IDs, payment proof attachments) are masked for non-executive roles. |
| **Dynamic QR Generation** | Computes cryptographic ticket IDs (`WD-{timestamp}-{random}-{index}`) and renders high-density QR code PNGs. |
| **Batch QR Export** | Compiles all generated ticket QR images into an organized ZIP archive for bulk download. |
| **Hardware & Camera Scanner** | Browser-based QR scanning via device camera (`html5-qrcode`) with duplicate check-in prevention. |
| **Payment Verification** | Manages payment channels (InstaPay, Vodafone Cash), tracking verification states (`Passed`, `Not Checked`, `Failed`). |

### 4. Automated Email Dispatch Engine

| Function | Description |
|---|---|
| **SMTP Transport Layer** | High-performance Nodemailer connection pooling with Gmail SMTP and TLS. |
| **Interview Invitations** | Dispatches personalized interview schedule emails with candidate name, interview slot, date, and venue. |
| **Acceptance & Rejection Campaigns** | Dispatches tailored decision notices. Accepted applicant emails automatically embed committee-specific WhatsApp invitation links. |
| **Inline QR Code Embedding** | Welcome Day confirmations attach the unique QR code inline via CID attachments for instant rendering in email clients. |
| **Safe Test-Send Mode** | Allows ChairMan to simulate email campaigns by routing test emails to a dedicated sandbox inbox. |

### 5. Google Forms Pull Engine (Real-Time Import)

| Function | Description |
|---|---|
| **Automated Ingestion** | Connects to external Google Forms response sheets, transforms column structures, assigns candidate IDs, and appends records. |
| **High-Precision Deduplication** | Tracks the global maximum timestamp (`lastPullTimestamp`) to ensure zero duplicate entries even if records are pruned. |
| **Multilingual Date Normalizer** | Parses timestamps in Arabic (`10:30:16 م 2026/02/17`) and English formats (`M/D/YYYY H:MM:SS`, ISO 8601). |

### 6. Data Integrity & Validation System

| Function | Description |
|---|---|
| **Duplicate Phones** | Normalizes Egyptian telephone numbers (strips `+20` and leading zeroes) to locate duplicates. |
| **Duplicate Emails** | Identifies duplicated primary email addresses across applicants. |
| **Form vs. Contact Mismatches** | Detects discrepancies between the Google Account email and candidate-provided contact email. |
| **1-Click Quick Fix** | Automatically synchronizes contact emails to verified Google Form submission emails in bulk. |

### 7. Cloud Runtime Configuration

| Function | Description |
|---|---|
| **Sheets-Backed Config** | Configuration resides in `_Config!A1` as serialized JSON, operating identically in local environments and serverless Vercel deployments. |
| **In-App Control Center** | Visual modal interface for the ChairMan to configure sheet tab bindings, email throttling, and pull targets in real time. |

### 8. Google Sheets Enterprise Data Layer

| Function | Description |
|---|---|
| **Dual Auth Modes** | Supports local service-account key files (`GOOGLE_SERVICE_ACCOUNT_KEY_PATH`) and serverless inline private keys (`GOOGLE_PRIVATE_KEY`). |
| **Safe Appending** | Evaluates exact row bounds before executing `values.update` to prevent boundary corruption. |
| **Auto Grid Expansion** | Automatically provisions extra rows or columns when sheet grid limits are exceeded. |

---

## API Reference

### Auth
- `POST /api/auth/login` — Authenticate and issue HTTP-only JWT
- `POST /api/auth/logout` — Revoke authentication session
- `GET /api/auth/me` — Inspect current session context

### Config
- `GET /api/config` — Retrieve runtime configuration
- `PATCH /api/config` — Update runtime configuration

### Interviews
- `GET /api/interviews/members/[id]` — Retrieve member details
- `PATCH /api/interviews/members/[id]` — Update member record
- `GET /api/interviews/members/active` — Active interview states
- `GET /api/interviews/members/search` — Search members
- `GET /api/interviews/members/stats` — Overall interview metrics
- `GET /api/interviews/committee/stats` — Committee-specific metrics
- `GET /api/interviews/committee/members` — Committee member roster
- `POST /api/interviews/email/send/[id]` — Send invitation to single member
- `POST /api/interviews/email/send-unsent` — Batch send interview invitations
- `POST /api/interviews/email/send-test` — Send test invitations
- `POST /api/interviews/email/send-approved` — Batch send acceptance/rejection
- `POST /api/interviews/email/send-approved-test` — Test decision notices
- `POST /api/interviews/schedule/assign` — Auto-assign interview time slots
- `POST /api/interviews/schedule/Id` — Auto-generate candidate IDs
- `GET /api/interviews/pull` — Pull configuration status
- `POST /api/interviews/pull` — Ingest records from Google Forms
- `GET /api/interviews/validation` — Comprehensive validation scan
- `POST /api/interviews/validation/email-mismatches/quick-fix` — Batch fix email mismatches

### Welcome Day
- `GET /api/Welcome-Day/attendees/[id]` — Retrieve attendee profile
- `PATCH /api/Welcome-Day/attendees/[id]` — Update attendee profile
- `GET /api/Welcome-Day/attendees/active` — Full attendee directory
- `GET /api/Welcome-Day/attendees/search` — Search attendees
- `GET /api/Welcome-Day/attendees/stats` — Event attendance metrics
- `POST /api/Welcome-Day/email/send/[id]` — Send confirmation email with QR
- `POST /api/Welcome-Day/email/send-unsent` — Batch send confirmations
- `POST /api/Welcome-Day/qrcode/generate` — Generate QR codes & ticket IDs
- `GET /api/Welcome-Day/qrcode/download` — Download QR codes as ZIP
- `POST /api/Welcome-Day/attendance/scan` — QR scan check-in
- `POST /api/Welcome-Day/attendance/mark` — Manual attendee check-in
- `POST /api/Welcome-Day/pull` — Ingest Welcome Day form records
- `GET /api/Welcome-Day/validation` — Run attendee validation suite

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16 (Turbopack, App Router)](https://nextjs.org/) |
| **UI & Styling** | [React 19](https://react.dev/), [Ant Design 5](https://ant.design/), [Tailwind CSS 4](https://tailwindcss.com/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Package Manager** | [pnpm 11](https://pnpm.io/) |
| **Database** | [Google Sheets API v4](https://developers.google.com/sheets/api) via `googleapis` |
| **Auth** | [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| **Email** | [Nodemailer 9](https://nodemailer.com/) |
| **QR Engine** | [qrcode](https://github.com/soldair/node-qrcode) & [html5-qrcode](https://github.com/scanapp-org/html5-qrcode) |
| **Code Quality** | [ESLint 9](https://eslint.org/) & [Prettier](https://prettier.io/) |

---

## Project Structure

```
IEEE-CRM/
├── .env.example                 # Environment variables template
├── pnpm-workspace.yaml          # pnpm workspace configuration
├── pnpm-lock.yaml               # pnpm lockfile
├── package.json                 # Project dependencies & scripts
├── public/                      # Static assets & logos
│   ├── Logo/Logo2.png           # IEEE KSB Brand Logo
│   └── favicon.ico              # Browser icon
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout with SEO & Schema.org JSON-LD
│   │   ├── page.tsx             # Home & Season Selector
│   │   ├── login/               # Authentication Portal
│   │   ├── interviews/          # Interview Dashboard & Applicant Profiling
│   │   ├── Welcome-Day/         # Welcome Day Operations & QR Scanner
│   │   └── api/                 # 44 REST API Serverless Endpoints
│   ├── components/              # Reusable UI & Schema Components
│   │   ├── Footer.tsx           # Enterprise Footer
│   │   ├── StructuredData.tsx   # Schema.org JSON-LD Graph
│   │   ├── LoadingSpinner.tsx   # Animated Loader
│   │   └── ToastProvider.tsx    # Toast Notifications
│   ├── lib/                     # Server Utilities & Google Sheets Layer
│   │   ├── auth.ts              # JWT & Session Validation
│   │   ├── config.ts            # Dynamic Runtime Config
│   │   ├── email.ts             # Nodemailer Transporter
│   │   ├── members.ts           # Interview Business Logic
│   │   ├── welcomeDay.ts        # Welcome Day Business Logic
│   │   └── sheets/              # Typed Google Sheets API Wrappers
│   └── styles/                  # Tailwind CSS & Design System
└── templates/                   # Responsive HTML Email Templates
```

---

## Getting Started with pnpm

### 1. Clone the repository

```bash
git clone https://github.com/Ahmedfahmy8308/IEEE-CRM.git
cd IEEE-CRM
```

### 2. Install dependencies via pnpm

```bash
pnpm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in your `.env` file:

```env
SHEET_ID=your_google_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./service-account.json
# Or for Vercel/Production deployment:
# GOOGLE_SERVICE_ACCOUNT_EMAIL=...
# GOOGLE_PRIVATE_KEY=...

JWT_SECRET=your_secure_random_jwt_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM="IEEE KSB <your_email@gmail.com>"
NEXT_PUBLIC_APP_URL=https://crm.ieee-ksb.org
```

### 4. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server with Turbopack |
| `pnpm build` | Compile and verify production build |
| `pnpm start` | Run production server |
| `pnpm format` | Auto-format all code with Prettier |
| `pnpm format:check` | Check code formatting |
| `pnpm lint` | Run ESLint static analysis |

---

## Authors & Acknowledgments

- **Lead Software Architect & Engineer**: [Ahmed Fahmy](https://ahmed-fahmy.engineer) ([@Ahmedfahmy8308](https://github.com/Ahmedfahmy8308))
- **Engineering Agency**: [UFUQ Tech](https://ufuq-tech.com)
- **Organization**: [IEEE Kafr El-Sheikh Student Branch (IEEE KSB)](https://ieee-ksb.org)
- **Parent Institution**: [IEEE (Institute of Electrical and Electronics Engineers)](https://www.ieee.org)

---

## License

Copyright © 2026 **IEEE KSB** & **Ahmed Fahmy**. Engineered at **[UFUQ Tech](https://ufuq-tech.com)**.

This project is licensed under the [MIT License](LICENSE).
