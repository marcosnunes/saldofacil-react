# GitHub Copilot Instructions for SaldoFacil

**Last Updated:** January 2026 | **Version:** 4.0 | **Status:** Production

## Project Overview
**SaldoFacil** is a personal finance management PWA (Progressive Web App) built with React/Vite. It manages annual finances with monthly transaction tracking, credit card installments, investments, and AI-powered insights. Uses Firebase Auth + Realtime Database for cloud-synced data. Available as web app, PWA, and Android app (Play Store: https://play.google.com/store/apps/details?id=com.autossuficiencia). Web: https://saldofacil.vercel.app

## Critical Architecture Decisions

### 1. **Hybrid Data Storage Model** (NOT pure localStorage)
- **Firebase Realtime Database:** Primary storage for ALL financial data at `users/{uid}/{year}/{month}/transactions`
- **LocalStorage:** ONLY `selectedYear` preference (see `YearContext.jsx` line ~25)
- **Implications:** 
  - ✅ All data is cloud-synced and device-independent
  - ✅ Deleted data stays deleted across sessions
  - ❌ Do NOT treat data as device-specific or temporary
- **Common Mistake:** Assuming transactions are cached locally—they're NOT. Check `MonthlyPage.jsx` (line ~140) for real-time Firebase listeners
- **Credit Card & Investments:** Stored in separate RTDB paths (`creditCardData/`, `investmentsData/`), NOT in `users/` structure

### 2. **Layered State Management (Context API)**
**Three contexts compose the entire data layer:**
- **AuthContext** (`src/contexts/AuthContext.jsx`): Firebase user object + `loading` state. Delays child rendering until auth/email verification complete
- **YearContext** (`src/contexts/YearContext.jsx`): `selectedYear` (cached in localStorage). Scopes ALL financial queries
- **MonthlyContext** (`src/contexts/MonthlyContext.jsx`): Local component state, NOT a provider. Each month manages state independently via `onValue()` listeners

**Key Pattern (CRITICAL):** Month pages directly subscribe to Firebase using `useEffect()`:
```jsx
useEffect(() => {
  if (!user || !selectedYear) return;
  const ref_ = ref(database, `users/${user.uid}/${selectedYear}/${monthKey}/`);
  const unsubscribe = onValue(ref_, snapshot => { 
    if (snapshot.exists()) setMonthData(snapshot.val()); 
  });
  return () => unsubscribe();  // ⚠️ MUST cleanup to prevent memory leaks
}, [user, selectedYear, monthKey]);
```
This is NOT a context provider pattern—it's component-level state with Firebase real-time sync.

### 3. **Routing & Code Splitting**
- **Router:** `HashRouter` (NOT `BrowserRouter`) for Android WebView compatibility. All routes use hash: `#/month/1`, `#/login`, `#/credit-card`
- **Route Params:** MonthlyPage uses `:monthId` (1-12), NOT month names. Convert in component: `monthsLowercase[monthId - 1]`
- **Lazy Loading:** All heavy pages (MonthlyPage, CreditCard, Investments, Charts, AIReports, etc.) are code-split with `lazy()` + `Suspense`
- **Auth Guard:** `ProtectedRoute` component (line ~8 of `src/components/ProtectedRoute.jsx`) checks `user` + `emailVerified` from AuthContext. Public pages (Login, Signup, Privacy) bypass it
- **Email Verification:** Mandatory before accessing any protected route—users are redirected to `/email-verification` until confirmed

## Data Flow & Critical Patterns

### Monthly Data Structure in Realtime Database
```
users/{uid}/{year}/{monthKey}/
  ├── initialBalance: "1000.00"
  ├── transactions: { 
  │   "uuid-1": { date, description, credit: 0, debit: 500, tithe: false, balance: "500.00" },
  │   "uuid-2": { date, description, credit: 1000, debit: 0, tithe: true, balance: "1500.00" }
  │ }
  ├── totalCredit: "5000.00"
  ├── totalDebit: "2000.00"
  ├── finalBalance: "4000.00"
  ├── percentage: "40.00"
  ├── creditCardBalance: "0.00"          // ⚠️ Added to monthly balance
  ├── investmentBalance: "0.00"          // ⚠️ Added to final balance
  └── tithe: "500.00"
```
**Month keys:** Always lowercase English: `january`, `february`, ..., `december` (NOT `Janeiro`, not numeric)

### Transaction Lifecycle Example
1. User enters transaction in MonthlyPage form (line ~180)
2. Component calls `set(ref(database, `users/${uid}/${year}/${monthKey}`), { transactions: {...} })`
3. Firebase triggers `onValue()` listener → state auto-updates
4. Dependent `useEffect()` recalculates: totalCredit, totalDebit, finalBalance, percentage
5. Component re-renders with new values
6. **Auto-save:** No explicit save button—Firebase sync is immediate

### Investments & Credit Card Handling (Special Database Paths)
- **Investments:** Stored at `investmentsData/{uid}/{year}/{itemId}` (NOT under users/{year}/month)
  - Structure: `{ description, debitValue, creditValue, month: "Janeiro 2025", recurrence: 1 }`
  - Calculation: Net balance = credit applied - debit withdrawn
  - **Bug fix (2025):** Month field uses PT name + year (e.g., "Janeiro 2025"), NOT lowercase key
- **Credit Card:** Stored at `creditCardData/{uid}/{year}/{itemId}` 
  - Structure: `{ description, totalValue, installments: 12, month: "January" }` (note: English month)
  - Parcels auto-distribute: if bought in January with 12 parcels, Jan-Dec get monthly charges
  - **Limitation:** Parcels beyond December are NOT created (by design—next year has its own data)
  - Monthly balance IDs: `januaryCreditCardBalance`, `februaryCreditCardBalance`, etc. in `creditCardBalances/{uid}/{year}/`

## Developer Workflows

### Quick Start
```bash
npm install
VITE_FIREBASE_API_KEY=... VITE_FIREBASE_PROJECT_ID=... npm run dev
# http://localhost:5173 opens (HashRouter uses #/)
npm run build    # dist/ output
npm run lint     # ESLint check
```

### Adding a New Financial Page
1. Create `src/pages/NewFeature.jsx` with pattern:
   ```jsx
   const { user } = useAuth();
   const { selectedYear } = useYear();
   
   useEffect(() => {
     if (!user) return;
     const ref_ = ref(database, `your/path/${user.uid}/${selectedYear}`);
     const unsubscribe = onValue(ref_, snap => { /* ... */ });
     return () => unsubscribe();  // ⚠️ CRITICAL cleanup
   }, [user, selectedYear]);
   ```
2. Lazy-load in `src/App.jsx`:
   ```jsx
   const NewFeature = lazy(() => import('./pages/NewFeature'));
   <Route path="/new-feature" element={
     <ProtectedRoute>
       <Suspense fallback={<div>Carregando...</div>}>
         <NewFeature />
       </Suspense>
     </ProtectedRoute>
   } />
   ```
3. Add card link in `Dashboard.jsx` (lines ~30-50)

### Adding a Field to Transactions
When extending transaction structure (e.g., add `category` field):
1. Update transaction object in `MonthlyPage.jsx` `addTransaction()` (search `uuidv4()`)
2. Update Firebase write in same file
3. Update calculation `useEffect()` if field affects totals (finalBalance, percentage, etc.)
4. Update `utils/export.js` if field should appear in PDF/Excel exports
5. Test: UI should auto-sync via `onValue()` listener

### Month Index vs Name Conversion
```javascript
// ALWAYS use these mappings from helpers.js
monthsLowercase[0] === 'january'     // For Firebase keys
monthsPT[0] === 'Janeiro'            // For UI display

// URL params use 1-based:
/month/1 → monthIndex = 0 → monthsLowercase[0] → 'january'
/month/12 → monthIndex = 11 → monthsLowercase[11] → 'december'

// In routes, convert:
const { monthId } = useParams();  // String "1"
const monthIndex = parseInt(monthId) - 1;  // 0
const monthKey = monthsLowercase[monthIndex];  // 'january'
```

## Dependencies & Special Features

- **Firebase:** Auth + Realtime Database only (Firestore initialized but unused)
- **Groq LLM:** For financial insights in AIReports page (uses `groq-sdk`)
- **Recharts:** Charts visualization (used in Charts.jsx, YearlyReport.jsx)
- **ExcelJS & jsPDF:** Export transactions to Excel/PDF (utils/export.js)
- **OFX Parsing:** Limited bank statement import (helpers.js, tested with Nubank only)
- **i18n:** No translation library. All UI text is hardcoded in Portuguese (PT-BR).
- **Build:** Vite with manual chunk splitting (firebase, charts, vendor chunks in vite.config.js)

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

## Content Security Policy (CSP)

**Current CSP in `index.html`:**
```html
<meta http-equiv="Content-Security-Policy" content="script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline' https://apis.google.com; connect-src 'self' https://firebase.googleapis.com https://apis.google.com https://identitytoolkit.googleapis.com" />
```

**Why this is needed:**
- `https://firebase.googleapis.com` - Firebase Realtime Database and main services
- `https://identitytoolkit.googleapis.com` - Firebase Authentication (sign in, email verification, etc.)
- `https://apis.google.com` - Google APIs initialization
- `'wasm-unsafe-eval'` - Needed for some Firebase modules
- `'unsafe-inline'` - Required for inline scripts

**Common CSP Issues & Solutions:**

| Error | Cause | Solution |
|-------|-------|----------|
| "violates connect-src" on sign in | Missing `identitytoolkit.googleapis.com` | Add to connect-src |
| "Loading script violates script-src" | Missing domain in script-src | Add domain to script-src |
| "Fetch API cannot load" + CSP error | Missing domain in connect-src | Add domain to connect-src |

**When adding new external services:**
1. **For JavaScript files** → Add domain to `script-src`
2. **For API calls (fetch/XHR)** → Add domain to `connect-src`
3. **Test thoroughly** → Never remove existing directives
4. **Example:** If adding third-party analytics:
   ```html
   script-src ... https://analytics.example.com;
   connect-src ... https://analytics.example.com
   ```

**Note on Firefox "Tracking Prevention" warnings:**
- Messages like "Tracking Prevention blocked access to storage" are Firefox's anti-tracking feature
- This affects localStorage/IndexedDB but is NOT a breaking error
- App continues to work normally—YearContext still uses localStorage as designed

---

## Firebase Debugging & Logging Patterns

**Enable detailed Firebase logging in components:**
```javascript
// Use this pattern from Investments.jsx
function logFirebaseOperation({ userId, year, month, action, path, data }) {
  console.log(`[FIREBASE DEBUG] Action: ${action}`);
  if (path) console.log(`[FIREBASE DEBUG] Path: ${path}`);
  if (userId) console.log(`[FIREBASE DEBUG] UserID: ${userId}`);
  if (data) console.log(`[FIREBASE DEBUG] Data:`, data);
}

// Then call:
logFirebaseOperation({ userId: user.uid, year: selectedYear, action: 'set', path: refPath, data: monthData });
```

**Common debugging scenarios:**

| Issue | Debug Method |
|-------|-------------|
| Data not syncing | Check `onValue()` listener in console, verify `user.uid` exists |
| Write fails silently | Check browser console for Firebase errors, verify Firebase rules |
| Race condition on mount | Check dependency array in `useEffect()` includes all needed deps |
| Memory leak warning | Ensure `return () => unsubscribe()` exists in cleanup |
| Wrong data structure | Log `snapshot.val()` to see actual Firebase data vs expected |

**Firebase Console inspection:**
- Open DevTools → Console
- All Firebase operations log to console
- Use `firebase.getDatabase()` in console to inspect live data
- Check Realtime Database Rules in Firebase Console for rejection reasons

---

## Performance & Code-Splitting

**Vite manual chunk splitting (`vite.config.js`):**
```javascript
rollupOptions: {
  output: {
    manualChunks: {
      'firebase': ['firebase/app', 'firebase/auth', 'firebase/database'],
      'charts': ['recharts'],
      'vendor': ['react', 'react-dom', 'react-router-dom']
    }
  }
}
```

**Why separate chunks?**
- Firebase is large (≈150KB) - only loaded when needed
- Charts library (Recharts) is lazy-loaded via `lazy()`
- React core should load once on app init

**Lazy-loaded pages (automatically code-split):**
- MonthlyPage, CreditCard, Investments, Tithe
- Report, Charts, Tools, SalaryCalculator
- FAQ, Privacy, DeleteAccount
- AIReports, YearlyReport

**When to use lazy loading:**
```jsx
// ✅ DO: For heavy pages
const HeavyPage = lazy(() => import('./pages/HeavyPage'));

// ❌ DON'T: For small utility pages (Dashboard, Login)
import Dashboard from './pages/Dashboard'; // Direct import
```

**Performance monitoring:**
- Run `npm run build` → Check dist/ file sizes
- Large `.js` chunks (>300KB) may need further splitting
- Use DevTools Network tab to verify chunk loading

---

## Email Verification Flow

**Complete flow for email verification (implemented in v4.0):**

### New User Registration
```
1. User fills Signup form (email + password)
   ↓
2. Firebase creates account: createUserWithEmailAndPassword()
   ↓
3. Auto-send verification email: sendEmailVerification()
   ↓
4. Show success → Redirect to Login after 3s
   ↓
5. User clicks link in email (Firebase handles redirect)
   ↓
6. User returns to Login page
```

### Existing User Login (without email verification)
```
1. User enters credentials in Login page
   ↓
2. Firebase authenticates: signInWithEmailAndPassword()
   ↓
3. Check emailVerified flag: user.emailVerified === false
   ↓
4. Auto-send verification email: sendEmailVerification() 
   ↓
5. Redirect to /email-verification page
```

### Email Verification Page (`EmailVerification.jsx`)
```
1. Component uses useAuth() hook to listen for emailVerified changes
   ↓
2. When user clicks verification link in email, Firebase updates emailVerified
   ↓
3. onAuthStateChanged() in AuthContext fires automatically
   ↓
4. emailVerified state updates in page component
   ↓
5. useEffect dependency triggers, emailVerified check passes
   ↓
6. Show success message → Redirect to Dashboard (/) after 1.5s
```

**Key difference from old code:**
- ❌ OLD: Used `auth.currentUser` (doesn't auto-update)
- ✅ NEW: Uses `useAuth()` hook with `emailVerified` from context (auto-updates via onAuthStateChanged)
- `src/contexts/AuthContext.jsx` → Tracks `emailVerified` state
- `src/pages/Signup.jsx` → Sends email on new account
- `src/pages/Login.jsx` → Detects unverified emails, sends if needed
- `src/pages/EmailVerification.jsx` → Auto-verification polling
- `src/utils/emailVerification.js` → Helper functions with error handling
- `src/components/ProtectedRoute.jsx` → Blocks access until verified

**Critical implementation details:**

| Aspect | Implementation |
|--------|----------------|
| Auto-check trigger | `emailVerified` from context dependency (Firebase auto-updates) |
| Firebase reload in loop | Triggers `onAuthStateChanged()` to update context |
| Rate limit handling | Catch `auth/too-many-requests`, show friendly error |
| Loading states | ALWAYS set `setLoading(false)` before navigate() |
| Cleanup | Remove intervals on component unmount |
| Context dependency | MUST use `useAuth()` hook to get live `emailVerified` updates |

**Testing email verification:**
1. Create new account → Check spam folder for verification email
2. Click link → Firebase redirects back to app
3. App auto-detects `emailVerified: true` → Redirects to Dashboard
4. Try clicking "Resend" multiple times → Should show rate-limit error after 5 attempts
5. Logout during verification → Should clear email verification page

**Common mistakes to avoid:**
- ❌ Using `auth.currentUser` directly → Doesn't auto-update when email is verified
- ❌ Checking `user.emailVerified` directly without context → Won't trigger dependency updates
- ❌ Using `await reload(user)` in AuthContext → Causes unnecessary delays
- ❌ Forgetting to send email on Signup → User never receives link
- ❌ Not handling rate-limit (too-many-requests) → App crashes
- ❌ Polling too fast (1s instead of 3s) → Wasted Firebase API quota
- ❌ Not redirecting unverified users → They access app without email
- ❌ Not using `useAuth()` hook in EmailVerification.jsx → Loop in verification page
