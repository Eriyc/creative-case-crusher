import { useSyncExternalStore } from "react";

import { emptyHotel, findBooking, type HotelState } from "@/lib/hotel";

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
