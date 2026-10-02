import { afterEach, describe, expect, it } from "vitest";

import {
  addTicket,
  createBooking,
  emptyHotel,
  isRoomFree,
  ROOMS,
  setTicketStatus,
  type HotelState,
  type Ticket,
} from "@/lib/hotel";
import { receptionDay, staffCheckIn } from "@/lib/reception";
import { signIn, signOut } from "@/lib/staff-auth";

const today = "2026-12-01";

const ticket = (overrides: Partial<Ticket>): Ticket => ({
  id: "HJ-00001",
  room: "101",
  fault: "Elementet är kallt",
  category: "Värme & vatten",
  priority: "today",
  phone: "",
  description: "",
  mayEnter: true,
  status: "new",
  createdAt: 1,
  ...overrides,
});

describe("receptionens dag", () => {
  it("visar alla 38 rum och en ankomst för en bokning som börjar idag", () => {
    const room = ROOMS.find((r) => isRoomFree(emptyHotel, r.number, today, "2026-12-03"))!;
    const result = createBooking(emptyHotel, {
      roomNumber: room.number,
      guestName: "Gunnel från kören",
      guests: 1,
      arrival: today,
      departure: "2026-12-03",
    });
    if (!result.ok) throw new Error(result.error);

    const day = receptionDay(result.state, today);
    expect(day.rows).toHaveLength(38);
    expect(day.arrivals.find((g) => g.code === result.booking.code)?.name).toBe(
      "Gunnel från kören",
    );
    expect(day.rows.find((r) => r.room.number === room.number)?.status).toBe("arriving");
  });

  it("checkar in påhittade gäster och räknar inte klara ärenden som öppna", () => {
    const day = receptionDay(emptyHotel, today);
    const fictional = day.arrivals.find((g) => !g.code);
    if (fictional) {
      const after = receptionDay(staffCheckIn(emptyHotel, fictional.key), today);
      expect(after.arrivals.find((g) => g.key === fictional.key)?.checkedIn).toBe(true);
    }

    let state: HotelState = addTicket(
      emptyHotel,
      ticket({ id: "HJ-1", priority: "later", createdAt: 1 }),
    );
    state = addTicket(state, ticket({ id: "HJ-2", priority: "asap", createdAt: 2 }));
    expect(receptionDay(state, today).tickets.map((t) => t.id)).toEqual(["HJ-2", "HJ-1"]);
    expect(
      receptionDay(state, today).rows.find((r) => r.room.number === 101)?.openTickets,
    ).toHaveLength(2);
    state = setTicketStatus(state, "HJ-2", "done");
    expect(receptionDay(state, today).tickets.map((t) => t.id)).toEqual(["HJ-1"]);
  });
});

describe("personalinloggning", () => {
  afterEach(() => {
    signOut();
    sessionStorage.clear();
  });

  it("släpper in admin med rätt PIN och sparar sessionen", async () => {
    const result = await signIn("Birgitta", "7302");
    expect(result.ok).toBe(true);
    expect(sessionStorage.getItem("hjortronet-staff-session")).toContain("admin");
  });

  it("nekar fel PIN, Kjell och låser efter fem försök", async () => {
    expect((await signIn("birgitta", "0000")).ok).toBe(false);
    const kjell = await signIn("kjell", "7302");
    expect(kjell.ok || kjell.error).toContain("Kjell");
    for (let i = 0; i < 3; i++) await signIn("birgitta", "1111");
    const locked = await signIn("birgitta", "7302");
    expect(locked.ok || locked.error).toContain("För många försök");
  });
});
