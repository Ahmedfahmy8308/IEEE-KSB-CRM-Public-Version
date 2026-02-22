<div align="center">

# IEEE KSB CRM

**A full-stack management system for IEEE KSB — handling applicant interviews, Welcome-Day events, attendance, email campaigns, QR codes, and more.**

Built with **Next.js 16 · React 19 · TypeScript · Google Sheets API · Tailwind CSS · Ant Design**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## Table of Contents

- [Features](#features)
- [System Functions](#system-functions)
  - [Authentication & Authorization](#1-authentication--authorization)
  - [Interview Management](#2-interview-management)
  - [Welcome Day Management](#3-welcome-day-management)
  - [Email System](#4-email-system)
  - [Pull Records](#5-pull-records-google-forms-import)
  - [Data Validation](#6-data-validation)
  - [Runtime Configuration](#7-runtime-configuration)
  - [Google Sheets Layer](#8-google-sheets-data-layer)
- [API Reference](#api-reference)
- [Pages & UI Components](#pages--ui-components)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the repository](#1-clone-the-repository)
  - [2. Install dependencies](#2-install-dependencies)
  - [3. Set up Google Sheets](#3-set-up-google-sheets)
  - [4. Configure environment variables](#4-configure-environment-variables)
  - [5. Configure runtime settings](#5-configure-runtime-settings)
  - [6. Run the development server](#6-run-the-development-server)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Runtime Config (`config.json`)](#runtime-config-configjson)
- [Deployment](#deployment)
- [License](#license)

---

## Features

| Module | Highlights |
|---|---|
| **Interviews** | Multi-season (S1 / S2) applicant tracking, committee breakdown, schedule assignment, search & filter, per-member detail pages with role-based editing |
| **Welcome Day** | Attendee management, QR-code generation & download, live attendance scanning, payment validation |
| **Email Campaigns** | Batch email sending with HTML templates (invitation, accepted, rejected), test-send mode, approved-email flow |
| **Pull Records** | One-click import from external Google Forms response sheets into the main spreadsheet |
| **Validation** | Duplicate detection (email, phone, national ID), email-mismatch reports |
| **Auth & RBAC** | JWT cookie-based authentication, role hierarchy (ChairMan → Highboard → Board → Member), field-level edit permissions |
| **Chairman Config** | In-app modal to edit sheet names, email settings, and pull-source config — no redeployment needed |
| **Stats & Charts** | Live stats cards, committee breakdowns with animated UI |

---

## System Functions

### 1. Authentication & Authorization

| Function | Description |
|---|---|
| **Login** | Verify username/password against the Users sheet (bcrypt or plaintext), issue a signed JWT stored in an HTTP-only cookie (7-day expiry) |
| **Logout** | Clear the auth cookie |
| **Session Check** | Decode the JWT from the request cookie and return the authenticated user |
| **Role Hierarchy** | `ChairMan` (full access) → `highboard` (read stats, limited edits) → `board` (committee-scoped view, minimal edits) |
| **Field-level Permissions** | ChairMan can edit all fields. Highboard/Board can only edit `state`, `note`, and `approved` |
| **Committee Scoping** | Board users only see members belonging to their own committee |
| **Season Access** | Each user has an `accessSeason` field (`S1`, `S2`, `S1,S2`, or `all`) controlling which seasons they can access |

### 2. Interview Management

| Function | Description |
|---|---|
| **Multi-Season Support** | Separate sheet tabs for Season 1 (28 columns, A–AB) and Season 2 (30 columns, A–AD with extra S1 ID validation fields) |
| **Get Member by ID** | Lookup an applicant by their unique 5-digit ID |
| **Search Members** | Fuzzy search across ID, phone, email, and full name |
| **Update Member** | Role-gated field updates with automatic change logging (timestamp + actor username appended to the `log` column) |
| **Batch Update** | Update multiple member rows in a single API call |
| **Statistics** | Compute totals, state distribution (Not Started / Wait in Reception / In Interview / Complete / Not Attended), email-sent counts, schedule-assigned counts, approval breakdown |
| **Schedule Assignment** | Auto-generate interview time slots (Sun–Thu) from a config: start/end date, start/end time, interval minutes, parallel seats. Assigns unassigned members sequentially. |
| **ID Generation** | Generate unique random 5-digit numeric IDs for members without IDs, with collision checking |
| **S2 ID Validation** | When pulling S2 records, cross-reference the `S1_ID_ENTERED` field against all S1 IDs to flag `Matched`, `Need Review`, or `Wrong ID` |
| **Active Interviews** | Real-time view of members currently in `Wait in Reception` or `In Interview` states, auto-refreshing every 30 seconds |
| **Committee Breakdown** | Per-committee member counts with drill-down to member lists. Optional date-based filtering |

### 3. Welcome Day Management

| Function | Description |
|---|---|
| **Attendee Tracking** | 17-column schema per attendee: personal info, committee, payment details, check status, QR code, attendance, email status, notes, log |
| **Get Attendee** | Lookup by row index or ticket ID. Sensitive data (`nationalId`, `paymentScreenshot`) hidden for non-ChairMan roles |
| **Search Attendees** | Search by name, email, phone, or ticket ID with role-based data filtering |
| **Update Attendee** | Protected fields (`nationalId`, `paymentScreenshot`, `qrCode`) cannot be edited via API. ChairMan: 12 editable fields. Others: `checked`, `attended`, `note` only. All changes logged. |
| **QR Code Generation** | Generate unique ticket IDs (`WD-{timestamp}-{random}-{index}`) and render QR code PNG images saved to `public/Welcome-Day/qrcode/` |
| **QR Code Download** | Download all generated QR codes as a single ZIP archive |
| **Attendance Scanning** | Scan a QR code via device camera (using `html5-qrcode`) to mark attendance. Detects already-attended status. Manual ID entry also supported. |
| **Mark Attendance** | Mark attendance by ticket ID or attendee row ID |
| **Payment Validation** | Track payment method (Instapay / Vodafone Cash), reference number, and screenshot. Validation status: `Passed`, `Not Checked`, `Failed` |
| **Statistics** | Total attendees, emails sent, attended count, validation passed/failed/unchecked, payment method breakdown, QR codes generated |
| **Committee Breakdown** | Per-committee stats with drill-down |

### 4. Email System

| Function | Description |
|---|---|
| **SMTP Transport** | Nodemailer with Gmail SMTP (configurable host/port/TLS). Connection pooling for batch sends. |
| **Interview Invitation** | Send interview schedule email using `interview_invitation.html` template with placeholders for name, date, time, etc. |
| **Batch Send (Unsent)** | Send to all members where `isEmailSend ≠ TRUE`. Configurable batch size and delay between batches. Updates sheet in batch after all sends. |
| **Test Send** | Send one test email per committee to the configured `testEmail` address |
| **Approved/Rejected Emails** | Send acceptance or rejection emails using role-specific templates (`accepted_board`, `accepted_committee`, `rejected_board`, `rejected_committee`). Accepted committee emails include WhatsApp group invite links loaded from `WhatsAppGroup.csv`. |
| **Approved Test Send** | Send 2 test emails per committee (1 accepted + 1 rejected) to `testEmail` |
| **Send to Specific Member** | Send invitation or approved/rejected email to a single member by ID. Supports resending. |
| **Welcome Day Confirmation** | Send confirmation email with the attendee's QR code image embedded inline (CID attachment) using `welcome_day_confirmation.html` |
| **Template Engine** | Fill HTML template placeholders (`{{fullName}}`, `{{interviewDay}}`, `{{committee}}`, `{{whatsappLink}}`, etc.) |

### 5. Pull Records (Google Forms Import)

| Function | Description |
|---|---|
| **Interview Pull** | Read from an external Google Forms response sheet, map columns to the internal schema, generate 5-digit IDs, deduplicate by timestamp, and append new records. |
| **S2 Pull with Validation** | For Season 2, the pull also reads the `S1_ID_ENTERED` column and cross-checks against all S1 IDs, tagging each record as `Matched` / `Need Review` / `Wrong ID`. Sets `pullSource = "pull"`. |
| **Welcome Day Pull** | Import from a Google Forms sheet (11 columns: timestamp through referenceNumber), set `checked = "Not Checked"`, deduplicate by timestamp, append new rows. |
| **Config-Driven** | Each pull source (interview S1/S2, welcome day S1/S2) is independently configured with `active` toggle, `originSheetId`, and `originTabName` in `config.json`. |

### 6. Data Validation

| Function | Description |
|---|---|
| **Duplicate Phone Numbers** | Find applicants sharing the same phone (Egyptian numbers normalized: strip `+20` / leading `0`) |
| **Duplicate Emails** | Find applicants sharing the same email address |
| **Duplicate Form Email Addresses** | Find duplicates in the Google Forms `emailAddress` field |
| **Email Mismatches** | Find applicants where the self-entered `email` differs from the Google Forms `emailAddress` |
| **Combined Validation** | Run all 4 checks in a single API call and return grouped results |

### 7. Runtime Configuration

| Function | Description |
|---|---|
| **Read Config** | Load `config.json` from disk, deep-merged with defaults so new fields are always present |
| **Update Config** | Deep-merge a partial update into the existing config and write back to disk |
| **Config UI** | In-app modal (ChairMan only) with three tabs: Sheet Names, Email Settings, Pull Config. Supports edit/confirm/discard flow. |
| **No Redeploy** | Config changes take effect immediately — no server restart or redeployment required |

### 8. Google Sheets Data Layer

| Function | Description |
|---|---|
| **Singleton Client** | Google Sheets API v4 client with two auth modes: service-account key file (local dev) or inline credentials (Vercel/production) |
| **Read Range** | Read a cell range from the main spreadsheet with auto sheet-name validation |
| **Read External** | Read from a different spreadsheet (used by Pull Records) |
| **Append Rows** | Find the first empty row after existing data and write via `values.update` (avoids unreliable `values.append` boundary detection) |
| **Update Range** | Overwrite a specific cell range |
| **Batch Update** | Execute multiple range updates in a single API call |
| **Auto-Expand Grid** | Automatically add rows or columns when the current sheet grid is too small |
| **Column Mapping** | Typed column index constants for Interview (28/30 cols) and Welcome Day (17 cols) with `rowToObject` / `objectToRow` converters |

---

## API Reference

### Auth

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/login` | Verify credentials, set JWT cookie | None |
| `POST` | `/api/auth/logout` | Clear auth cookie | None |
| `GET` | `/api/auth/me` | Get current user | Any |

### Config

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/config` | Read runtime config | ChairMan |
| `PATCH` | `/api/config` | Update runtime config (deep merge) | ChairMan |

### Image Proxy

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/image-proxy?url=` | Proxy Google Drive images (1-year cache) | None |

### Interview — Members

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/interviews/members/[id]?season=` | Get member by ID | Any (scoped) |
| `PATCH` | `/api/interviews/members/[id]?season=` | Update member (field-restricted) | Any (scoped) |
| `GET` | `/api/interviews/members/active?season=` | Members in active interview states | Any (scoped) |
| `GET` | `/api/interviews/members/search?q=&season=` | Search by ID / phone / email / name | Any (scoped) |
| `GET` | `/api/interviews/members/stats?season=` | Overall statistics | ChairMan, Highboard |

### Interview — Committee

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/interviews/committee/stats?committee=&season=` | Committee statistics (optional date filter) | Any |
| `GET` | `/api/interviews/committee/members?committee=&season=` | Committee member list | Any |

### Interview — Email

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/interviews/email/send/[id]?season=` | Send invitation to specific member | ChairMan |
| `POST` | `/api/interviews/email/send-unsent?season=` | Batch send to all unsent members | ChairMan |
| `POST` | `/api/interviews/email/send-test?season=` | Send test emails (1 per committee) | ChairMan |
| `POST` | `/api/interviews/email/send-approved?season=` | Batch send accepted/rejected emails | ChairMan |
| `POST` | `/api/interviews/email/send-approved-test?season=` | Test accepted/rejected emails | ChairMan |
| `POST` | `/api/interviews/email/send-approved/[id]?season=` | Send accepted/rejected to specific member | ChairMan |

### Interview — Schedule & IDs

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/interviews/schedule/assign?season=` | Auto-assign interview slots | ChairMan |
| `POST` | `/api/interviews/schedule/Id?season=` | Generate unique 5-digit IDs | ChairMan |

### Interview — Pull & Validation

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/interviews/pull?season=` | Get pull config status | ChairMan |
| `POST` | `/api/interviews/pull?season=` | Pull records from Google Forms | ChairMan |
| `GET` | `/api/interviews/validation?season=` | Run all validations | ChairMan, Highboard |
| `GET` | `/api/interviews/validation/duplicate-phones?season=` | Find duplicate phones | ChairMan, Highboard |
| `GET` | `/api/interviews/validation/duplicate-emails?season=` | Find duplicate emails | ChairMan, Highboard |
| `GET` | `/api/interviews/validation/duplicate-email-addresses?season=` | Find duplicate form emails | ChairMan, Highboard |
| `GET` | `/api/interviews/validation/email-mismatches?season=` | Find email mismatches | ChairMan, Highboard |

### Welcome Day — Attendees

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/Welcome-Day/attendees/[id]?season=` | Get attendee (sensitive data filtered) | Any (scoped) |
| `PATCH` | `/api/Welcome-Day/attendees/[id]?season=` | Update attendee (field-restricted) | Any (scoped) |
| `GET` | `/api/Welcome-Day/attendees/active?season=` | Get all attendees | ChairMan |
| `GET` | `/api/Welcome-Day/attendees/search?q=&season=` | Search attendees | Any (scoped) |
| `GET` | `/api/Welcome-Day/attendees/stats?season=` | Attendee statistics | ChairMan, Highboard |

### Welcome Day — Committee

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/Welcome-Day/committee/stats?committee=&season=` | Committee stats | Any |
| `GET` | `/api/Welcome-Day/committee/members?committee=&season=` | Committee member list | Any |

### Welcome Day — Email

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/Welcome-Day/email/send/[id]?season=` | Send confirmation with QR code | ChairMan |
| `POST` | `/api/Welcome-Day/email/send-unsent?season=` | Batch send to unsent attendees | ChairMan |
| `POST` | `/api/Welcome-Day/email/send-test?season=` | Test emails (1 per committee) | ChairMan |

### Welcome Day — QR Codes & Attendance

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/Welcome-Day/qrcode/generate?season=` | Generate ticket IDs + QR code PNGs | ChairMan |
| `GET` | `/api/Welcome-Day/qrcode/download` | Download all QR codes as ZIP | Any |
| `POST` | `/api/Welcome-Day/attendance/scan?season=` | Scan QR code to mark attendance | ChairMan |
| `POST` | `/api/Welcome-Day/attendance/mark?season=` | Mark attendance by ticket/row ID | ChairMan |

### Welcome Day — Pull & Validation

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/Welcome-Day/pull?season=` | Get pull config status | ChairMan |
| `POST` | `/api/Welcome-Day/pull?season=` | Pull records from Google Forms | ChairMan |
| `GET` | `/api/Welcome-Day/validation?season=` | Run all validations | ChairMan |
| `GET` | `/api/Welcome-Day/validation/duplicate-phones?season=` | Find duplicate phones | ChairMan |
| `GET` | `/api/Welcome-Day/validation/duplicate-emails?season=` | Find duplicate emails | ChairMan |
| `GET` | `/api/Welcome-Day/validation/duplicate-email-addresses?season=` | Find duplicate form emails | ChairMan |
| `GET` | `/api/Welcome-Day/validation/email-mismatches?season=` | Find email mismatches | ChairMan |

> **Total: ~42 API endpoints**

---

## Pages & UI Components

### Pages

| Route | Description |
|---|---|
| `/` | **Home** — Season selection (S1 / S2) with role badge, animated IEEE KSB branding, links to Interviews and Welcome Day |
| `/login` | **Login** — Username/password form, auto-redirect if already authenticated |
| `/interviews/[season]` | **Interview Dashboard** — Tabs: Dashboard, Search, Schedule, Email, Approved Email, Validation, Pull. Board sees committee-scoped view; ChairMan/Highboard sees stats + committee breakdown |
| `/interviews/[season]/active-interviews` | **Active Interviews** — Real-time view of members in Reception/Interview states, auto-refresh every 30s |
| `/interviews/[season]/member/[id]` | **Member Detail** — Full applicant profile with section navigation, inline editing, Google Drive image proxy, status badges, S2 ID validation display |
| `/Welcome-Day/[season]` | **Welcome Day Dashboard** — Tabs: Dashboard, Search, Members, Email, Validation, Attendance, QR Codes, Pull |
| `/Welcome-Day/[season]/member/[id]` | **Attendee Detail** — Full attendee profile with PDF detection for payment screenshots, sensitive data gating, section navigation, inline editing |

### Interview Components

| Component | Description |
|---|---|
| **Sidebar** | Tab navigation, Config modal trigger, Active Interviews modal, mobile hamburger menu |
| **StatsCards** | Dashboard stat cards — totals, state breakdown, email/schedule counts. S2: ID validation stats |
| **CommitteeBreakdown** | All committees with member counts, click to drill-down |
| **CommitteeStats** | Single committee statistics with optional date filtering |
| **CommitteeMembersList** | Sortable member table with status color tags, click to view detail |
| **SearchPanel** | Search interface with Ant Design Table, status tags, links to member detail |
| **SchedulePanel** | Schedule config form (dates, times, interval, parallel seats) + ID generation button |
| **EmailPanel** | Interview invitation panel — send test, send all unsent, send by ID |
| **ApprovedEmailPanel** | Accepted/rejected email panel — send test, send all, send by ID, filter by status |
| **ValidationPanel** | Expandable sections showing duplicate phones/emails and mismatches |
| **PullPanel** | Pull trigger with config display, result summary (new/skipped/validated) |
| **ConfigModal** | 3-tab runtime config editor (Sheet Names, Email, Pull) with edit/confirm/discard |
| **ActiveInterviewsModal** | Quick modal view of active interviews without leaving dashboard |

### Welcome Day Components

| Component | Description |
|---|---|
| **Sidebar** | Tab navigation for Welcome Day sections |
| **StatsCards** | Stats — total, checked, attended, payment breakdown, QR count |
| **CommitteeBreakdown** | Committee distribution with drill-down |
| **CommitteeStats** | Single committee stats panel |
| **CommitteeMembersList** | Committee member table with status badges |
| **SearchPanel** | Attendee search by name/email/phone/ticket |
| **AllMembersList** | Full attendee list (ChairMan only) — sortable, filterable by committee and payment method |
| **EmailPanel** | Welcome Day confirmation email panel — send test, send unsent, send specific |
| **ValidationPanel** | Data validation results display |
| **AttendancePanel** | QR camera scanner (html5-qrcode) + manual ID input, attendee confirmation before marking |
| **QRCodePanel** | Generate ticket IDs + QR images, download all as ZIP |
| **PullPanel** | Pull from Google Forms with result display |

### Shared Components

| Component | Description |
|---|---|
| **ToastProvider** | React context with `useToast()` hook — success (green), error (red), warning (amber), info (blue) |
| **LoadingSpinner** | Full-page spinner with IEEE logo, dual spin animation, bouncing dots |
| **Footer** | App footer with credits and external links |

### Email Templates

| Template | Used For |
|---|---|
| `interview_invitation.html` | Interview schedule invitation |
| `accepted_board.html` | Board-level acceptance |
| `accepted_committee.html` | Committee-level acceptance (with WhatsApp link) |
| `rejected_board.html` | Board-level rejection |
| `rejected_committee.html` | Committee-level rejection |
| `welcome_day_confirmation.html` | Welcome Day confirmation with inline QR code |
| `WhatsAppGroup.csv` | Committee → WhatsApp group invite link mapping |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| UI | [React 19](https://react.dev/), [Ant Design 5](https://ant.design/), [Tailwind CSS 4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) |
| Database | [Google Sheets API v4](https://developers.google.com/sheets/api) (via `googleapis`) |
| Auth | JWT ([jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)) + [bcryptjs](https://github.com/nicolo-ribaudo/bcrypt-edge) |
| Email | [Nodemailer](https://nodemailer.com/) (SMTP / Gmail) |
| QR Codes | [qrcode](https://github.com/soldair/node-qrcode), [html5-qrcode](https://github.com/nicolo-ribaudo/html5-qrcode) |
| Linting | [ESLint 9](https://eslint.org/) (flat config) + [Prettier](https://prettier.io/) |

---

## Project Structure

```
IEEE-KSB/
├── config.json                  # Runtime config (editable via Chairman UI)
├── .env                         # Secrets (never committed)
├── .env.example                 # Template for .env
├── templates/                   # HTML email templates
│   ├── interview_invitation.html
│   ├── accepted_board.html
│   ├── accepted_committee.html
│   ├── rejected_board.html
│   ├── rejected_committee.html
│   └── welcome_day_confirmation.html
├── public/                      # Static assets (QR codes, etc.)
├── src/
│   ├── app/
│   │   ├── page.tsx             # Home / season selection
│   │   ├── login/               # Login page
│   │   ├── interviews/          # Interview dashboard & member detail
│   │   ├── Welcome-Day/         # Welcome-Day dashboard & member detail
│   │   └── api/                 # Route handlers (REST API)
│   │       ├── auth/            # login · logout · me
│   │       ├── config/          # GET/PUT runtime config
│   │       ├── interviews/      # members · committee · email · schedule · pull · validation
│   │       └── Welcome-Day/     # attendees · committee · email · qrcode · pull · validation
│   ├── components/              # Shared UI components
│   └── lib/                     # Server utilities
│       ├── auth.ts              # JWT helpers
│       ├── config.ts            # config.json read/write
│       ├── email.ts             # Nodemailer transporter
│       ├── members.ts           # Interview business logic
│       ├── welcomeDay.ts        # Welcome-Day business logic
│       ├── validation.ts        # Duplicate / mismatch checks
│       └── sheets/              # Google Sheets CRUD
│           ├── base.ts          # Auth, read, write, expand
│           ├── interview.ts     # Interview column mapping
│           ├── welcomeDay.ts    # Welcome-Day column mapping
│           └── Users.ts         # User accounts
└── ...
```

---

## Prerequisites

| Tool | Version |
|---|---|
| **Node.js** | ≥ 18.18 (LTS recommended) |
| **npm** | ≥ 9 |
| **Google Cloud** service account | With Sheets API enabled |
| **Gmail account** (optional) | For email sending (with App Password) |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Ahmedfahmy8308/IEEE-KSB.git
cd IEEE-KSB
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Google Sheets

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project (or use an existing one).
2. Enable the **Google Sheets API**.
3. Create a **Service Account** and download the JSON key file.
4. Create a Google Spreadsheet and share it with the service account email (`...@...iam.gserviceaccount.com`) as **Editor**.
5. Note the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit
   ```

### 4. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

| Variable | Description |
|---|---|
| `SHEET_ID` | Main Google Spreadsheet ID |
| `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` | Path to your service-account JSON key (local dev) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email (production) |
| `GOOGLE_PRIVATE_KEY` | Service account private key (production) |
| `JWT_SECRET` | Random secret for signing auth tokens |
| `SMTP_HOST` | SMTP server hostname (default: `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (default: `465`) |
| `SMTP_SECURE` | Use TLS (default: `true`) |
| `SMTP_USER` | Sender email address |
| `SMTP_PASS` | Email password / Gmail App Password |
| `EMAIL_FROM` | From header (e.g. `IEEE KSB <you@gmail.com>`) |

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(128).toString('base64'))"
```

### 5. Configure runtime settings

The file `config.json` at the project root controls sheet names, email batching, and pull-record sources. It ships with sensible defaults. The **Chairman** role can also edit these settings live from the in-app Config modal.

```jsonc
{
  "sheetNames": {
    "interview_s1": "Interview_Season_1",
    "interview_s2": "Interview_Season_2",
    "welcome_day_s1": "Welcome_Day_Season_1",
    "welcome_day_s2": "Welcome_Day_Season_2",
    "users": "Users"
  },
  "email": {
    "batchSize": 21,
    "batchDelayMs": 2000,
    "testEmail": ""
  },
  "pull": {
    "interview_s1":   { "active": false, "originSheetId": "", "originTabName": "" },
    "interview_s2":   { "active": false, "originSheetId": "", "originTabName": "" },
    "welcome_day_s1": { "active": false, "originSheetId": "", "originTabName": "" },
    "welcome_day_s2": { "active": false, "originSheetId": "", "originTabName": "" }
  }
}
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format all source files with Prettier |
| `npm run format:check` | Check formatting (CI-friendly) |

---

## Environment Variables

All secrets live in `.env` (never committed). See [`.env.example`](.env.example) for the full template.

| Variable | Required | Default | Notes |
|---|---|---|---|
| `SHEET_ID` | **Yes** | — | Main spreadsheet ID |
| `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` | Local dev | — | Path to JSON key file |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Production | — | Inline service account email |
| `GOOGLE_PRIVATE_KEY` | Production | — | Inline private key |
| `JWT_SECRET` | **Yes** | — | ≥ 128 bytes, base64 |
| `SMTP_HOST` | No | `smtp.gmail.com` | |
| `SMTP_PORT` | No | `465` | |
| `SMTP_SECURE` | No | `true` | |
| `SMTP_USER` | **Yes** | — | Sender email |
| `SMTP_PASS` | **Yes** | — | App password |
| `EMAIL_FROM` | No | `IEEE KSB <SMTP_USER>` | |

---

## Runtime Config (`config.json`)

Unlike `.env`, the `config.json` file contains **non-secret** settings that can be changed at runtime without redeploying:

- **Sheet names** — map each season / module to a tab in the spreadsheet.
- **Email settings** — batch size, delay between batches, test recipient.
- **Pull sources** — toggle & configure which external Google Form response sheets to import from.

The Chairman can edit these from the **⚙ Config** button in the sidebar.

---

## Deployment

### Vercel (recommended)

1. Push the repo to GitHub.
2. Import the project in [Vercel](https://vercel.com/).
3. Add all required environment variables in the Vercel dashboard.
4. Use `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY` (not the key file path).
5. Deploy — Vercel auto-detects Next.js.

### Self-hosted

```bash
npm run build
npm run start
```

The server starts on port `3000` by default. Use a reverse proxy (nginx / caddy) for production.

---

## License

Copyright © 2025 [Ahmed Fahmy](https://github.com/Ahmedfahmy8308)
Developed at **Ufuq.tech**

This project is licensed under the [MIT License](LICENSE). You are free to use, modify, and distribute this software. See the [LICENSE](LICENSE) file for details.
