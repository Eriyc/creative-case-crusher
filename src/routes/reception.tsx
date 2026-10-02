import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BedDouble,
  CarTaxiFront,
  Check,
  DoorOpen,
  LockKeyhole,
  LogIn,
  LogOut,
  Sparkles,
  TriangleAlert,
  UtensilsCrossed,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  checkIn,
  formatDate,
  nightsBetween,
  setTicketStatus,
  todayIso,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/hotel";
import { getHotel, saveHotel, useHotel } from "@/lib/hotel-store";
import { receptionDay, staffCheckIn, type Guest, type RoomStatus } from "@/lib/reception";
import { signIn, signOut, useStaffSession } from "@/lib/staff-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reception")({
  head: () => ({
    meta: [
      { title: "Receptionen — Hotell Hjortronet" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ReceptionPage,
});

function ReceptionPage() {
  const session = useStaffSession();
  return (
    <div className="desk-page">
      {session ? <Dashboard name={session.name} role={session.role} /> : <StaffLogin />}
    </div>
  );
}

function StaffLogin() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const result = await signIn(username, pin);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      setPin("");
    }
  }

  return (
    <main className="desk-login">
      <form onSubmit={submit} className="desk-card" aria-labelledby="desk-login-title">
        <LockKeyhole className="desk-login-icon" aria-hidden="true" />
        <h1 id="desk-login-title">Personalingång</h1>
        <p>Receptionsvyn är bara för personal med admin-behörighet.</p>
        <label className="drift-field">
          <span>Användarnamn</span>
          <input
            value={username}
            autoComplete="username"
            autoCapitalize="none"
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            required
          />
        </label>
        <label className="drift-field">
          <span>PIN-kod</span>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            autoComplete="current-password"
            onChange={(e) => {
              setPin(e.target.value);
              setError("");
            }}
            required
          />
        </label>
        {error && (
          <p className="drift-error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="desk-wide" disabled={busy || !username || !pin}>
          <LogIn aria-hidden="true" /> Logga in
        </Button>
        <Link to="/" className="desk-back">
          Gäst? Tillbaka till receptionen
        </Link>
      </form>
    </main>
  );
}

const statusLabel: Record<RoomStatus, string> = {
  free: "Ledigt",
  arriving: "Ankommer",
  occupied: "Upptaget",
  departing: "Avresa",
  "not-arrived": "Ej incheckad",
};

const priorityLabel: Record<TicketPriority, string> = {
  asap: "Snarast",
  today: "Idag",
  later: "Kan vänta",
};

const ticketStatusLabel: Record<TicketStatus, string> = {
  new: "Ny",
  "in-progress": "Pågår",
  done: "Klar",
};

function Dashboard({ name, role }: { name: string; role: string }) {
  const { state } = useHotel();
  const today = todayIso();
  const day = receptionDay(state, today);
  const urgent = day.tickets.filter((t) => t.priority === "asap").length;
  const arrivedCount = day.arrivals.filter((g) => g.checkedIn).length;

  function checkInGuest(guest: Guest) {
    const current = getHotel();
    saveHotel(guest.code ? checkIn(current, guest.code) : staffCheckIn(current, guest.key));
  }

  return (
    <main className="desk">
      <header className="desk-header">
        <div>
          <p className="panel-kicker">HOTELL HJORTRONET · PERSONAL</p>
          <h1>Receptionen</h1>
          <p className="desk-date">{longDate(today)}</p>
        </div>
        <div className="desk-user">
          <span>
            Inloggad som <strong>{name}</strong> · {role}
          </span>
          <Button variant="glass" size="sm" asChild>
            <Link to="/">Gästvyn</Link>
          </Button>
          <Button variant="glass" size="sm" onClick={signOut}>
            <LogOut aria-hidden="true" /> Logga ut
          </Button>
        </div>
      </header>

      <section className="desk-kpis" aria-label="Dagen i siffror">
        <Kpi icon={BedDouble} label="Belagda rum" value={`${day.occupied} / 38`} />
        <Kpi
          icon={DoorOpen}
          label="Ankomster idag"
          value={String(day.arrivals.length)}
          note={`${arrivedCount} incheckade`}
        />
        <Kpi
          icon={LogOut}
          label="Avresor idag"
          value={String(day.departures.length)}
          note="Utcheckning 11.00"
        />
        <Kpi
          icon={Wrench}
          label="Öppna felanmälningar"
          value={String(day.tickets.length)}
          note={urgent ? `${urgent} snarast` : "Inget akut"}
          alert={urgent > 0}
        />
      </section>

      <p className="desk-notice">
        <Users aria-hidden="true" />
        <span>
          I morgon: <strong>Hemavans Glada Tenorer</strong>, 40 gäster. Visa dem stora knappar, en
          sak i taget — och ha kaffet klart.
        </span>
      </p>

      <div className="desk-grid">
        <section className="desk-card" aria-labelledby="arrivals">
          <h2 id="arrivals">Ankomster idag</h2>
          {day.arrivals.length ? (
            <ul className="desk-list">
              {day.arrivals.map((g) => (
                <li key={g.key}>
                  <div>
                    <strong>{g.name}</strong>
                    <small>
                      Rum {g.room.number} · {g.room.type} · {g.guests}{" "}
                      {g.guests === 1 ? "gäst" : "gäster"} · {nightsLabel(g.arrival, g.departure)}
                      {g.code ? ` · ${g.code}` : ""}
                    </small>
                  </div>
                  {g.checkedIn ? (
                    <span className="desk-badge ok">
                      <Check aria-hidden="true" /> Incheckad
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => checkInGuest(g)}
                      aria-label={`Checka in ${g.name}, rum ${g.room.number}`}
                    >
                      Checka in
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="desk-empty">Inga ankomster idag.</p>
          )}

          <h2 className="desk-subhead">Avresor idag</h2>
          {day.departures.length ? (
            <ul className="desk-list">
              {day.departures.map((g) => (
                <li key={g.key}>
                  <div>
                    <strong>{g.name}</strong>
                    <small>
                      Rum {g.room.number} · ankom {formatDate(g.arrival)}
                    </small>
                  </div>
                  <span className="desk-badge">11.00</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="desk-empty">Inga avresor idag.</p>
          )}
        </section>

        <section className="desk-card" aria-labelledby="tickets">
          <h2 id="tickets">Felanmälningar</h2>
          {day.tickets.length ? (
            <ul className="desk-tickets">
              {day.tickets.map((t) => (
                <li key={t.id} className={cn(t.priority === "asap" && "urgent")}>
                  <div className="desk-ticket-head">
                    <span className={cn("desk-badge", t.priority === "asap" && "alert")}>
                      {t.priority === "asap" && <TriangleAlert aria-hidden="true" />}{" "}
                      {priorityLabel[t.priority]}
                    </span>
                    <strong>
                      Rum {t.room}: {t.fault}
                    </strong>
                  </div>
                  <small>
                    {t.id} · {t.category} ·{" "}
                    {new Date(t.createdAt).toLocaleTimeString("sv-SE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {t.mayEnter ? "Får gå in" : "Knacka först"}
                    {t.phone ? ` · Tel ${t.phone}` : ""}
                  </small>
                  {t.description && <p>”{t.description}”</p>}
                  <div className="desk-segment" role="radiogroup" aria-label={`Status för ${t.id}`}>
                    {(["new", "in-progress", "done"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={t.status === s}
                        className={cn(t.status === s && "selected")}
                        onClick={() => saveHotel(setTicketStatus(getHotel(), t.id, s))}
                      >
                        {ticketStatusLabel[s]}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="desk-empty">Inga öppna felanmälningar. Kjell är misstänkt lugn.</p>
          )}
          {state.tickets.some((t) => t.status === "done") && (
            <p className="desk-muted">
              {state.tickets.filter((t) => t.status === "done").length} klara ärenden döljs.
            </p>
          )}
        </section>
      </div>

      <section className="desk-card" aria-labelledby="rooms">
        <h2 id="rooms">Rumsstatus</h2>
        <div className="desk-legend" aria-hidden="true">
          {(Object.keys(statusLabel) as RoomStatus[]).map((s) => (
            <span key={s} className={`desk-room ${s}`}>
              {statusLabel[s]}
            </span>
          ))}
          <span className="desk-room flagged">Felanmälan</span>
        </div>
        {[3, 2, 1].map((floor) => (
          <div key={floor} className="room-floor">
            <p>Våning {floor}</p>
            <ul className="desk-rooms">
              {day.rows
                .filter((r) => r.room.floor === floor)
                .map((r) => (
                  <li
                    key={r.room.number}
                    className={cn("desk-room", r.status, r.openTickets.length > 0 && "flagged")}
                    title={r.guest ? `${r.guest.name} · ${r.room.type}` : r.room.type}
                  >
                    <strong>{r.room.number}</strong>
                    <small>{statusLabel[r.status]}</small>
                    <span className="sr-only">
                      {r.guest ? `, ${r.guest.name}` : ""}
                      {r.openTickets.length ? `, ${r.openTickets.length} öppen felanmälan` : ""}
                    </span>
                    {r.openTickets.length > 0 && (
                      <Wrench className="desk-room-flag" aria-hidden="true" />
                    )}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="desk-grid three">
        <section className="desk-card" aria-labelledby="sauna">
          <h2 id="sauna">
            <Zap aria-hidden="true" /> Bastu idag
          </h2>
          <ul className="desk-bars">
            {day.sauna.map(({ slot, booked }) => (
              <li key={slot}>
                <span>{slot}</span>
                <div aria-hidden="true">
                  <i
                    style={{ width: `${(booked / 8) * 100}%` }}
                    className={cn(booked >= 8 && "full")}
                  />
                </div>
                <b>{booked} / 8</b>
              </li>
            ))}
          </ul>
        </section>

        <section className="desk-card" aria-labelledby="kitchen">
          <h2 id="kitchen">
            <UtensilsCrossed aria-hidden="true" /> Kök idag
          </h2>
          {day.meals.length ? (
            <ul className="desk-list compact">
              {day.meals.map((m) => (
                <li key={m.id}>
                  <div>
                    <strong>
                      {m.time} · {m.portions} × {m.dish}
                    </strong>
                    <small>
                      {m.place === "Till rummet" ? `Till rum ${m.room}` : "Matsalen"} · {m.guest}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="desk-empty">Inga beställningar från appen idag.</p>
          )}
          <h2 className="desk-subhead">
            <CarTaxiFront aria-hidden="true" /> Taxi idag
          </h2>
          {day.trips.length ? (
            <ul className="desk-list compact">
              {day.trips.map((t) => (
                <li key={t.id}>
                  <div>
                    <strong>
                      {t.time} · {t.destination}
                    </strong>
                    <small>
                      Rum {t.room} · {t.people} pers. · {t.guest}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="desk-empty">Inga taxiresor idag.</p>
          )}
        </section>

        <section className="desk-card" aria-labelledby="aurora">
          <h2 id="aurora">
            <Sparkles aria-hidden="true" /> Norrsken i kväll
          </h2>
          <p className="desk-big">82 % · bäst 22–23</p>
          <p className="desk-muted">Klart, −12 grader, svag vind.</p>
          {day.auroraAlarms.length ? (
            <ul className="desk-list compact">
              {day.auroraAlarms.map((b) => (
                <li key={b.code}>
                  <div>
                    <strong>Rum {b.roomNumber}</strong>
                    <small>
                      {b.guestName} · väcks vid {b.aurora.minChance} %
                      {b.aurora.minChance <= 82 ? " — larmet går" : " — inget larm"}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="desk-empty">Inga incheckade gäster har norrskenslarm på.</p>
          )}
          <p className="desk-muted">Larmet går bara till gästens telefon. Aldrig i högtalarna.</p>
        </section>
      </div>

      <p className="desk-footnote">
        Prototyp: inloggningen är en spärr i webbläsaren och data finns bara på den här enheten.
        Påhittade gäster fyller ut de rum som inte bokats i appen.
      </p>
    </main>
  );
}

function nightsLabel(arrival: string, departure: string) {
  const nights = nightsBetween(arrival, departure);
  return `${nights} ${nights === 1 ? "natt" : "nätter"}`;
}

// "Fredag 2 oktober": bara första bokstaven versal.
function longDate(iso: string) {
  const text = new Date(`${iso}T12:00:00Z`).toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function Kpi({
  icon: Icon,
  label,
  value,
  note,
  alert,
}: {
  icon: typeof BedDouble;
  label: string;
  value: string;
  note?: string;
  alert?: boolean;
}) {
  return (
    <div className={cn("desk-kpi", alert && "alert")}>
      <Icon aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}
