# GitHub Copilot Instructions for SaldoFacil

## Project Overview
SaldoFacil is a personal finance management PWA built with React/Vite. It uses Firebase Auth and Realtime Database with a hybrid data model: authentication + some data via Firebase, while monthly transactions are synced to `Firebase Realtime Database` under `users/{uid}/{year}/{month}/`. The app is available as PWA and Android app (Play Store).

## Critical Architecture Decisions

### 1. **Hybrid Data Storage Model** (NOT pure localStorage)
- **Firebase Realtime Database:** Primary storage for transactions at `users/{uid}/{year}/{month}/transactions`
- **LocalStorage:** Only persists `selectedYear` preference (see `YearContext.jsx`)
- **Implication:** All financial data is cloud-synced and device-independent. Do NOT treat data as device-specific.
- **Common Mistake:** Assuming transactions are stored in localStorage—they're NOT. Check `MonthlyPage.jsx` and `MonthlyContext.jsx` for real-time Firebase listeners.

### 2. **Layered State Management via Context API**
Three essential contexts compose the data flow:
- **AuthContext:** `user` (Firebase user object) + `loading` state. Delays child rendering until auth status determined.
- **YearContext:** `selectedYear` (cached in localStorage). Used to scope all financial data queries.
- **MonthlyContext:** NOT directly provided. Instead, each month page manages state independently via `onValue()` listeners on `database/users/{uid}/{year}/{monthKey}/`.

**Key Pattern:** Month pages (`MonthlyPage.jsx`, `CreditCard.jsx`, `Investments.jsx`) directly subscribe to Firebase using `useEffect(() => { const unsubscribe = onValue(...); return () => unsubscribe(); }, [user, selectedYear, ...])`. This is NOT a context provider pattern—it's local component state with Firebase listeners.

### 3. **Routing & Code Splitting**
- **Router:** `HashRouter` (not `BrowserRouter`) to support Android WebView. All routes use hash: `#/month/1`, `#/login`, etc.
- **Lazy Loading:** Heavy pages (MonthlyPage, Charts, AIReports, etc.) are code-split with `lazy()` + `Suspense`.
- **Auth Guard:** `ProtectedRoute` component checks `user` from AuthContext. Non-auth pages (Login, Signup, Privacy) bypass it.

## Data Flow & Critical Patterns

### Monthly Data Structure in Realtime Database
```
users/{uid}/{year}/{monthKey}/
  ├── initialBalance: "1000.00"
  ├── transactions: { uuid1: { date, description, credit, debit, tithe, balance }, ... }
  ├── totalCredit: "5000.00"
  ├── totalDebit: "2000.00"
  ├── finalBalance: "4000.00"
  ├── percentage: "40.00%"
  └── tithe: "500.00"
```
Month keys are lowercase English: `january`, `february`, ..., `december`.

### Transaction Lifecycle Example
1. User enters transaction in MonthlyPage → state update
2. Component calls `set(ref(database, ...), { ...monthData })` to Firebase
3. Same code has `onValue()` listener that auto-updates state when Firebase changes
4. Calculated fields (totalCredit, totalDebit, finalBalance, percentage) are computed client-side in a dependent `useEffect()`

### Investments & Credit Card Handling (Special Cases)
- **Investments:** Separate Realtime Database path `investmentsData/{uid}/{year}/{monthName}/` (note: uses `monthName` in PT, not lowercase key)
- **Credit Card:** Stored under same month structure but has `creditCardBalance` field that affects monthly outflow calculations
- **Important:** Investment calculations are net (debit - credit = money applied - money withdrawn)

## Developer Workflows

### Setup
```bash
# 1. Create .env with Firebase credentials from src/config/firebase.js
# VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, etc.

# 2. Install & run
npm install
npm run dev  # Opens http://localhost:5173

# 3. Build for production
npm run build  # Output: dist/

# 4. Lint code
npm lint
```

### Adding a New Page
1. Create `src/pages/NewPage.jsx`
2. Register in `src/App.jsx` (lazy load if heavy):
   ```jsx
   const NewPage = lazy(() => import('./pages/NewPage'));
   // In routes:
   <Route path="/new-page" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><NewPage /></Suspense></ProtectedRoute>} />
   ```
3. Import & use contexts: `const { user } = useAuth(); const { selectedYear } = useYear();`
4. If accessing monthly data, use same Firebase listener pattern as `MonthlyPage.jsx`

### Adding a Transaction Field
If adding a new field to transactions (e.g., `category`):
1. Update transaction object creation in `MonthlyPage.jsx` (search `uuidv4()`)
2. Update Realtime Database write: `set(ref(database, ...), { transactions: {...}, ... })`
3. Update calculation `useEffect()` if field affects totals
4. Update export functions in `utils/export.js` if field should appear in PDF/Excel

## Dependencies & Special Features

- **Firebase:** Auth + Realtime Database only (Firestore initialized but unused)
- **Groq LLM:** For financial insights in AIReports page (uses `groq-sdk`)
- **Recharts:** Charts visualization (used in Charts.jsx, YearlyReport.jsx)
- **ExcelJS & jsPDF:** Export transactions to Excel/PDF (utils/export.js)
- **OFX Parsing:** Limited bank statement import (helpers.js, tested with Nubank only)
- **i18n:** No translation library. All UI text is hardcoded in Portuguese (PT-BR).

## Code Patterns & Conventions

### Month Key Mapping
```javascript
// helpers.js exports these:
monthsPT = ['Janeiro', 'Fevereiro', ..., 'Dezembro']  // For UI display
monthsLowercase = ['january', 'february', ..., 'december']  // For Firebase keys
// Convert: monthsLowercase[monthIndex], monthsPT[monthIndex]
```

### Currency Formatting
Use `formatCurrency(value, 'BRL')` from helpers.js → "R$ 1.234,56"

### Styling
- Global CSS in `src/styles/` (style.css, dashboard.css)
- No CSS Modules or styled-components
- Material Design Icons via `<span className="material-icons">icon_name</span>`

### Error Handling
- Firebase errors logged to console
- User-facing errors via `window.confirm()` or console logs (no toast/snackbar library)
- Example: "Tem certeza que deseja limpar todos os dados?" (Dashboard.jsx)

## Common Pitfalls to Avoid

1. **Forgetting to unsubscribe from Firebase listeners** → Memory leaks. Always return cleanup in `useEffect()`.
2. **Hardcoding transaction structure** → Update calculation logic when adding fields.
3. **Using localStorage for transactions** → Data is in Realtime Database; localStorage only has selectedYear.
4. **Not handling `selectedYear` in queries** → All month data is scoped by year; pass it to Firebase refs.
5. **BrowserRouter instead of HashRouter** → Will break Android WebView routing.
6. **Assuming Firestore is active** → It's initialized but unused; all data is in Realtime Database.

## Testing & Debugging Notes

- No test suite exists (Jest/Vitest not configured)
- Use browser DevTools to inspect Realtime Database (Firebase console in browser)
- For local Firebase emulator setup, see `firebase-rules.json` and `FIREBASE_RULES_DOCUMENTATION.md`
- Chrome DevTools: Open Application → check Firestore/Realtime Database connection status
