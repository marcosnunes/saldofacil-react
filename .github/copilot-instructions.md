# GitHub Copilot Instructions

This file contains instructions for GitHub Copilot when working with this repository.

## Project Overview

SaldoFacil is a personal finance management web application built with React and Vite. It uses Firebase for backend services, including Authentication, Realtime Database, and Firestore. The app is designed to be a Progressive Web App (PWA) and is also available on the Play Store.

A key characteristic is its data persistence model: while user authentication is handled by Firebase, the core financial data is stored in the browser's `localStorage`. This means data is device-specific.

## Architecture and Data Flow

The application follows a standard component-based architecture.

- **Build Tool:** The project uses Vite for fast development and builds. Key scripts in `package.json` are `dev`, `build`, and `lint`.
- **Routing:** `react-router-dom` is used for navigation, with routes defined in `src/App.jsx`. Most routes are protected by the `ProtectedRoute` component, which checks for an active Firebase user session.
- **State Management:** Global state is managed via React's Context API. This is a critical pattern to understand:
    - `src/contexts/AuthContext.jsx`: Manages user authentication state. It provides the `useAuth` hook to access the current user.
    - `src/contexts/YearContext.jsx`: Manages the currently selected year for viewing financial data.
    - `src/contexts/MonthlyContext.jsx`: Manages the data for a specific month.
- **Backend & Database:**
    - **Firebase:** The core backend service, configured in `src/config/firebase.js`. It provides:
        - **Authentication:** For user login and registration.
        - **Firestore/Realtime Database:** While initialized, the primary data storage for financial entries is `localStorage`. Firebase databases may be used for other features.
    - **localStorage:** Used as the primary database for financial transactions (credits and debits). This makes the app fast and offline-first but ties data to a single device.
- **Styling:** The project uses global CSS files located in `src/styles`. There is no CSS-in-JS or component-scoped styling solution in place.

## Developer Workflows

- **Running the project:**
    1. Create a `.env` file in the root directory.
    2. Add the necessary Firebase project credentials to the `.env` file. The required keys can be found in `src/config/firebase.js` (e.g., `VITE_FIREBASE_API_KEY`).
    3. Run `npm install` to install dependencies.
    4. Run `npm run dev` to start the local development server.

- **Key Components & Patterns:**
    - **Pages vs. Components:** `src/pages` contains top-level components for each route, which compose smaller, reusable components from `src/components`.
    - **Protected Routes:** The `src/components/ProtectedRoute.jsx` component is used in `src/App.jsx` to protect routes that require authentication.
    - **Data Fetching:** Data is primarily read from `localStorage` within the relevant page or context provider.
    - **AI Integration:** The app uses the `@google/generative-ai` package for AI-powered financial reports in the `src/pages/AIReports.jsx` page.

## Coding Guidelines

- Use functional components with hooks.
- When adding a new page, ensure it is added to the router in `src/App.jsx` and protected with `ProtectedRoute` if it's not a public page.
- For global state, consider if it should be added to an existing context or if a new one is needed.
- Remember that financial data is stored in `localStorage`, so any logic for creating, reading, updating, or deleting transactions should interact with the `localStorage` API.
- Keep styling consistent with the existing global stylesheets in `src/styles`.
