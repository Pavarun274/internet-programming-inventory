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

- **Routing**: `src/app/` (Expo Router)
  - `src/app/_layout.tsx` — Root navigation layout
  - `src/app/index.tsx` — Dashboard (stats, charts, recent activities)
  - `src/app/explore.tsx` — Products screen (search, sort, filter by category)
  - `src/app/add.tsx` — Add / Edit product form (image picker integration)
  - `src/app/categories.tsx` — Category list & details
  - `src/app/profile.tsx` — User profile and preferences
- **Components**: `src/components/` — reusable UI components. Platform-specific files (e.g. `animated-icon.web.tsx`, `app-tabs.web.tsx`) optimize UI between native apps and web.
- **State management**: `src/contexts/inventory-context.tsx` and the `src/hooks/use-inventory.ts` hook
- **Theme**: `src/constants/theme.ts` & `src/hooks/use-theme.ts` (supports dark / light mode)

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
