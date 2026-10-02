import { useSyncExternalStore } from "react";

// Personalinloggning för prototypen.
//
// OBS: Det här är en spärr i webbläsaren, inte riktig säkerhet. All data ligger redan i den här
// webbläsaren, och den som öppnar utvecklarverktygen kan ta sig förbi. I skarp drift ska inloggning,
// roller och behörighet kontrolleras på servern (t.ex. Lovable Cloud/Supabase Auth med rollkontroll
// i databasen), så att gästdata aldrig skickas till en webbläsare som inte är inloggad som personal.
//
// PIN-koder sparas aldrig i klartext, bara som SHA-256 av "hjortronet-staff:<användare>:<pin>".

export type StaffRole = "admin" | "staff";

type Account = { username: string; name: string; role: StaffRole; pinHash: string };

const ACCOUNTS: Account[] = [
  {
    username: "birgitta",
    name: "Birgitta",
    role: "admin",
    pinHash: "ecde1763f9732935e7b88860ad5ac3b1fe179157532cdeac91240ec8911eb285",
  },
];

// Rollen som krävs för receptionsvyn.
export const RECEPTION_ROLE: StaffRole = "admin";

export type StaffSession = { name: string; role: StaffRole; expiresAt: number };

const SESSION_KEY = "hjortronet-staff-session";
const ATTEMPTS_KEY = "hjortronet-staff-attempts";
const SESSION_HOURS = 8;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

async function sha256(text: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

type Attempts = { count: number; lockedUntil: number };

function readAttempts(): Attempts {
  try {
    return {
      count: 0,
      lockedUntil: 0,
      ...JSON.parse(sessionStorage.getItem(ATTEMPTS_KEY) ?? "{}"),
    };
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
}

function failedAttempt(now: number) {
  const attempts = readAttempts();
  const count = attempts.count + 1;
  const next =
    count >= MAX_ATTEMPTS ? { count: 0, lockedUntil: now + LOCKOUT_MS } : { count, lockedUntil: 0 };
  sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify(next));
}

export type SignInResult = { ok: true; session: StaffSession } | { ok: false; error: string };

export async function signIn(
  username: string,
  pin: string,
  now = Date.now(),
): Promise<SignInResult> {
  const lockedFor = readAttempts().lockedUntil - now;
  if (lockedFor > 0)
    return { ok: false, error: `För många försök. Vänta ${Math.ceil(lockedFor / 1000)} sekunder.` };

  const user = username.trim().toLowerCase();
  if (user === "kjell") {
    failedAttempt(now);
    return { ok: false, error: "Kjell har inte längre någon behörighet. Mjau." };
  }

  const account = ACCOUNTS.find((a) => a.username === user);
  const hash = await sha256(`hjortronet-staff:${user}:${pin.trim()}`);
  // Samma felmeddelande oavsett om användaren eller PIN-koden är fel.
  if (!account || account.pinHash !== hash) {
    failedAttempt(now);
    return { ok: false, error: "Fel användarnamn eller PIN-kod." };
  }
  if (account.role !== RECEPTION_ROLE)
    return { ok: false, error: "Ditt konto har inte behörighet till receptionen." };

  sessionStorage.removeItem(ATTEMPTS_KEY);
  const session: StaffSession = {
    name: account.name,
    role: account.role,
    expiresAt: now + SESSION_HOURS * 3_600_000,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  notify();
  return { ok: true, session };
}

export function signOut() {
  sessionStorage.removeItem(SESSION_KEY);
  notify();
}

// --- Sessionen som extern store, så att alla komponenter ser samma inloggning ---

const listeners = new Set<() => void>();
let cached: { raw: string | null; session: StaffSession | null } = { raw: null, session: null };

function notify() {
  listeners.forEach((listener) => listener());
}

function readSession(): StaffSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (raw !== cached.raw) {
    let session: StaffSession | null = null;
    try {
      session = raw ? (JSON.parse(raw) as StaffSession) : null;
    } catch {
      session = null;
    }
    cached = { raw, session };
  }
  const { session } = cached;
  return session && session.role === RECEPTION_ROLE && session.expiresAt > Date.now()
    ? session
    : null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// På servern finns ingen session: receptionsvyn renderas aldrig där.
export function useStaffSession() {
  return useSyncExternalStore(subscribe, readSession, () => null);
}
