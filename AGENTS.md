# Agent Instructions for Pavarun274/internet-programming-inventory

## GitHub Repository
- **Repository URL**: [https://github.com/Pavarun274/internet-programming-inventory](https://github.com/Pavarun274/internet-programming-inventory)
- **Remote Git URL**: `https://github.com/Pavarun274/internet-programming-inventory.git`

## Expo Version Requirement
> [!IMPORTANT]
> Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code. All libraries must be compatible with Expo v57.0.0.

## Project Structure
- **Routing**: `src/app/` (Expo Router).
  - `src/app/_layout.tsx` - Root navigation layout.
  - `src/app/index.tsx` - Dashboard (displays stats, charts, recent activities).
  - `src/app/explore.tsx` - Products screen (Search, sort, filter by category).
  - `src/app/add.tsx` - Add / Edit Product form (Media library / image picker integration).
  - `src/app/categories.tsx` - Category list & details.
  - `src/app/profile.tsx` - User profile and preferences.
- **Components**: `src/components/` (Reusable UI components).
  - Platform-specific files (e.g., `animated-icon.web.tsx`, `app-tabs.web.tsx`) are used to optimize UI between native apps and web.
- **State Management**: `src/contexts/inventory-context.tsx` and custom hook `src/hooks/use-inventory.ts`.
- **Theme**: Defined in `src/constants/theme.ts` & hook `src/hooks/use-theme.ts` (supports dark / light mode).

## Environment Setup & Commands

### 1. Web Development
```bash
npm run web
```
Starts Metro bundler and runs the web app on `http://localhost:8081`.

### 2. Android Development
- Requires the custom `android` CLI tool (installed in `~/.local/bin/android`).
- Start the emulator:
  ```bash
  ~/.local/bin/android emulator start Medium_Phone
  ```
- Deploy to emulator (Metro bundler automatically links):
  ```bash
  npm run android
  ```
- **Port Conflict Workaround**: If the Metro server is already running, do not run `npm run android` again. Send input `a` to the running Metro server task to open the app on the emulator.
- **Android Intent Loopback**: If Expo Go fails to connect to the host IP inside the emulator, force open the loopback URL:
  ```bash
  ~/Library/Android/sdk/platform-tools/adb shell am start -a android.intent.action.VIEW -d exp://10.0.2.2:8081
  ```

### 3. iOS Development
- Xcode is installed. You can run and test the app on the iOS Simulator.
- Start the iOS Simulator:
  ```bash
  open -a Simulator
  ```
- Deploy to the simulator:
  ```bash
  npm run ios
  ```
- **Port Conflict Workaround**: If the Metro server is already running, do not run `npm run ios` again. Send input `i` to the Metro server console to open the app on the simulator.
- Alternatively, you can test on a physical iOS device using **Expo Go** by opening the Metro server URL (e.g., `exp://<host-ip>:8081`).

### 4. Code Quality & Linting
```bash
npm run lint
```
