# Screen Spec: Authentication

## Screens

### 1. Login Screen (`/auth/login`)

**Layout:** `AuthLayout` — centered card on dark background

```
┌─────────────────────────────────────────┐
│            ◉ BubbleTracker              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │        Welcome Back              │   │
│  │                                  │   │
│  │  ┌───────────────────────────┐  │   │
│  │  │ 📧 Email                  │  │   │
│  │  └───────────────────────────┘  │   │
│  │  ┌───────────────────────────┐  │   │
│  │  │ 🔒 Password               │  │   │
│  │  └───────────────────────────┘  │   │
│  │                                  │   │
│  │  [        Sign In          ]     │   │
│  │                                  │   │
│  │  Don't have an account?          │   │
│  │  Sign up →                       │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Fields:**
| Field | Type | Validation |
|-------|------|-----------|
| Email | `email` input | Required, valid email format |
| Password | `password` input (toggle visibility) | Required, min 8 chars |

**Actions:**
- **Sign In** — `POST /auth/login` with `{ email, password }`
  - Success: Store tokens → redirect to `/dashboard`
  - 401: Show inline error "Invalid email or password"
  - 400: Show inline error "Please check your inputs"
  - Network error: Show toast "Unable to connect to server"

**Navigation:**
- "Sign up" link → `/auth/register`

---

### 2. Register Screen (`/auth/register`)

**Layout:** `AuthLayout` — centered card on dark background

```
┌─────────────────────────────────────────┐
│            ◉ BubbleTracker              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      Create Your Account         │   │
│  │                                  │   │
│  │  ┌───────────────────────────┐  │   │
│  │  │ 👤 Display Name            │  │   │
│  │  └───────────────────────────┘  │   │
│  │  ┌───────────────────────────┐  │   │
│  │  │ 📧 Email                  │  │   │
│  │  └───────────────────────────┘  │   │
│  │  ┌───────────────────────────┐  │   │
│  │  │ 🔒 Password               │  │   │
│  │  └───────────────────────────┘  │   │
│  │  ┌───────────────────────────┐  │   │
│  │  │ 🔒 Confirm Password       │  │   │
│  │  └───────────────────────────┘  │   │
│  │                                  │   │
│  │  [      Create Account      ]    │   │
│  │                                  │   │
│  │  Already have an account?        │   │
│  │  Sign in →                       │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Fields:**
| Field | Type | Validation |
|-------|------|-----------|
| Display Name | `text` input | Required, min 1 char |
| Email | `email` input | Required, valid email format |
| Password | `password` input | Required, min 8 chars |
| Confirm Password | `password` input | Must match Password |

**Actions:**
- **Create Account** — `POST /auth/register` with `{ email, password, display_name }`
  - Success (201): Store tokens → redirect to `/dashboard`
  - 409: Show inline error "Email already registered"
  - 400: Show inline validation errors
  - Password mismatch: Client-side validation before submit

**Navigation:**
- "Sign in" link → `/auth/login`

---

## Token Management

### Storage Strategy

```typescript
// In-memory (lost on page refresh, more secure)
let accessToken: string | null = null

// localStorage for refresh token (survives refresh)
const refreshToken = localStorage.getItem('refresh_token')
```

### Auto-Refresh Flow (Axios Interceptor)

```
Request sent → 401 response
  → POST /auth/refresh with refresh_token
  → Success: store new tokens, retry original request
  → Failure: clear tokens, redirect to /auth/login
```

### Logout

- `POST /auth/logout` — revokes all refresh tokens server-side
- Clear in-memory access token + localStorage refresh token
- Clear Pinia auth store
- Redirect to `/auth/login`

---

## Auth Guard (Router)

```typescript
router.beforeEach((to, from) => {
  const authStore = useAuthStore()
  
  // Public routes — allow always
  if (to.path.startsWith('/auth')) {
    if (authStore.isAuthenticated) return '/dashboard'
    return true
  }
  
  // Protected routes — require auth
  if (!authStore.isAuthenticated) return '/auth/login'
  return true
})
```

---

## API Endpoints Used

| Endpoint | Method | Used In |
|----------|--------|---------|
| `/auth/login` | POST | Login form submit |
| `/auth/register` | POST | Register form submit |
| `/auth/refresh` | POST | Axios 401 interceptor |
| `/auth/logout` | POST | Logout button |
| `/auth/me` | GET | App init — validate token, load user profile |

---

## Pinia Store: `auth.ts`

```typescript
interface AuthState {
  user: { id: string; email: string; display_name: string } | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Actions
login(email: string, password: string): Promise<void>
register(email: string, password: string, displayName: string): Promise<void>
logout(): Promise<void>
refreshTokens(): Promise<void>
fetchUser(): Promise<void>  // GET /auth/me
```

---

## Error States

| State | Display |
|-------|---------|
| Network error | Toast: "Unable to connect. Check your connection." |
| 401 Unauthorized | Inline: "Invalid email or password" |
| 409 Conflict | Inline: "This email is already registered" |
| 400 Bad Request | Inline per-field: "Email is required", "Password must be at least 8 characters" |
| Loading | Button spinner + disabled state |
