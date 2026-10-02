// Receptionens översikt över dagen. Rena funktioner: samma state och datum ger alltid samma svar.
// Gäster som inte bokat i appen är påhittade och härleds deterministiskt ur rumsnummer och datum.

import {
  addDays,
  bookedByOthers,
  hash,
  MAX_NIGHTS,
  ROOMS,
  roomByNumber,
  SAUNA_CAPACITY,
  SAUNA_SLOTS,
  saunaSpotsLeft,
  type Booking,
  type HotelState,
  type Room,
  type Ticket,
  type TicketPriority,
} from "@/lib/hotel";

export type RoomStatus = "free" | "arriving" | "occupied" | "departing" | "not-arrived";

export type Guest = {
  key: string;
  name: string;
  room: Room;
  guests: number;
  arrival: string;
  departure: string;
  checkedIn: boolean;
  // Satt för gäster som bokat i appen. Påhittade gäster har ingen kod.
  code?: string;
};

export type RoomRow = { room: Room; status: RoomStatus; guest?: Guest; openTickets: Ticket[] };

const firstNames = [
  "Gunnel",
  "Bertil",
  "Sonja",
  "Arne",
  "Inga",
  "Rune",
  "Majken",
  "Sixten",
  "Elvy",
  "Tore",
  "Margit",
  "Holger",
];
const lastNames = [
  "Fjällström",
  "Ripgren",
  "Lavsson",
  "Myrberg",
  "Tärnqvist",
  "Snöberg",
  "Hjortlund",
  "Björkstam",
];

function fictionalGuest(state: HotelState, room: Room, arrival: string): Guest {
  const h = hash(`gäst|${room.number}|${arrival}`);
  let nights = 1;
  while (nights < MAX_NIGHTS && bookedByOthers(room.number, addDays(arrival, nights))) nights++;
  const key = `${room.number}|${arrival}`;
  return {
    key,
    name: `${firstNames[h % firstNames.length]} ${lastNames[(h >>> 8) % lastNames.length]}`,
    room,
    guests: 1 + ((h >>> 16) % room.beds),
    arrival,
    departure: addDays(arrival, nights),
    checkedIn: state.staffCheckins.includes(key),
  };
}

// Första natten i en sammanhängande följd av påhittade nätter.
function fictionalArrival(roomNumber: number, night: string) {
  let arrival = night;
  for (let i = 0; i < MAX_NIGHTS && bookedByOthers(roomNumber, addDays(arrival, -1)); i++)
    arrival = addDays(arrival, -1);
  return arrival;
}

function appGuest(booking: Booking): Guest {
  const room = roomByNumber(booking.roomNumber)!;
  return {
    key: booking.code,
    code: booking.code,
    name: booking.guestName,
    room,
    guests: booking.guests,
    arrival: booking.arrival,
    departure: booking.departure,
    checkedIn: booking.status === "checked-in",
  };
}

const priorityRank: Record<TicketPriority, number> = { asap: 0, today: 1, later: 2 };

export function openTickets(state: HotelState) {
  return state.tickets
    .filter((t) => t.status !== "done")
    .sort(
      (a, b) => priorityRank[a.priority] - priorityRank[b.priority] || a.createdAt - b.createdAt,
    );
}

export function roomRows(state: HotelState, today: string): RoomRow[] {
  const open = openTickets(state);
  const yesterday = addDays(today, -1);
  return ROOMS.map((room) => {
    const tickets = open.filter((t) => t.room.trim() === String(room.number));
    const booking = state.bookings.find(
      (b) =>
        b.roomNumber === room.number &&
        b.status !== "checked-out" &&
        b.arrival <= today &&
        today <= b.departure,
    );
    if (booking) {
      const guest = appGuest(booking);
      const status: RoomStatus =
        booking.departure === today
          ? "departing"
          : booking.status === "checked-in"
            ? "occupied"
            : booking.arrival === today
              ? "arriving"
              : "not-arrived";
      return { room, status, guest, openTickets: tickets };
    }
    const tonight = bookedByOthers(room.number, today);
    const lastNight = bookedByOthers(room.number, yesterday);
    if (tonight) {
      const guest = fictionalGuest(state, room, fictionalArrival(room.number, today));
      const status: RoomStatus =
        guest.arrival === today && !guest.checkedIn ? "arriving" : "occupied";
      return { room, status, guest, openTickets: tickets };
    }
    if (lastNight) {
      const guest = fictionalGuest(state, room, fictionalArrival(room.number, yesterday));
      return { room, status: "departing", guest, openTickets: tickets };
    }
    return { room, status: "free", openTickets: tickets };
  });
}

export function receptionDay(state: HotelState, today: string) {
  const rows = roomRows(state, today);
  const arrivals = rows.filter((r) => r.guest && r.guest.arrival === today).map((r) => r.guest!);
  const departures = rows.filter((r) => r.status === "departing").map((r) => r.guest!);
  const occupied = rows.filter(
    (r) => r.status === "occupied" || r.status === "arriving" || r.status === "not-arrived",
  ).length;
  const active = state.bookings.filter((b) => b.status !== "checked-out");

  const sauna = SAUNA_SLOTS.map((slot) => ({
    slot,
    booked: SAUNA_CAPACITY - saunaSpotsLeft(state, today, slot),
  }));
  const meals = active
    .flatMap((b) => b.meals.map((m) => ({ ...m, room: b.roomNumber, guest: b.guestName })))
    .filter((m) => m.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));
  const trips = active
    .flatMap((b) => b.trips.map((t) => ({ ...t, room: b.roomNumber, guest: b.guestName })))
    .filter((t) => t.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));
  const auroraAlarms = active.filter((b) => b.status === "checked-in" && b.aurora.enabled);

  return {
    rows,
    arrivals: arrivals.sort(
      (a, b) => Number(a.checkedIn) - Number(b.checkedIn) || a.room.number - b.room.number,
    ),
    departures,
    occupied,
    tickets: openTickets(state),
    sauna,
    meals,
    trips,
    auroraAlarms,
  };
}

export function staffCheckIn(state: HotelState, guestKey: string): HotelState {
  if (state.staffCheckins.includes(guestKey)) return state;
  return { ...state, staffCheckins: [...state.staffCheckins, guestKey] };
}
