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
- **Local LLM:** AIReports exists only in the Windows desktop build. The MSIX packages the workspace-provided llama.cpp runtime and Claude2 Alpaca 7B Q6_K GGUF, starts `llama-server.exe`, and loads the model at launch through Electron IPC. Prepare resources with `npm run desktop:ai:prepare`; it copies local files only and does not download the model. The web/PWA and Android WebView do not include the AI route or local service access.
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
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.google.com https://accounts.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob:; frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://*.google.com; worker-src 'self' blob:; connect-src 'self' https://firebase.googleapis.com https://firebaseappcheck.googleapis.com https://apis.google.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.google.com https://accounts.google.com https://*.firebaseio.com wss://*.firebaseio.com https://api.bcb.gov.br https://api.frankfurter.app" />
```

**Why this is needed:**
- `https://firebase.googleapis.com` - Firebase Realtime Database and main services
- `https://identitytoolkit.googleapis.com` - Firebase Authentication (sign in, email verification, etc.)
- `https://apis.google.com` - Google APIs initialization
- `firebaseappcheck.googleapis.com` - Firebase App Check token exchange
- `www.gstatic.com` and Google reCAPTCHA origins - App Check attestation resources

**Common CSP Issues & Solutions:**

| Error | Cause | Solution |
|-------|-------|----------|
| "violates connect-src" on sign in | Missing `identitytoolkit.googleapis.com` | Add to connect-src |
| "Loading script violates script-src" | Missing domain in script-src | Add domain to script-src |
| "Fetch API cannot load" + CSP error | Missing domain in connect-src | Add domain to connect-src |

**When adding new external services:**
1. **For JavaScript files** → Add domain to `script-src`
2. **For API calls (fetch/XHR)** → Add domain to `connect-src`; the desktop renderer calls the local llama.cpp runtime over Electron IPC, not direct HTTP
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

**Advanced flow (v4.2 - Cloud Functions + Custom Gmail):**

### New User Registration
```
1. User fills Signup form (email + password)
   ↓
2. Firebase creates account: createUserWithEmailAndPassword()
   ↓
3. Cloud Function "sendVerificationEmail" triggered automatically
   ↓
4. Email sent via Gmail (not Firebase domain) → Goes to Inbox ✓
   ↓
5. Show success → Redirect to /email-verification after 3s
   ↓
6. EmailVerification page displays: "Verificando email..."
   ↓
7. Polling every 1s on auth.currentUser.emailVerified
   ↓
8. User clicks link in email (in another tab/window)
   ↓
9. Firebase marks emailVerified = true
   ↓
10. Polling detects change (within 1s) → Auto-redirect to /login
```

### Cloud Functions Implementation
- **File:** `functions/index.js`
- **Trigger:** Automatically fires when new user is created (`auth.user().onCreate()`)
- **Email Service:** Nodemailer + Gmail (custom domain, not `noreply@firebase.com`)
- **Template:** Professional HTML email with SaldoFacil branding
- **Verification Link:** Generated via `admin.auth().generateEmailVerificationLink()`

### Setup Requirements
1. **Gmail Account with App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Enable Two-Factor Authentication first
   - Select Mail + Windows Computer
   - Generate 16-character password

2. **Firebase Configuration:**
   ```bash
   firebase functions:config:set gmail.email="your@gmail.com" gmail.password="16-char-password"
   ```

3. **Install Dependencies:**
   ```bash
   cd functions
   npm install
   cd ..
   ```

4. **Deploy:**
   ```bash
   firebase deploy --only functions
   ```

5. **Monitor Logs:**
   ```bash
   firebase functions:log
   ```

### Existing User Login (without email verification)
```
1. User enters credentials in Login page
   ↓
2. Firebase authenticates: signInWithEmailAndPassword()
   ↓
3. Check emailVerified flag: user.emailVerified === false
   ↓
4. Redirect to /email-verification page
   ↓
5. User clicks original verification link from signup email
   ↓
6. EmailVerification page detects verification and redirects to /login
```

### Email Verification Page (`EmailVerification.jsx`) - SIMPLIFIED
```
1. Shows simple message: "📧 Verificando email..."
   ↓
2. Polling every 1s: check auth.currentUser.emailVerified directly
   ↓
3. When user clicks verification link:
   - Firebase marks emailVerified = true
   - Polling detects change on next interval (within 1s)
   - Shows success message: "✓ Email verificado com sucesso!"
   ↓
4. Auto-redirect to /login after 1.5s
```

**Why Cloud Functions + Custom Gmail:**
- ✅ Emails come from trusted Gmail domain → Goes to Inbox
- ✅ Professional email template with branding
- ✅ No spam folder issues
- ✅ Reliable delivery (Gmail's infrastructure)
- ✅ Auto-triggered on new user creation
- ✅ Easy to add additional email features later
- ✅ Can add optional resend function if needed

**Implementation files:**
- `functions/index.js` → Cloud Functions for email sending
- `functions/package.json` → Dependencies (nodemailer, firebase-admin)
- `src/pages/Signup.jsx` → Creates account, Cloud Function handles email
- `src/pages/EmailVerification.jsx` → Polling + redirect logic
- `src/pages/Login.jsx` → Detects unverified users
- `src/contexts/AuthContext.jsx` → Provides `emailVerified` state
- `CLOUD_FUNCTIONS_SETUP.md` → Setup guide

**Testing email verification:**
1. Setup Cloud Functions (see CLOUD_FUNCTIONS_SETUP.md)
2. Create new account → Email arrives in Inbox within 1-2 minutes
3. Click link in email (opens Firebase confirmation page)
4. App auto-detects and redirects to /login within 1s
5. Login with credentials → Access dashboard

**Common mistakes to avoid:**
- ❌ Not enabling Two-Factor Authentication on Gmail account
- ❌ Using wrong Gmail app password (copy-paste carefully)
- ❌ Not running `firebase deploy --only functions`
- ❌ Committing `.runtimeconfig.json` to git (add to .gitignore)
- ❌ Not checking `firebase functions:log` for deployment errors
- ❌ Not setting environment variables before deployment

**Security Notes:**
- App password is stored in Firebase Functions environment (secure)
- Never commit `.runtimeconfig.json` to version control
- Can revoke app password anytime at https://myaccount.google.com/apppasswords
- Only this specific function can use the credentials
