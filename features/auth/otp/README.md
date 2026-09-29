# OTP verification

`OtpVerification` is the CertiTask email-verification screen. It uses the signed-in session and the existing `/api/auth/verify-email` and `/api/auth/resend-verification` endpoints. The server-issued email code is authoritative; the mock code `123456` is intentionally not enabled in this production-connected flow.

## Usage

```tsx
import { OtpVerification } from "@/features/auth/otp/OtpVerification";

<OtpVerification
  destination="person@example.com"
  onVerified={() => router.replace("/talent/dashboard")}
  onChangeDestination={() => router.push("/auth/signup")}
  length={6}
/>
```

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `destination` | `string` | required | Email address, masked before display |
| `onVerified` | `() => void` | required | Runs after successful verification |
| `onChangeDestination` | `() => void` | optional | Handles the Change action |
| `length` | `number` | `6` | Number of OTP digits |

`OtpInput` is also reusable independently with controlled `value`, `onChange`, optional `onComplete`, `length`, `status`, `disabled`, and `autoSubmit` props. Styling lives in `app/globals.css` and follows the shared navy/gold theme, system dark mode, and reduced-motion preference.

## State checklist

- [x] Entry: animated card, shield, masked email, Change action
- [x] Input: autofocus, digit filtering, advance/backspace/arrows, paste, autofill, Web OTP API when available
- [x] Verifying: locked inputs, animated shimmer, loading status and CTA
- [x] Success: green digits, drawn check, brief confetti, delayed dashboard redirect
- [x] Error: shake, inline remaining-attempt message, clear and refocus
- [x] Expired: detected by the server and offers a new code
- [x] Locked: five local failures trigger a one-minute countdown; server rate-limit responses are surfaced
- [x] Resend: 45-second ring countdown, toast, three-request client limit, server rate limit
- [x] Network failures, reduced motion, dark mode, keyboard focus, and narrow screens

For another auth provider, replace the fetch calls in `useOtpVerification.ts` with that provider's `verifyOtp(code)` and `resendOtp()` methods; keep the hook's state contract unchanged.