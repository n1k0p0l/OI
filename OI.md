# OI - Online Ideas

Browse your OneDrive folders and render `OI.md` files as web pages.

## How to Use

1. **Open the app:** Visit https://n1k0p0l.github.io/OI/
2. **Sign in:** Click "Sign in with Microsoft" and grant access to your OneDrive
3. **Browse folders:** Navigate through your OneDrive by clicking folder names
4. **View content:** Click "Use this folder" to render the `OI.md` file from that folder
5. **Navigation:** Use breadcrumbs to go back or navigate to different folders

The app reads directly from your OneDrive. Your session stays active in your browser until you sign out.

## Changelog

### 2026-02-24
- **Added:** Folder links in rendered OI.md now navigate within the app instead of opening OneDrive webURL. Clicking a folder link now browses to that folder in the OI app.

### 2026-02-24
- **Fixed:** Added initialization flag to prevent "uninitialized_public_client_application" error when clicking Sign in button before MSAL completes initialization.

### 2026-02-24
- **Changed:** Rebranded from "OneDrive Index" to "Online Ideas". Added rotating daily Douglas Adams quotes in footer. Removed "Hosted on GitHub Pages" message.

### 2026-02-24
- **Fixed:** Removed leftover references to deleted btn-back button that was causing "Cannot read properties of null" error at app initialization.

### 2026-02-24
- **Changed:** "Use this folder" button now only appears when the current folder contains an OI.md file, providing clearer feedback about which folders can be used.

### 2026-02-24
- **Added:** "Use another folder" button in viewer mode to return to root OneDrive and browse other folders. Auto-restore feature now loads previously selected OI.md folder on subsequent visits to the app (same device/browser).

### 2026-02-24
- **Changed:** Renamed README.md to OI.md. Project documentation now uses the same filename as the app's content format. Updated all references in CONVENTIONS.md and .github/copilot-instructions.md.

### 2026-02-24
- **Changed:** Simplified README.md to focus on user instructions only. Removed setup sections (Microsoft Entra app, GitHub Pages, client ID references) as these are already configured.

### 2026-02-24
- **Added:** Created `.github/copilot-instructions.md` to ensure Copilot always reads changelog maintenance requirements in future conversations. Also created `CONVENTIONS.md` for detailed development guidelines.

### 2026-02-24
- **Fixed:** MSAL initialization error - Added `await msalInstance.initialize()` in boot() function to properly initialize MSAL before any authentication calls. This resolves "uninitialized_public_client_application" error when signing in.

### 2026-02-24
- **Initial Release:** Created OI SPA with Microsoft OAuth, OneDrive browsing, and OI.md rendering capabilities. Features include folder navigation, breadcrumb trail, relative link rewriting, and responsive design with warm serif aesthetic.
