# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Project structure

```
Inventory/
├── server.js                    # Express + MySQL API (auth, RBAC, products, stores, stock movements)
├── products.json                # Sample/seed product data
├── uploads/                     # Uploaded product images served at /uploads (gitignored)
├── scripts/
│   └── reset-project.js         # Moves starter code to app-example/ and resets src/app
├── tests/                       # Test suite
├── .env.example                 # Template for server environment variables
└── src/
    ├── app/                     # Expo Router screens (file-based routing)
    │   ├── _layout.tsx          # Root navigation layout
    │   ├── index.tsx            # Dashboard (stats, charts, recent activity)
    │   ├── explore.tsx          # Products screen (search, sort, filter by category)
    │   ├── add.tsx              # Add / Edit product form (image picker)
    │   ├── product-detail.tsx   # Single product detail view
    │   ├── categories.tsx       # Category list
    │   ├── category-detail.tsx  # Single category detail view
    │   ├── stores.tsx           # Store list
    │   ├── store-detail.tsx     # Single store detail view
    │   ├── finances.tsx         # Financial metrics/analytics (admin only)
    │   ├── settings.tsx         # App/system settings
    │   └── profile.tsx          # User profile and preferences
    ├── components/              # Reusable UI components
    │   ├── login-screen.tsx     # Username/password login form
    │   ├── app-header.tsx       # Top header bar
    │   ├── app-tabs.tsx / .web.tsx     # Tab navigation (native / web variants)
    │   ├── drawer-menu.tsx      # Side drawer navigation
    │   ├── product-card.tsx     # Product list item card
    │   ├── category-chip.tsx    # Category filter chip
    │   ├── stat-card.tsx        # Dashboard stat tile
    │   ├── stock-badge.tsx      # Stock level indicator
    │   ├── search-bar.tsx       # Search input
    │   ├── animated-icon.tsx / .web.tsx / .module.css  # Animated icon (native / web variants)
    │   ├── themed-text.tsx / themed-view.tsx           # Theme-aware base components
    │   ├── web-badge.tsx        # Web-only badge
    │   ├── hint-row.tsx         # Inline hint/help row
    │   ├── external-link.tsx    # Opens links in the in-app/external browser
    │   └── ui/collapsible.tsx   # Collapsible section
    ├── contexts/                # React context providers (global state)
    │   ├── auth-context.tsx     # Auth/session state (JWT token, current user)
    │   ├── inventory-context.tsx  # Product/inventory state
    │   └── menu-context.tsx     # Drawer/menu open state
    ├── hooks/                   # Custom hooks
    │   ├── use-auth.ts          # Access auth-context
    │   ├── use-inventory.ts     # Access inventory-context
    │   ├── use-theme.ts         # Resolve current theme
    │   └── use-color-scheme.ts / .web.ts  # Native / web color scheme detection
    ├── services/
    │   └── api.ts               # Fetch wrapper — attaches x-api-key / JWT, calls the backend
    ├── utils/
    │   └── rbac.ts              # Role-based access control helpers (admin vs user)
    ├── constants/
    │   ├── theme.ts             # Colors, spacing, typography (light/dark)
    │   ├── category-meta.ts     # Category display metadata (icons, labels)
    │   ├── inventory-data.ts    # Static inventory constants
    │   └── products.json        # Local product fixtures
    └── global.css                # Global styles (web)
```

- **Routing**: `src/app/` uses [Expo Router](https://docs.expo.dev/router/introduction) file-based routing — each file under `src/app/` becomes a screen/route.
- **Platform-specific files**: files suffixed `.web.tsx` (e.g. `animated-icon.web.tsx`, `app-tabs.web.tsx`) override the default implementation on web only; Metro picks the right file automatically per platform.
- **State management**: global state lives in `src/contexts/` (auth, inventory, menu), exposed through matching hooks in `src/hooks/`.
- **Backend access**: all API calls go through `src/services/api.ts`, which attaches the API key/JWT token; `src/utils/rbac.ts` gates UI features by role.
- **Theme**: `src/constants/theme.ts` & `src/hooks/use-theme.ts` (supports dark / light mode).

## Running on Android / iOS

### Android
- Start the emulator, then run:
  ```bash
  npm run android
  ```
- **Port conflict**: if a Metro server is already running, don't run `npm run android` again — send `a` to the running Metro task to open the app on the emulator instead.
- **Loopback issue**: if Expo Go can't reach the host inside the emulator, force the loopback URL:
  ```bash
  adb shell am start -a android.intent.action.VIEW -d exp://10.0.2.2:8081
  ```

### iOS
- Open the Simulator, then run:
  ```bash
  npm run ios
  ```
- **Port conflict**: if Metro is already running, don't run `npm run ios` again — send `i` to the Metro console instead.
- Or test on a physical device with **Expo Go** by opening the Metro URL (e.g. `exp://<host-ip>:8081`).

## Backend

This app talks to an Express + MySQL API in [server.js](server.js) (`npm run server`). Copy `.env.example` to `.env` and fill in your own DB credentials and `EXPO_PUBLIC_API_KEY` — `.env` itself is gitignored and not included in this repo.

## Authentication & Access Codes

The app uses two layers of authentication: an **API key** (lets the app talk to the backend) and **username / password** (per-user login).

### 1. API key (`EXPO_PUBLIC_API_KEY`)
- A shared secret embedded in the app at build time. It blocks any request that doesn't come from the app itself from hitting the write endpoints (see [server.js:48](server.js:48)).
- Set it in `.env`:
  ```env
  EXPO_PUBLIC_API_KEY=changeme
  ```
- Must match on both the server (`.env`) and the client — since the variable is prefixed `EXPO_PUBLIC_`, it gets bundled into the client at build time automatically. **Never leave it as `changeme` in production.**

### 2. Username / Password (user accounts)
- **Self-registration is disabled** — calling `POST /api/auth/register` always returns an error (see [server.js:146](server.js:146)). New accounts must be created directly in the database by an administrator.
- There are two roles: `admin` (full access — sees financial/price data and can edit stock) and `user` (can view products but not prices/financial data, and cannot edit anything — see `requireApiKey` and `requireFinancialAccess` in [server.js](server.js)).
- Log in from the app's login screen (or call `POST /api/auth/login` with the `x-api-key` header). The server returns a JWT token (valid for 7 days) that the app stores and attaches to subsequent authenticated requests.

### 3. Database setup & sample accounts
This repo includes a database dump, [`ip_std6730202700.sql`](ip_std6730202700.sql), with the full schema (products, stores, users, etc.) plus these sample accounts. Import it into MySQL:

| Role  | Username | Password    |
|-------|----------|-------------|
| admin | admin    | password123 |
| user  | user01   | user123     |

```bash
mysql -u <db_user> -p <db_name> < ip_std6730202700.sql
```

> ⚠️ These sample accounts are for local development only — do not reuse them in any staging/production database.

### 4. Security-related environment variables
| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_KEY` | API key that must be sent with write requests (`x-api-key` header) |
| `JWT_SECRET` | Signs and verifies JWT login tokens — **must be changed from `changeme`/`secret` before production use** |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` / `DB_HOST` / `DB_PORT` | MySQL connection credentials |

> ⚠️ Never commit `.env` or real passwords/API keys to git — `.env.example` is a template only.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
