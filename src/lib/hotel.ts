// Hotell Hjortronets bokningslogik. Allt här är påhittat: rummen, de andra gästerna och koderna.
// Funktionerna är rena (state in, state ut) så att de kan testas utan webbläsare.

export type RoomType = "Enkelrum" | "Dubbelrum" | "Fjällutsikt" | "Familjerum" | "Norrskenssviten";

export type Room = {
  number: number;
  floor: number;
  type: RoomType;
  beds: number;
  price: number;
  feature: string;
};

export type AuroraAlarm = { enabled: boolean; minChance: 50 | 70 | 90 };

export type SaunaBooking = { id: string; date: string; slot: string; people: number };

export type Trip = {
  id: string;
  date: string;
  time: string;
  destination: string;
  people: number;
  price: number;
};

export type MealPlace = "Matsalen" | "Till rummet";

export type Meal = {
  id: string;
  date: string;
  time: string;
  dish: string;
  portions: number;
  place: MealPlace;
  price: number;
};

export type BookingStatus = "booked" | "checked-in" | "checked-out";

export type Booking = {
  code: string;
  roomNumber: number;
  guestName: string;
  guests: number;
  arrival: string;
  departure: string;
  status: BookingStatus;
  aurora: AuroraAlarm;
  sauna: SaunaBooking[];
  trips: Trip[];
  meals: Meal[];
  doorCode?: string;
  wifiCode?: string;
};

export type HotelState = { bookings: Booking[]; activeCode: string | null };

export const emptyHotel: HotelState = { bookings: [], activeCode: null };

const roomTypes: Record<RoomType, { beds: number; price: number; feature: string }> = {
  Enkelrum: { beds: 1, price: 1150, feature: "Tyst, mot innergården" },
  Dubbelrum: { beds: 2, price: 1490, feature: "Mot byn och liften" },
  Fjällutsikt: { beds: 2, price: 1890, feature: "Utsikt mot Norra Storfjället" },
  Familjerum: { beds: 4, price: 2290, feature: "Dubbelsäng och våningssäng" },
  Norrskenssviten: { beds: 4, price: 3200, feature: "Takfönster rakt mot norrskenet" },
};

function typeFor(floor: number, index: number): RoomType {
  if (floor === 1) return index <= 4 ? "Enkelrum" : index <= 10 ? "Dubbelrum" : "Familjerum";
  if (floor === 2) return index <= 6 ? "Dubbelrum" : index <= 12 ? "Fjällutsikt" : "Familjerum";
  return index <= 8 ? "Fjällutsikt" : index <= 11 ? "Familjerum" : "Norrskenssviten";
}

// 12 + 14 + 12 = 38 rum, precis som hotellet i caset.
const floors: [floor: number, rooms: number][] = [
  [1, 12],
  [2, 14],
  [3, 12],
];

export const ROOMS: Room[] = floors.flatMap(([floor, count]) =>
  Array.from({ length: count }, (_, i) => {
    const type = typeFor(floor, i + 1);
    return { number: floor * 100 + i + 1, floor, type, ...roomTypes[type] };
  }),
);

export const SAUNA_SLOTS = ["07.00", "18.00", "19.00", "20.00", "21.00"];
export const SAUNA_CAPACITY = 8;
export const MAX_NIGHTS = 14;

export function roomByNumber(number: number) {
  return ROOMS.find((room) => room.number === number);
}

// --- Datum (ISO-strängar, räknade i UTC så att tidszoner inte flyttar nätter) ---

export function todayIso(now = new Date()) {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function nightsBetween(arrival: string, departure: string) {
  return Math.round(
    (Date.parse(`${departure}T00:00:00Z`) - Date.parse(`${arrival}T00:00:00Z`)) / 86400000,
  );
}

export function stayNights(arrival: string, departure: string) {
  return Array.from({ length: Math.max(0, nightsBetween(arrival, departure)) }, (_, i) =>
    addDays(arrival, i),
  );
}

export function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

// --- Påhittade andra gäster: deterministiskt så att samma datum alltid ser likadant ut ---

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function bookedByOthers(roomNumber: number, night: string) {
  return hash(`${roomNumber}|${night}`) % 100 < 22;
}

function activeBookings(state: HotelState, ignoreCode?: string) {
  return state.bookings.filter((b) => b.status !== "checked-out" && b.code !== ignoreCode);
}

export function isRoomFree(
  state: HotelState,
  roomNumber: number,
  arrival: string,
  departure: string,
  ignoreCode?: string,
) {
  const nights = stayNights(arrival, departure);
  if (nights.some((night) => bookedByOthers(roomNumber, night))) return false;
  return !activeBookings(state, ignoreCode).some(
    (b) => b.roomNumber === roomNumber && b.arrival < departure && arrival < b.departure,
  );
}

export function roomPrice(room: Room, arrival: string, departure: string) {
  return room.price * nightsBetween(arrival, departure);
}

// --- Gästuppgifter: bara ett namn, och aldrig något som ser ut som riktiga personuppgifter ---

export function validateGuestName(name: string) {
  const trimmed = name.trim();
  if (trimmed.length < 2) return "Skriv ett namn, gärna påhittat.";
  if (trimmed.length > 40) return "Kortare namn, tack. Hildur har bara en lapp.";
  if (trimmed.includes("@")) return "Hildur sparar inga e-postadresser här. Ett namn räcker.";
  if (/\d{6}/.test(trimmed.replace(/[\s-]/g, "")))
    return "Det där ser ut som ett personnummer. Det behöver Hildur inte.";
  return null;
}

type Random = () => number;

function digits(random: Random, count: number) {
  return Array.from({ length: count }, () => Math.floor(random() * 10)).join("");
}

const wifiWords = ["lavskrika", "fjallripa", "hjortron", "lappsparv", "dvargbjork", "kungsorn"];

export type BookingInput = {
  roomNumber: number;
  guestName: string;
  guests: number;
  arrival: string;
  departure: string;
  aurora?: boolean;
};

export type Result =
  { ok: true; state: HotelState; booking: Booking } | { ok: false; error: string };

export function createBooking(
  state: HotelState,
  input: BookingInput,
  random: Random = Math.random,
): Result {
  const room = roomByNumber(input.roomNumber);
  if (!room) return { ok: false, error: "Det rummet finns inte. Hotellet har 38 rum." };
  const nights = nightsBetween(input.arrival, input.departure);
  if (nights < 1 || nights > MAX_NIGHTS)
    return { ok: false, error: `Välj mellan 1 och ${MAX_NIGHTS} nätter.` };
  if (input.guests < 1 || input.guests > room.beds)
    return {
      ok: false,
      error: `${room.type} rymmer ${room.beds} ${room.beds === 1 ? "gäst" : "gäster"}.`,
    };
  const nameError = validateGuestName(input.guestName);
  if (nameError) return { ok: false, error: nameError };
  if (!isRoomFree(state, room.number, input.arrival, input.departure))
    return { ok: false, error: `Rum ${room.number} hann bli bokat. Välj ett annat.` };

  let code = `HJ-${digits(random, 4)}`;
  while (state.bookings.some((b) => b.code === code)) code = `HJ-${digits(random, 4)}`;
  const booking: Booking = {
    code,
    roomNumber: room.number,
    guestName: input.guestName.trim(),
    guests: input.guests,
    arrival: input.arrival,
    departure: input.departure,
    status: "booked",
    aurora: { enabled: Boolean(input.aurora), minChance: 70 },
    sauna: [],
    trips: [],
    meals: [],
  };
  return { ok: true, booking, state: { bookings: [...state.bookings, booking], activeCode: code } };
}

function update(state: HotelState, code: string, change: (b: Booking) => Booking): HotelState {
  return { ...state, bookings: state.bookings.map((b) => (b.code === code ? change(b) : b)) };
}

export function findBooking(state: HotelState, code: string | null) {
  if (!code) return undefined;
  const normalized = code
    .trim()
    .toUpperCase()
    .replace(/^(HJ)?-?/, "HJ-");
  return state.bookings.find((b) => b.code === normalized);
}

export function cancelBooking(state: HotelState, code: string): HotelState {
  return {
    bookings: state.bookings.filter((b) => b.code !== code),
    activeCode: state.activeCode === code ? null : state.activeCode,
  };
}

export function checkIn(state: HotelState, code: string, random: Random = Math.random): HotelState {
  return update(state, code, (b) =>
    b.status !== "booked"
      ? b
      : {
          ...b,
          status: "checked-in",
          doorCode: digits(random, 4),
          wifiCode: `${wifiWords[Math.floor(random() * wifiWords.length)]}-${digits(random, 2)}`,
        },
  );
}

export function checkOut(state: HotelState, code: string): HotelState {
  return update(state, code, (b) => {
    if (b.status !== "checked-in") return b;
    // Koderna slutar gälla vid utcheckning, så de sparas inte kvar.
    const { doorCode: _door, wifiCode: _wifi, ...rest } = b;
    return { ...rest, status: "checked-out" };
  });
}

export function setAuroraAlarm(state: HotelState, code: string, aurora: AuroraAlarm): HotelState {
  return update(state, code, (b) => ({ ...b, aurora }));
}

// --- Bastun: max åtta åt gången, aldrig fyrtio ---

function saunaBookedByOthers(date: string, slot: string) {
  return hash(`sauna|${date}|${slot}`) % 7;
}

export function saunaSpotsLeft(state: HotelState, date: string, slot: string) {
  const ours = activeBookings(state)
    .flatMap((b) => b.sauna)
    .filter((s) => s.date === date && s.slot === slot)
    .reduce((sum, s) => sum + s.people, 0);
  return Math.max(0, SAUNA_CAPACITY - saunaBookedByOthers(date, slot) - ours);
}

export function saunaDays(booking: Booking) {
  return stayNights(booking.arrival, booking.departure);
}

export function bookSauna(
  state: HotelState,
  code: string,
  date: string,
  slot: string,
  people: number,
  random: Random = Math.random,
): { ok: true; state: HotelState } | { ok: false; error: string } {
  const booking = findBooking(state, code);
  if (!booking || booking.status === "checked-out")
    return { ok: false, error: "Bastun bokas till en aktiv vistelse." };
  if (!saunaDays(booking).includes(date) || !SAUNA_SLOTS.includes(slot))
    return { ok: false, error: "Välj en tid under din vistelse." };
  if (people < 1 || people > booking.guests)
    return { ok: false, error: `Du kan boka för upp till ${booking.guests} i ditt sällskap.` };
  if (booking.sauna.some((s) => s.date === date && s.slot === slot))
    return { ok: false, error: "Den tiden har du redan." };
  const left = saunaSpotsLeft(state, date, slot);
  if (people > left)
    return {
      ok: false,
      error:
        left === 0
          ? "Fullt. Åtta är max — det har vi lärt oss."
          : `Bara ${left} platser kvar den tiden.`,
    };
  const sauna: SaunaBooking = { id: `${date}-${slot}-${digits(random, 4)}`, date, slot, people };
  return {
    ok: true,
    state: update(state, code, (b) => ({
      ...b,
      sauna: [...b.sauna, sauna].sort((x, y) =>
        `${x.date} ${x.slot}`.localeCompare(`${y.date} ${y.slot}`),
      ),
    })),
  };
}

export function cancelSauna(state: HotelState, code: string, id: string): HotelState {
  return update(state, code, (b) => ({ ...b, sauna: b.sauna.filter((s) => s.id !== id) }));
}

export function saunaEnd(slot: string) {
  const hour = Number(slot.slice(0, 2)) + 1;
  return `${String(hour).padStart(2, "0")}.00`;
}

// --- Taxi: hämtning vid hotellets entré ---

export const DESTINATIONS = [
  { id: "flyg", name: "Hemavans flygplats", note: "Cirka 10 minuter", price: 250 },
  { id: "byn", name: "Hemavans by och liften", note: "Cirka 5 minuter", price: 150 },
  { id: "tarnaby", name: "Tärnaby", note: "Cirka 25 minuter", price: 590 },
  { id: "storuman", name: "Storumans tågstation", note: "Cirka 1,5 timme", price: 1650 },
];

export const TAXI_TIMES = ["08.00", "10.00", "12.00", "14.00", "16.00", "18.00"];

// Under vistelsen: från ankomstdagen till och med avresedagen.
export function stayDays(booking: Booking) {
  return [...stayNights(booking.arrival, booking.departure), booking.departure];
}

type ExtraResult = { ok: true; state: HotelState } | { ok: false; error: string };

function activeStay(state: HotelState, code: string) {
  const booking = findBooking(state, code);
  return booking && booking.status !== "checked-out" ? booking : undefined;
}

export function bookTrip(
  state: HotelState,
  code: string,
  input: { date: string; time: string; destinationId: string; people: number },
  random: Random = Math.random,
): ExtraResult {
  const booking = activeStay(state, code);
  if (!booking) return { ok: false, error: "Taxi bokas till en aktiv vistelse." };
  const destination = DESTINATIONS.find((d) => d.id === input.destinationId);
  if (!destination) return { ok: false, error: "Välj vart du vill åka." };
  if (!stayDays(booking).includes(input.date) || !TAXI_TIMES.includes(input.time))
    return { ok: false, error: "Välj en dag under din vistelse." };
  if (input.people < 1 || input.people > booking.guests)
    return { ok: false, error: `Taxin kan ta upp till ${booking.guests} från ditt rum.` };
  const trip: Trip = {
    id: `taxi-${input.date}-${input.time}-${digits(random, 4)}`,
    date: input.date,
    time: input.time,
    destination: destination.name,
    people: input.people,
    price: destination.price,
  };
  return {
    ok: true,
    state: update(state, code, (b) => ({ ...b, trips: [...b.trips, trip].sort(byTime) })),
  };
}

export function cancelTrip(state: HotelState, code: string, id: string): HotelState {
  return update(state, code, (b) => ({ ...b, trips: b.trips.filter((t) => t.id !== id) }));
}

// --- Mat: till matsalen eller upp på rummet ---

export const MENU = [
  {
    id: "frukost",
    name: "Frukostbricka",
    note: "Gröt, ägg, kaffe och kanelbulle",
    price: 145,
    times: ["07.00", "08.00", "09.00"],
  },
  {
    id: "soppa",
    name: "Svampsoppa",
    note: "Vegetarisk, med nybakat bröd",
    price: 165,
    times: ["12.00", "13.00", "17.00", "18.00"],
  },
  {
    id: "renskav",
    name: "Renskav med potatismos",
    note: "Med lingon och pressgurka",
    price: 265,
    times: ["17.00", "18.00", "19.00"],
  },
  {
    id: "roding",
    name: "Fjällröding",
    note: "Med smörsås och dillpotatis",
    price: 285,
    times: ["17.00", "18.00", "19.00"],
  },
  {
    id: "parfait",
    name: "Hjortronparfait",
    note: "Efterrätt. Kjell får inte smaka.",
    price: 95,
    times: ["12.00", "13.00", "18.00", "19.00", "20.00"],
  },
];

export const ROOM_SERVICE_FEE = 50;
export const MAX_PORTIONS = 8;

export function orderMeal(
  state: HotelState,
  code: string,
  input: { date: string; time: string; dishId: string; portions: number; place: MealPlace },
  random: Random = Math.random,
): ExtraResult {
  const booking = activeStay(state, code);
  if (!booking) return { ok: false, error: "Mat beställs till en aktiv vistelse." };
  const dish = MENU.find((d) => d.id === input.dishId);
  if (!dish) return { ok: false, error: "Välj en rätt." };
  if (!stayDays(booking).includes(input.date) || !dish.times.includes(input.time))
    return { ok: false, error: `${dish.name} serveras inte den tiden.` };
  if (input.portions < 1 || input.portions > MAX_PORTIONS)
    return { ok: false, error: `Välj mellan 1 och ${MAX_PORTIONS} portioner.` };
  const meal: Meal = {
    id: `mat-${input.date}-${input.time}-${digits(random, 4)}`,
    date: input.date,
    time: input.time,
    dish: dish.name,
    portions: input.portions,
    place: input.place,
    price: dish.price * input.portions + (input.place === "Till rummet" ? ROOM_SERVICE_FEE : 0),
  };
  return {
    ok: true,
    state: update(state, code, (b) => ({ ...b, meals: [...b.meals, meal].sort(byTime) })),
  };
}

export function cancelMeal(state: HotelState, code: string, id: string): HotelState {
  return update(state, code, (b) => ({ ...b, meals: b.meals.filter((m) => m.id !== id) }));
}

function byTime(a: { date: string; time: string }, b: { date: string; time: string }) {
  return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
}

// Rum + mat + taxi. Bastun ingår.
export function stayTotal(booking: Booking) {
  const room = roomByNumber(booking.roomNumber);
  const roomCost = room ? roomPrice(room, booking.arrival, booking.departure) : 0;
  const food = booking.meals.reduce((sum, m) => sum + m.price, 0);
  const taxi = booking.trips.reduce((sum, t) => sum + t.price, 0);
  return { room: roomCost, food, taxi, total: roomCost + food + taxi };
}
