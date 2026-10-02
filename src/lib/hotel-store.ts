import { useSyncExternalStore } from "react";

import {
  emptyHotel,
  findBooking,
  signInWithBooking,
  signOutGuest,
  type HotelState,
} from "@/lib/hotel";

// Prototypens "databas": bokningarna sparas bara i den här webbläsaren.
const STORAGE_KEY = "hjortronet-hotel-v1";

let cache: HotelState | null = null;
const listeners = new Set<() => void>();

function read(): HotelState {
  if (cache) return cache;
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as Partial<HotelState> | null;
    // Bokningar sparade innan taxi och mat fanns får tomma listor.
    const bookings = (saved?.bookings ?? []).map((b) => ({
      ...b,
      trips: b.trips ?? [],
      meals: b.meals ?? [],
    }));
    cache = { ...emptyHotel, ...saved, bookings };
  } catch {
    cache = emptyHotel;
  }
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function saveHotel(next: HotelState) {
  cache = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

export function getHotel() {
  return read();
}

export function useHotel() {
  const state = useSyncExternalStore(subscribe, read, () => emptyHotel);
  return { state, active: findBooking(state, state.activeCode) };
}

// --- Gästinloggning med spärr: fem felförsök ger en minuts paus ---

const ATTEMPTS_KEY = "hjortronet-guest-attempts";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

export function guestSignIn(code: string, name: string, now = Date.now()) {
  let attempts = { count: 0, lockedUntil: 0 };
  try {
    attempts = { ...attempts, ...JSON.parse(sessionStorage.getItem(ATTEMPTS_KEY) ?? "{}") };
  } catch {
    // Trasig räknare: börja om.
  }
  if (attempts.lockedUntil > now) {
    return {
      ok: false as const,
      error: `För många försök. Vänta ${Math.ceil((attempts.lockedUntil - now) / 1000)} sekunder.`,
    };
  }
  const result = signInWithBooking(read(), code, name);
  if (!result.ok) {
    const count = attempts.count + 1;
    sessionStorage.setItem(
      ATTEMPTS_KEY,
      JSON.stringify(
        count >= MAX_ATTEMPTS
          ? { count: 0, lockedUntil: now + LOCKOUT_MS }
          : { count, lockedUntil: 0 },
      ),
    );
    return result;
  }
  sessionStorage.removeItem(ATTEMPTS_KEY);
  saveHotel(result.state);
  return result;
}

export function guestSignOut() {
  saveHotel(signOutGuest(read()));
}
