import { describe, expect, it } from "vitest";

import {
  bookSauna,
  bookTrip,
  cancelBooking,
  cancelMeal,
  checkIn,
  checkOut,
  createBooking,
  emptyHotel,
  findBooking,
  hasActiveStay,
  isRoomFree,
  orderMeal,
  ROOM_SERVICE_FEE,
  ROOMS,
  SAUNA_CAPACITY,
  saunaSpotsLeft,
  signInWithBooking,
  signOutGuest,
  stayTotal,
  validateGuestName,
  type HotelState,
} from "@/lib/hotel";

const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length]!;
};

// Hitta ett rum som de påhittade gästerna inte redan har tagit de här nätterna.
function freeRoom(arrival: string, departure: string, beds = 2) {
  const room = ROOMS.find(
    (r) => r.beds >= beds && isRoomFree(emptyHotel, r.number, arrival, departure),
  );
  if (!room) throw new Error("inget ledigt rum i testdatat");
  return room;
}

function book(state: HotelState = emptyHotel, guests = 2) {
  const room = freeRoom("2026-12-01", "2026-12-04", guests);
  const result = createBooking(
    state,
    {
      roomNumber: room.number,
      guestName: "Gunnel från kören",
      guests,
      arrival: "2026-12-01",
      departure: "2026-12-04",
    },
    seq(0.4, 0.8, 0.2, 0.1),
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}

describe("rummen", () => {
  it("har 38 unika rum på tre våningar", () => {
    expect(ROOMS).toHaveLength(38);
    expect(new Set(ROOMS.map((r) => r.number)).size).toBe(38);
    expect(new Set(ROOMS.map((r) => r.floor))).toEqual(new Set([1, 2, 3]));
  });
});

describe("bokning", () => {
  it("skapar en bokning med kod och gör den aktiv", () => {
    const { state, booking } = book();
    expect(booking.code).toBe("HJ-482148");
    expect(state.activeCode).toBe(booking.code);
    expect(findBooking(state, "hj482148")).toBe(booking);
  });

  it("dubbelbokar aldrig samma rum för överlappande nätter", () => {
    const { state, booking } = book();
    expect(isRoomFree(state, booking.roomNumber, "2026-12-03", "2026-12-05")).toBe(false);
    expect(isRoomFree(state, booking.roomNumber, "2026-12-04", "2026-12-05")).toBe(
      isRoomFree(emptyHotel, booking.roomNumber, "2026-12-04", "2026-12-05"),
    );
    const again = createBooking(state, {
      roomNumber: booking.roomNumber,
      guestName: "Bertil",
      guests: 1,
      arrival: "2026-12-02",
      departure: "2026-12-03",
    });
    expect(again.ok).toBe(false);
  });

  it("nekar fler gäster än rummet rymmer", () => {
    const single = ROOMS.find((r) => r.beds === 1)!;
    const result = createBooking(emptyHotel, {
      roomNumber: single.number,
      guestName: "Bertil",
      guests: 2,
      arrival: "2026-12-01",
      departure: "2026-12-02",
    });
    expect(result.ok).toBe(false);
  });

  it("frigör rummet vid avbokning", () => {
    const { state, booking } = book();
    const cancelled = cancelBooking(state, booking.code);
    expect(cancelled.activeCode).toBeNull();
    expect(isRoomFree(cancelled, booking.roomNumber, booking.arrival, booking.departure)).toBe(
      true,
    );
  });
});

describe("gästinloggning", () => {
  it("kräver rätt kod och namnet på bokningen", () => {
    const { state, booking } = book();
    const loggedOut = signOutGuest(state);
    expect(loggedOut.activeCode).toBeNull();
    expect(signInWithBooking(loggedOut, booking.code, "Bertil").ok).toBe(false);
    expect(signInWithBooking(loggedOut, "HJ-000000", "Gunnel").ok).toBe(false);
    const ok = signInWithBooking(loggedOut, booking.code.toLowerCase(), "gunnel");
    expect(ok.ok && ok.state.activeCode).toBe(booking.code);
    expect(signInWithBooking(loggedOut, booking.code, "Gunnel från kören").ok).toBe(true);
  });

  it("låser bastu, mat och taxi efter utcheckning", () => {
    const { state, booking } = book();
    const out = findBooking(checkOut(checkIn(state, booking.code), booking.code), booking.code);
    expect(hasActiveStay(out)).toBe(false);
    expect(hasActiveStay(findBooking(state, booking.code))).toBe(true);
  });
});

describe("gästnamn", () => {
  it("tar emot påhittade namn men inte e-post eller personnummer", () => {
    expect(validateGuestName("Gunnel från kören")).toBeNull();
    expect(validateGuestName("gunnel@example.com")).not.toBeNull();
    expect(validateGuestName("19500101-1234")).not.toBeNull();
    expect(validateGuestName(" ")).not.toBeNull();
  });
});

describe("in- och utcheckning", () => {
  it("ger koder vid incheckning och tar bort dem vid utcheckning", () => {
    const { state, booking } = book();
    const checkedIn = findBooking(checkIn(state, booking.code, seq(0.5)), booking.code)!;
    expect(checkedIn.status).toBe("checked-in");
    expect(checkedIn.doorCode).toMatch(/^\d{4}$/);
    expect(checkedIn.wifiCode).not.toContain("kanelbulle");

    const out = checkOut(checkIn(state, booking.code), booking.code);
    const checkedOut = findBooking(out, booking.code)!;
    expect(checkedOut.status).toBe("checked-out");
    expect(checkedOut.doorCode).toBeUndefined();
    expect(isRoomFree(out, booking.roomNumber, booking.arrival, booking.departure)).toBe(true);
  });

  it("kan inte checka ut utan att ha checkat in", () => {
    const { state, booking } = book();
    expect(findBooking(checkOut(state, booking.code), booking.code)!.status).toBe("booked");
  });
});

describe("bastun", () => {
  it("blir aldrig fler än åtta", () => {
    let state: HotelState = emptyHotel;
    for (let i = 0; i < 20; i++) {
      const room = ROOMS.filter(
        (r) => r.beds === 4 && isRoomFree(state, r.number, "2026-12-01", "2026-12-04"),
      )[0];
      if (!room) break;
      const result = createBooking(state, {
        roomNumber: room.number,
        guestName: `Tenor ${i + 1}`,
        guests: 4,
        arrival: "2026-12-01",
        departure: "2026-12-04",
      });
      if (!result.ok) throw new Error(result.error);
      const sauna = bookSauna(result.state, result.booking.code, "2026-12-01", "07.00", 4);
      state = sauna.ok ? sauna.state : result.state;
    }
    const booked = state.bookings.flatMap((b) => b.sauna).reduce((sum, s) => sum + s.people, 0);
    expect(saunaSpotsLeft(state, "2026-12-01", "07.00")).toBeGreaterThanOrEqual(0);
    expect(booked).toBeLessThanOrEqual(SAUNA_CAPACITY);
  });

  it("bokas bara under vistelsen och för det egna sällskapet", () => {
    const { state, booking } = book();
    expect(bookSauna(state, booking.code, "2026-12-10", "19.00", 1).ok).toBe(false);
    expect(bookSauna(state, booking.code, "2026-12-01", "19.00", booking.guests + 1).ok).toBe(
      false,
    );
  });
});

describe("taxi och mat", () => {
  it("bokar taxi under vistelsen och räknar in den i totalen", () => {
    const { state, booking } = book();
    const trip = bookTrip(state, booking.code, {
      date: "2026-12-04",
      time: "10.00",
      destinationId: "flyg",
      people: 2,
    });
    expect(trip.ok).toBe(true);
    if (!trip.ok) return;
    const saved = findBooking(trip.state, booking.code)!;
    expect(saved.trips[0]!.destination).toBe("Hemavans flygplats");
    expect(stayTotal(saved).taxi).toBe(250);
    expect(
      bookTrip(state, booking.code, {
        date: "2026-12-20",
        time: "10.00",
        destinationId: "flyg",
        people: 1,
      }).ok,
    ).toBe(false);
  });

  it("beställer mat bara när rätten serveras, med avgift för rumsservice", () => {
    const { state, booking } = book();
    expect(
      orderMeal(state, booking.code, {
        date: "2026-12-02",
        time: "07.00",
        dishId: "renskav",
        portions: 1,
        place: "Matsalen",
      }).ok,
    ).toBe(false);
    const meal = orderMeal(state, booking.code, {
      date: "2026-12-02",
      time: "08.00",
      dishId: "frukost",
      portions: 2,
      place: "Till rummet",
    });
    expect(meal.ok).toBe(true);
    if (!meal.ok) return;
    const saved = findBooking(meal.state, booking.code)!;
    expect(saved.meals[0]!.price).toBe(2 * 145 + ROOM_SERVICE_FEE);
    expect(stayTotal(saved).total).toBe(stayTotal(saved).room + saved.meals[0]!.price);
    expect(
      findBooking(cancelMeal(meal.state, booking.code, saved.meals[0]!.id), booking.code)!.meals,
    ).toHaveLength(0);
  });
});
