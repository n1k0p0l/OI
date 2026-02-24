# OI OneDrive Resume SPA

This is a static single-page app that signs in with Microsoft and browses OneDrive. If a folder contains an `OI.md` file, the app renders it as the page (no file listing).

## Setup (Microsoft Entra app)
1. Go to https://portal.azure.com -> Microsoft Entra ID -> App registrations -> New registration.
2. Name: `OI` (or any name).
3. Supported account types: "Accounts in any organizational directory and personal Microsoft accounts".
4. Redirect URI: Platform "Single-page application" and add:
   - `https://n1k0p0l.github.io/OI/`
5. Create the app, then copy the Application (client) ID.
6. API permissions (Delegated): add `User.Read` and `Files.Read` for Microsoft Graph.
7. In [app.js](app.js), replace `PASTE_YOUR_CLIENT_ID_HERE` with your Application (client) ID.

## GitHub Pages
1. Push the OI folder to your `n1k0p0l/OI` repo root.
2. In repo Settings -> Pages:
   - Source: Deploy from a branch
   - Branch: `main` / folder: `/`
3. Open the site at `https://n1k0p0l.github.io/OI/`.

## How it works
- Sign in with Microsoft (session stored in browser localStorage).
- Browse folders and click "Use this folder".
- If `OI.md` exists in that folder, it renders as the page.
- Links in `OI.md` that are relative are rewritten to the OneDrive online file URLs.
- Works on desktop and mobile browsers.

## Security note
The client ID is safe to expose in public code - it's designed to be public in Single-Page Applications. Security comes from PKCE, redirect URI whitelisting, and user consent, not from hiding the client ID.

## Notes
- This app only uses client-side JavaScript and Microsoft Graph.
- Data is read live from your OneDrive.
- Login session persists in browser localStorage (no server-side storage).
