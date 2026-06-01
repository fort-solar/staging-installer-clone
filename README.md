# Fortsolar Installer WebApp

Fortsolar Installer WebApp is the installer-facing portal for onboarding, authentication, job discovery, application tracking, project visibility, notifications, and account management.

## Highlights

- Installer authentication with signed session cookies and refresh handling
- Email/password and optional Google sign-in
- Guided onboarding flow for installer profile completion
- Job board with saved jobs, submitted applications, and completed work views
- Installer dashboard, settings, notifications, and payout-related account areas
- Shared API proxy for secure backend access from the browser

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- React Hook Form + Zod
- Zustand
- Socket.IO client
- Jest + ESLint

## Application Architecture

- `app/(onboarading_pages)` contains public auth and onboarding routes.
- `app/installer` contains authenticated installer routes.
- `app/api/auth/*` manages login, logout, refresh, registration, access token, and Google auth.
- `app/api/proxy/[...endpoint]` forwards installer requests to the backend API.
- `components/auth` and `components/features/pages/auth` contain session and auth UIs.
- `components/features/pages/installer` contains dashboard, onboarding, and job management views.
- `lib/env.ts` validates required runtime configuration on startup.

## Functional Coverage

The current app includes:

- sign up, sign in, email verification, forgot password, and reset password screens
- installer onboarding with profile, specialization, service area, and document capture
- installer dashboard routing and session restoration
- job browsing with category, system size, and search filters
- saved jobs and application state management
- completed project and settings-related navigation
- realtime and in-app notification support

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Access to the Fortsolar backend API

## Local Development

1. Copy the sample environment file:

   ```bash
   cp .env.example .env.local
   ```

2. Update the values for your local environment.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3227`.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `FORTSOLAR_API_BASE_URL` | Yes | Server-side Fortsolar API base URL. |
| `NEXT_PUBLIC_FORTSOLAR_API_BASE_URL` | Yes | Public API base URL used by browser-side flows. Keep it aligned with `FORTSOLAR_API_BASE_URL`. |
| `FORTSOLAR_INSTALLER_SESSION_SECRET` | Yes | Secret used to sign installer session cookies. Must be at least 32 characters. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | Enables Google sign-in when provided. |
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | No | Enables OneSignal browser push initialization. |
| `NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID` | No | Safari web push ID for OneSignal. |

Compatibility note: the runtime also supports `FORTSOLAR_SESSION_SECRET` as a fallback for the installer session secret, but `FORTSOLAR_INSTALLER_SESSION_SECRET` should be the primary production setting.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server on port `3227`. |
| `npm run build` | Build the production bundle. |
| `npm run start` | Start the production server. |
| `npm run lint` | Run ESLint. |
| `npm test` | Run Jest tests once. |
| `npm run test:watch` | Run Jest in watch mode. |

## Directory Overview

```text
app/
  (onboarading_pages)/ Public auth and onboarding routes
  installer/           Authenticated installer workspace
  api/                 Auth and backend proxy routes
components/
  auth/                Session provider and auth plumbing
  features/pages/auth/ Auth screens and forms
  features/pages/installer/
                       Installer dashboard, onboarding, jobs
lib/
  api/                 Shared request helpers
  auth/                Cookie sessions and refresh flow
  env.ts               Runtime env validation
types/
  api.types.ts         Shared API contracts
```

## Quality Checks

Run these before releasing:

```bash
npm run lint
npm test
npm run build
```

## Deployment Notes

- Deploy as a standard Next.js server application.
- Set both API base URL variables to the same backend origin unless you have a deliberate split between public and private traffic.
- Use a strong installer session secret and keep it server-only.
- Enable Google sign-in and OneSignal only when their associated external configuration is complete.
