# WorldPulse - Global Monitoring App

A professional real-time monitoring application built with React Native and Expo. Tracking global events, disasters, and intelligence in a unified interface.

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Bun](https://bun.sh/) or [npm](https://www.npmjs.com/)

## Getting Started

1. **Install dependencies:**
   ```bash
   bun install
   # or
   npm install
   ```

2. **Start the development server:**
   ```bash
   npx expo start
   ```

3. **Open the app:**
   - Press **i** for iOS Simulator
   - Press **a** for Android Emulator
   - Press **w** for Web preview

## Technology Stack

- **Framework:** [Expo](https://expo.dev/) + [React Native](https://reactnative.dev/)
- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/)
- **State Management:** [TanStack Query](https://tanstack.com/query/latest) (React Query)
- **Icons:** [Lucide React Native](https://lucide.dev/)
- **Maps:** Leaflet (Web) & MapLibre (Native)
- **Language:** TypeScript

## Core Features

- **Real-time Map:** High-performance global mapping of events.
- **Advanced Filtering:** Filter by severity, magnitude, and category.
- **PRO Intelligence:** Locked premium categories (Conflicts & Unrest) with a blurred preview system.
- **English-only UI:** Clean, hardcoded English interface for a streamlined global experience.

## Deployment

### Mobile (iOS & Android)
The app is configured for [EAS Build](https://docs.expo.dev/build/introduction/).

```bash
# Login to EAS
npx eas-cli login

# Build for iOS
npx eas build --platform ios

# Build for Android
npx eas build --platform android
```

### Web
Build the production bundle for web:

```bash
npx expo export --platform web
```

## Structure

- `app/`: Expo Router screens and layouts.
- `assets/`: Images, fonts, and static resources.
- `components/`: Reusable UI components.
- `constants/`: Theme, colors, and configuration.
- `context/`: React Context for global state (Filters, PRO status).
- `hooks/`: Custom React hooks (Filtering logic).
- `services/`: API and data fetching layer.
- `utils/`: Helper functions and formatters.
