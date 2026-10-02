import {
  BedDouble,
  CalendarDays,
  CarTaxiFront,
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudMoon,
  Coffee,
  Eye,
  EyeOff,
  Cat,
  Clock,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  Minus,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Thermometer,
  UtensilsCrossed,
  Wifi,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  addDays,
  bookSauna,
  bookTrip,
  cancelBooking,
  cancelMeal,
  cancelSauna,
  cancelTrip,
  checkIn,
  checkOut,
  createBooking,
  findBooking,
  DESTINATIONS,
  formatDate,
  isRoomFree,
  MAX_NIGHTS,
  MAX_PORTIONS,
  MENU,
  nightsBetween,
  orderMeal,
  ROOM_SERVICE_FEE,
  ROOMS,
  roomByNumber,
  roomPrice,
  SAUNA_SLOTS,
  saunaDays,
  saunaEnd,
  saunaSpotsLeft,
  setAuroraAlarm,
  stayDays,
  stayTotal,
  TAXI_TIMES,
  todayIso,
  validateGuestName,
  type AuroraAlarm,
  type Booking,
  type MealPlace,
} from "@/lib/hotel";
import { getHotel, guestSignIn, guestSignOut, saveHotel, useHotel } from "@/lib/hotel-store";
import { type HotelPanel, type NavTarget } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export type { HotelPanel, NavTarget };

type PanelProps = { onBack: () => void; onNavigate: (target: NavTarget) => void };

const kr = (amount: number) => `${amount.toLocaleString("sv-SE")} kr`;
const firstName = (name: string) => name.split(" ")[0];

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="back-button" type="button" onClick={onClick}>
      <ChevronLeft className="size-4" /> Tillbaka
    </button>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <div className="guest-stepper">
      <span>{label}</span>
      <div>
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Minska ${label.toLowerCase()}`}
        >
          <Minus />
        </button>
        <strong aria-live="polite">
          {value}
          {unit && <small> {unit}</small>}
        </strong>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Öka ${label.toLowerCase()}`}
        >
          <Plus />
        </button>
      </div>
    </div>
  );
}

function InlineError({ children }: { children: ReactNode }) {
  return children ? (
    <p className="inline-error" role="alert">
      {children}
    </p>
  ) : null;
}

function Message({ message }: { message: { ok: boolean; text: string } | null }) {
  if (!message) return null;
  return (
    <p
      className={message.ok ? "inline-success" : "inline-error"}
      role={message.ok ? "status" : "alert"}
    >
      {message.text}
    </p>
  );
}

function DayPicker({
  days,
  value,
  onChange,
}: {
  days: string[];
  value: string;
  onChange: (day: string) => void;
}) {
  return (
    <div className="chip-row day-row" role="radiogroup" aria-label="Dag">
      {days.map((d) => (
        <button
          key={d}
          type="button"
          role="radio"
          aria-checked={d === value}
          className={cn("chip", d === value && "selected")}
          onClick={() => onChange(d)}
        >
          {formatDate(d)}
        </button>
      ))}
    </div>
  );
}

// Bastu, taxi och mat bokas på rummet. Utan rum visar vi en enkel väg dit.
function NeedsRoom({
  kicker,
  title,
  text,
  onBack,
  onNavigate,
}: PanelProps & { kicker: string; title: string; text: string }) {
  return (
    <div className="panel-content">
      <BackButton onClick={onBack} />
      <p className="panel-kicker">{kicker}</p>
      <h2>{title}</h2>
      <p className="hildur-copy">{text}</p>
      <div className="action-row">
        <Button onClick={() => onNavigate("login")}>
          <LogIn className="size-4" /> Logga in med bokning
        </Button>
        <Button variant="glass" onClick={() => onNavigate("book")}>
          <BedDouble className="size-4" /> Boka rum
        </Button>
      </div>
    </div>
  );
}

// --- Bokningsportalen: stora, tydliga val. Besökare ser info, gäster ser sina tjänster. ---

type PortalItem = { target: NavTarget; icon: LucideIcon; title: string; text: string };

const visitorPortal: PortalItem[] = [
  { target: "book", icon: BedDouble, title: "Boka rum", text: "Välj ett av våra 38 rum" },
  {
    target: "login",
    icon: LogIn,
    title: "Jag har en bokning",
    text: "Logga in med din bokningskod",
  },
  {
    target: "about",
    icon: Cat,
    title: "Om hotellet och Kjell",
    text: "Rum, tider och vår hotellkatt",
  },
  { target: "reviews", icon: Star, title: "Omdömen", text: "Vad tidigare gäster tyckte" },
];

const guestPortal: PortalItem[] = [
  { target: "sauna", icon: Zap, title: "Boka bastu", text: "Välj timme och hur många ni är" },
  { target: "aurora", icon: Sparkles, title: "Norrsken", text: "Chansen i kväll och väckning" },
  {
    target: "taxi",
    icon: CarTaxiFront,
    title: "Boka taxi",
    text: "Till flyget, byn eller Tärnaby",
  },
  { target: "food", icon: UtensilsCrossed, title: "Boka mat", text: "Frukost, lunch och middag" },
  { target: "report", icon: Wrench, title: "Felanmälan", text: "Något på rummet som krånglar?" },
];

const lockedPreview: { target: NavTarget; label: string }[] = [
  { target: "sauna", label: "Bastu" },
  { target: "food", label: "Mat" },
  { target: "taxi", label: "Taxi" },
  { target: "aurora", label: "Norrskenslarm" },
  { target: "report", label: "Felanmälan" },
];

function PortalButton({
  item,
  onNavigate,
}: {
  item: PortalItem;
  onNavigate: (target: NavTarget) => void;
}) {
  const Icon = item.icon;
  return (
    <button type="button" className="portal-item" onClick={() => onNavigate(item.target)}>
      <span className="portal-icon" aria-hidden="true">
        <Icon />
      </span>
      <span>
        <strong>{item.title}</strong>
        <small>{item.text}</small>
      </span>
      <ChevronRight className="portal-arrow" aria-hidden="true" />
    </button>
  );
}

export function PortalMenu({
  booking,
  onNavigate,
}: {
  booking: Booking | undefined;
  onNavigate: (target: NavTarget) => void;
}) {
  if (!booking) {
    return (
      <>
        <nav className="portal" aria-label="Vad vill du göra?">
          {visitorPortal.map((item) => (
            <PortalButton key={item.target} item={item} onNavigate={onNavigate} />
          ))}
        </nav>
        <div className="locked-preview">
          <p>
            <Lock aria-hidden="true" /> Med en bokning kan du också boka:
          </p>
          <ul>
            {lockedPreview.map(({ target, label }) => (
              <li key={target}>
                <button
                  type="button"
                  onClick={() => onNavigate(target)}
                  aria-label={`${label} – kräver bokning`}
                >
                  <Lock aria-hidden="true" /> {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  }
  const room: PortalItem = {
    target: "stay",
    icon: KeyRound,
    title: "Mitt rum",
    text:
      booking.status === "checked-out"
        ? "Se kvittot från din vistelse"
        : `Rum ${booking.roomNumber} · ${booking.status === "checked-in" ? "se dörrkoden" : "checka in här"}`,
  };
  const items =
    booking.status === "checked-out" ? [room, visitorPortal[3]!] : [room, ...guestPortal];
  return (
    <nav className="portal" aria-label="Vad vill du göra?">
      {items.map((item) => (
        <PortalButton key={item.target} item={item} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

// --- Logga in med bokningskod + namn ---

const loginReasons: Partial<Record<NavTarget, string>> = {
  sauna: "Bastun bokas på ditt rum.",
  aurora: "Norrskenslarmet går till ditt rum.",
  taxi: "Taxin bokas på ditt rum.",
  food: "Maten bokas på ditt rum.",
  report: "Felanmälan kopplas till ditt rum.",
  stay: "Ditt rum och dina koder finns här.",
  reviews: "Bara gäster som bott här kan betygsätta.",
};

export function LoginPanel({
  onBack,
  onNavigate,
  next,
}: PanelProps & { next?: NavTarget | undefined }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const reason = next ? loginReasons[next] : undefined;

  return (
    <div className="panel-content">
      <BackButton onClick={onBack} />
      <p className="panel-kicker">LOGGA IN</p>
      <h2>Har du bokat?</h2>
      <p className="hildur-copy">
        {reason ? `${reason} ` : ""}Skriv din bokningskod och namnet på bokningen.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const result = guestSignIn(code, name);
          if (!result.ok) return setError(result.error);
          onNavigate(next ?? "stay");
        }}
      >
        <label className="field">
          <span>Bokningskod</span>
          <input
            value={code}
            placeholder="HJ-123456"
            autoComplete="off"
            autoCapitalize="characters"
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
          />
        </label>
        <label className="field">
          <span>Namn på bokningen (förnamn räcker)</span>
          <input
            value={name}
            autoComplete="off"
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
          />
        </label>
        <InlineError>{error}</InlineError>
        <Button type="submit" className="wide-button" disabled={!code.trim() || !name.trim()}>
          <LogIn className="size-4" /> Logga in
        </Button>
      </form>
      <p className="panel-note">
        Har du inte bokat?{" "}
        <button type="button" className="text-button" onClick={() => onNavigate("book")}>
          Boka ett rum
        </button>
      </p>
      <p className="panel-note">
        Koden finns i din bokningsbekräftelse. Glömt den? Fråga receptionen.
      </p>
    </div>
  );
}

// --- Om hotellet och Kjell: öppet för alla ---

export function AboutPanel({ onBack, onNavigate }: PanelProps) {
  return (
    <div className="panel-content">
      <BackButton onClick={onBack} />
      <p className="panel-kicker">OM HOTELLET</p>
      <h2>Hotell Hjortronet</h2>
      <p className="hildur-copy">
        Ett familjehotell i Hemavan sedan 1948, med fjället precis utanför fönstret.
      </p>
      <ul className="stay-info about-list">
        <li>
          <BedDouble className="size-4" /> 38 rum på tre våningar, från enkelrum till
          Norrskenssviten
        </li>
        <li>
          <Clock className="size-4" /> Incheckning från 15.00 · utcheckning senast 11.00
        </li>
        <li>
          <Coffee className="size-4" /> Frukost 07.00–10.00 i matsalen
        </li>
        <li>
          <Zap className="size-4" /> Vedeldad bastu för åtta personer åt gången
        </li>
        <li>
          <Sparkles className="size-4" /> Norrsken syns ofta över fjället från november till mars
        </li>
      </ul>

      <div className="about-kjell">
        <Cat aria-hidden="true" />
        <div>
          <h3>Kjell, hotellets katt</h3>
          <p>
            Rödvit, nio år och tidigare admin i gamla Hildur. Behörigheten är indragen — i dag
            serverar han kaffe i receptionen, tar emot klappar och sover gärna på skidjackor.
          </p>
          <p className="panel-note">
            Allergisk? Säg till i receptionen så håller vi Kjell borta från ditt rum.
          </p>
        </div>
      </div>

      <div className="action-row">
        <Button variant="glass" onClick={() => onNavigate("reviews")}>
          <Star className="size-4" /> Läs omdömen
        </Button>
        <Button variant="glass" onClick={() => onNavigate("security")}>
          <ShieldCheck className="size-4" /> Vårt trygghetslöfte
        </Button>
        <Button variant="glass" onClick={() => onNavigate("cloud")}>
          <Cloud className="size-4" /> Hur Hildur drivs
        </Button>
      </div>
    </div>
  );
}

// --- Boka rum: ett steg i taget ---

export function BookingPanel({ onBack, onNavigate }: PanelProps) {
  const { state } = useHotel();
  const today = todayIso();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [arrival, setArrival] = useState(today);
  const [nights, setNights] = useState(2);
  const [guests, setGuests] = useState(2);
  const [roomNumber, setRoomNumber] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [aurora, setAurora] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Booking | null>(null);

  const departure = addDays(arrival, nights);
  const room = roomNumber ? roomByNumber(roomNumber) : undefined;
  const freeRooms = ROOMS.filter(
    (r) => r.beds >= guests && isRoomFree(state, r.number, arrival, departure),
  );

  function confirm() {
    if (!roomNumber) return;
    const result = createBooking(getHotel(), {
      roomNumber,
      guestName: name,
      guests,
      arrival,
      departure,
      aurora,
    });
    if (!result.ok) return setError(result.error);
    saveHotel(result.state);
    setCreated(result.booking);
    setStep(4);
  }

  if (step === 4 && created) {
    const bookedRoom = roomByNumber(created.roomNumber)!;
    return (
      <div className="panel-content">
        <div className="success-state">
          <span>
            <Check className="size-6" />
          </span>
          <p className="panel-kicker">BOKNINGEN ÄR KLAR</p>
          <h2>Rum {created.roomNumber} väntar.</h2>
          <p className="booking-code" aria-label={`Bokningskod ${created.code}`}>
            {created.code}
          </p>
          <p>
            {bookedRoom.type} · {formatDate(created.arrival)} – {formatDate(created.departure)} ·{" "}
            {created.guests} {created.guests === 1 ? "gäst" : "gäster"}
          </p>
          <div className="action-row center">
            <Button onClick={() => onNavigate("stay")}>
              <KeyRound className="size-4" /> Min vistelse
            </Button>
            <Button variant="glass" onClick={() => onNavigate("sauna")}>
              <Zap className="size-4" /> Boka bastu
            </Button>
          </div>
          <p className="panel-note">
            Spara koden. Den räcker för att hitta bokningen igen — inget lösenord behövs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-content">
      <BackButton
        onClick={
          step === 1
            ? onBack
            : () => {
                setError("");
                setStep((step - 1) as 1 | 2);
              }
        }
      />
      <p className="panel-kicker">BOKA RUM · STEG {step} AV 3</p>

      {step === 1 && (
        <>
          <h2>När kommer du?</h2>
          <label className="field">
            <span>Ankomst</span>
            <input
              type="date"
              value={arrival}
              min={today}
              max={addDays(today, 365)}
              onChange={(e) =>
                e.target.value && setArrival(e.target.value < today ? today : e.target.value)
              }
            />
          </label>
          <Stepper label="Nätter" value={nights} min={1} max={MAX_NIGHTS} onChange={setNights} />
          <Stepper label="Gäster" value={guests} min={1} max={4} onChange={setGuests} />
          <p className="panel-summary">
            <CalendarDays className="size-4" /> {formatDate(arrival)} – {formatDate(departure)} ·
            utcheckning 11.00
          </p>
          <Button
            onClick={() => {
              setRoomNumber(null);
              setStep(2);
            }}
          >
            <Search className="size-4" /> Visa lediga rum
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <h2>Välj rum.</h2>
          <p className="panel-summary">
            {freeRooms.length} av 38 rum lediga för {guests} {guests === 1 ? "gäst" : "gäster"},{" "}
            {formatDate(arrival)} – {formatDate(departure)}
          </p>
          <div className="room-legend" aria-hidden="true">
            <span className="free">Ledigt</span>
            <span className="taken">Upptaget</span>
            <span className="small">För litet</span>
          </div>
          {[3, 2, 1].map((floor) => (
            <div className="room-floor" key={floor}>
              <p>Våning {floor}</p>
              <div className="room-grid">
                {ROOMS.filter((r) => r.floor === floor).map((r) => {
                  const tooSmall = r.beds < guests;
                  const free = isRoomFree(state, r.number, arrival, departure);
                  const status = tooSmall ? "för litet" : free ? "ledigt" : "upptaget";
                  return (
                    <button
                      key={r.number}
                      type="button"
                      className={cn(
                        "room-tile",
                        tooSmall ? "small" : free ? "free" : "taken",
                        roomNumber === r.number && "selected",
                      )}
                      disabled={tooSmall || !free}
                      aria-pressed={roomNumber === r.number}
                      aria-label={`Rum ${r.number}, ${r.type}, ${status}`}
                      onClick={() => setRoomNumber(r.number)}
                    >
                      {r.number}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {room ? (
            <div className="room-detail">
              <BedDouble className="size-5" />
              <div>
                <strong>
                  Rum {room.number} · {room.type}
                </strong>
                <small>
                  {room.feature} · {room.beds} {room.beds === 1 ? "bädd" : "bäddar"} ·{" "}
                  {kr(room.price)}/natt
                </small>
              </div>
              <b>{kr(roomPrice(room, arrival, departure))}</b>
            </div>
          ) : (
            <p className="panel-note">
              {freeRooms.length
                ? "Tryck på ett ledigt rum för att se det."
                : "Inga lediga rum de datumen. Prova andra datum eller färre gäster."}
            </p>
          )}
          <Button disabled={!room} onClick={() => setStep(3)}>
            Fortsätt med rum {room?.number ?? "…"}
          </Button>
        </>
      )}

      {step === 3 && room && (
        <>
          <h2>Vem bor här?</h2>
          <label className="field">
            <span>Namn på bokningen</span>
            <input
              value={name}
              maxLength={40}
              autoComplete="off"
              placeholder="T.ex. Gunnel från kören"
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
            />
          </label>
          <button
            type="button"
            role="switch"
            aria-checked={aurora}
            className="switch-row"
            onClick={() => setAurora(!aurora)}
          >
            <span className="switch" aria-hidden="true" />
            <span>
              <strong>Väck mig vid norrsken</strong>
              <small>Bara när himlen är klar. Kan ändras senare.</small>
            </span>
          </button>
          <div className="room-detail">
            <BedDouble className="size-5" />
            <div>
              <strong>
                Rum {room.number} · {room.type}
              </strong>
              <small>
                {formatDate(arrival)} – {formatDate(departure)} ·{" "}
                {nightsBetween(arrival, departure)} nätter · {guests}{" "}
                {guests === 1 ? "gäst" : "gäster"}
              </small>
            </div>
            <b>{kr(roomPrice(room, arrival, departure))}</b>
          </div>
          <InlineError>{error}</InlineError>
          <Button
            onClick={() => {
              const problem = validateGuestName(name);
              if (problem) setError(problem);
              else confirm();
            }}
          >
            <Check className="size-4" /> Bekräfta bokning
          </Button>
          <p className="panel-note">
            Hildur sparar bara namn, datum och rum. Inga kort, inga personnummer — och i prototypen
            dras inga pengar.
          </p>
        </>
      )}
    </div>
  );
}

// --- Norrskenslarmet: rätt larm, rätt kväll, rätt mottagare ---

export function AuroraAlarmSettings({ booking }: { booking: Booking }) {
  const set = (aurora: AuroraAlarm) => saveHotel(setAuroraAlarm(getHotel(), booking.code, aurora));
  const { enabled, minChance } = booking.aurora;
  return (
    <div className="alarm-settings">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        className="switch-row"
        onClick={() => set({ ...booking.aurora, enabled: !enabled })}
      >
        <span className="switch" aria-hidden="true" />
        <span>
          <strong>Norrskenslarm {enabled ? "på" : "av"}</strong>
          <small>Till din telefon i rum {booking.roomNumber} — aldrig i matsalens högtalare.</small>
        </span>
      </button>
      {enabled && (
        <div className="chip-row" role="radiogroup" aria-label="Väck mig om chansen är minst">
          <span>Väck mig om chansen är minst</span>
          {([50, 70, 90] as const).map((chance) => (
            <button
              key={chance}
              type="button"
              role="radio"
              aria-checked={minChance === chance}
              className={cn("chip", minChance === chance && "selected")}
              onClick={() => set({ enabled, minChance: chance })}
            >
              {chance}%
            </button>
          ))}
        </div>
      )}
      {enabled && (
        <p className="panel-note">
          Hildur kollar molnen först. Regnar det blir det inget larm — oavsett klockslag.
        </p>
      )}
    </div>
  );
}

// --- Min vistelse: bokad → incheckad → utcheckad ---

export function StayPanel({ onBack, onNavigate }: PanelProps) {
  const { active } = useHotel();
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [confirming, setConfirming] = useState<"cancel" | "checkout" | null>(null);

  if (!active) return <LoginPanel onBack={onBack} onNavigate={onNavigate} next="stay" />;

  const room = roomByNumber(active.roomNumber)!;
  const nights = nightsBetween(active.arrival, active.departure);
  const totals = stayTotal(active);
  const today = todayIso();

  if (active.status === "checked-out") {
    return (
      <div className="panel-content">
        <BackButton onClick={onBack} />
        <p className="panel-kicker">UTCHECKAD · {active.code}</p>
        <h2>Tack för besöket, {firstName(active.guestName)}.</h2>
        <dl className="stay-card">
          <dt>Rum {room.number}</dt>
          <dd>
            {nights} × {kr(room.price)}
          </dd>
          <dt>Mat</dt>
          <dd>{kr(totals.food)}</dd>
          <dt>Taxi</dt>
          <dd>{kr(totals.taxi)}</dd>
          <dt>Bastu</dt>
          <dd>{active.sauna.length} pass · ingår</dd>
          <dt>Kjells kaffe</dt>
          <dd>Bjuder huset på</dd>
          <dt className="total">Totalt</dt>
          <dd className="total">{kr(totals.total)}</dd>
        </dl>
        <p className="panel-note">
          Påhittat kvitto. Ingen betalning dras i prototypen. Dörrkoden och Wi-Fi-koden är redan
          avstängda.
        </p>
        <div className="action-row">
          <Button
            onClick={() => {
              guestSignOut();
              onNavigate("book");
            }}
          >
            <BedDouble className="size-4" /> Boka igen
          </Button>
          <Button
            variant="glass"
            onClick={() => {
              guestSignOut();
              onBack();
            }}
          >
            Till receptionen
          </Button>
        </div>
      </div>
    );
  }

  const checkedIn = active.status === "checked-in";

  return (
    <div className="panel-content">
      <BackButton onClick={onBack} />
      <p className="panel-kicker">
        {checkedIn ? "INCHECKAD" : "BOKAD"} · {active.code}
      </p>
      <h2>
        {checkedIn ? `Rum ${room.number} är ditt.` : `Välkommen, ${firstName(active.guestName)}.`}
      </h2>

      <dl className="stay-card">
        <dt>Rum</dt>
        <dd>
          {room.number} · {room.type}, våning {room.floor}
        </dd>
        <dt>Datum</dt>
        <dd>
          {formatDate(active.arrival)} – {formatDate(active.departure)} · {nights}{" "}
          {nights === 1 ? "natt" : "nätter"}
        </dd>
        <dt>Gäster</dt>
        <dd>{active.guests}</dd>
        <dt>Att betala</dt>
        <dd>{kr(totals.total)}</dd>
      </dl>

      {checkedIn ? (
        <div className="key-card">
          <div>
            <KeyRound className="size-4" />
            <span>Dörrkod</span>
            <b>{showSecrets ? active.doorCode : "••••"}</b>
          </div>
          <div>
            <Wifi className="size-4" />
            <span>Wi-Fi · Hjortronet-Gäst</span>
            <b>{showSecrets ? active.wifiCode : "•••••••"}</b>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() => setShowSecrets(!showSecrets)}
            aria-pressed={showSecrets}
          >
            {showSecrets ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}{" "}
            {showSecrets ? "Dölj koder" : "Visa koder"}
          </button>
          <small>Personliga, påhittade koder. Visas bara här — aldrig i högtalarna.</small>
        </div>
      ) : (
        <div className="checkin-box">
          <strong>Checka in</strong>
          {active.arrival > today && (
            <small>
              Incheckning öppnar 15.00 {formatDate(active.arrival)}. I prototypen går det redan nu.
            </small>
          )}
          <label className="check-row">
            <input
              type="checkbox"
              checked={rulesAccepted}
              onChange={(e) => setRulesAccepted(e.target.checked)}
            />
            <span>
              Jag har läst husreglerna: max åtta i bastun, tyst efter 23.00 och Kjell är inte admin.
            </span>
          </label>
          <Button
            disabled={!rulesAccepted}
            onClick={() => saveHotel(checkIn(getHotel(), active.code))}
          >
            <KeyRound className="size-4" /> Checka in och få digital nyckel
          </Button>
        </div>
      )}

      <ul className="stay-info">
        <li>
          <Coffee className="size-4" /> Frukost 07.00–10.00 i matsalen
        </li>
        <li>
          <LogOut className="size-4" /> Utcheckning senast 11.00 {formatDate(active.departure)}
        </li>
        <li>
          <Zap className="size-4" />
          {active.sauna.length
            ? `Bastu: ${active.sauna.map((s) => `${formatDate(s.date)} ${s.slot}`).join(", ")}`
            : "Ingen bastu bokad än"}
          <button type="button" className="text-button" onClick={() => onNavigate("sauna")}>
            {active.sauna.length ? "Ändra" : "Boka"}
          </button>
        </li>
        <li>
          <UtensilsCrossed className="size-4" />
          {active.meals.length
            ? `Mat: ${active.meals.map((m) => `${m.dish} ${formatDate(m.date)} ${m.time}`).join(", ")}`
            : "Ingen mat beställd än"}
          <button type="button" className="text-button" onClick={() => onNavigate("food")}>
            {active.meals.length ? "Ändra" : "Boka"}
          </button>
        </li>
        <li>
          <CarTaxiFront className="size-4" />
          {active.trips.length
            ? `Taxi: ${active.trips.map((t) => `${t.destination} ${formatDate(t.date)} ${t.time}`).join(", ")}`
            : "Ingen taxi bokad än"}
          <button type="button" className="text-button" onClick={() => onNavigate("taxi")}>
            {active.trips.length ? "Ändra" : "Boka"}
          </button>
        </li>
      </ul>

      <AuroraAlarmSettings booking={active} />

      <div className="action-row">
        {confirming ? (
          <>
            <Button
              onClick={() => {
                saveHotel(
                  confirming === "checkout"
                    ? checkOut(getHotel(), active.code)
                    : cancelBooking(getHotel(), active.code),
                );
                setConfirming(null);
                setShowSecrets(false);
              }}
            >
              <Check className="size-4" />{" "}
              {confirming === "checkout" ? "Ja, checka ut" : "Ja, avboka"}
            </Button>
            <Button variant="glass" onClick={() => setConfirming(null)}>
              Nej
            </Button>
          </>
        ) : checkedIn ? (
          <Button variant="glass" onClick={() => setConfirming("checkout")}>
            <LogOut className="size-4" /> Checka ut
          </Button>
        ) : (
          <Button variant="glass" onClick={() => setConfirming("cancel")}>
            Avboka
          </Button>
        )}
        {!confirming && (
          <Button
            variant="glass"
            onClick={() => {
              guestSignOut();
              onBack();
            }}
          >
            <LogOut className="size-4" /> Logga ut
          </Button>
        )}
      </div>
      <p className="panel-note">
        Logga ut om du lånat någon annans telefon. Du loggar in igen med koden {active.code} och
        ditt namn.
      </p>
    </div>
  );
}

// --- Bastun: bokas på rummet, max åtta per pass ---

export function SaunaPanel({ onBack, onNavigate }: PanelProps) {
  const { state, active } = useHotel();
  const days = active ? saunaDays(active) : [];
  const [day, setDay] = useState(() => days.find((d) => d >= todayIso()) ?? days[0] ?? "");
  const [slot, setSlot] = useState("19.00");
  const [people, setPeople] = useState(active?.guests ?? 1);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (!active || active.status === "checked-out") {
    return (
      <NeedsRoom
        kicker="BASTU"
        title="Bastun bokas på ditt rum."
        text="Så vet Hildur alltid hur många som är där. Åtta får plats. Inte fyrtio."
        onBack={onBack}
        onNavigate={onNavigate}
      />
    );
  }

  const selectedDay = days.includes(day) ? day : days[0]!;
  const left = saunaSpotsLeft(state, selectedDay, slot);
  const maxPeople = Math.max(1, Math.min(active.guests, left));

  return (
    <div className="panel-content">
      <BackButton onClick={onBack} />
      <p className="panel-kicker">BASTU · RUM {active.roomNumber}</p>
      <h2>Välj en varm timme.</h2>
      <DayPicker
        days={days}
        value={selectedDay}
        onChange={(d) => {
          setDay(d);
          setMessage(null);
        }}
      />
      <div className="time-grid sauna-grid">
        {SAUNA_SLOTS.map((s) => {
          const spots = saunaSpotsLeft(state, selectedDay, s);
          const mine = active.sauna.some((b) => b.date === selectedDay && b.slot === s);
          return (
            <button
              key={s}
              type="button"
              className={cn(slot === s && "selected")}
              disabled={spots === 0 && !mine}
              aria-pressed={slot === s}
              onClick={() => {
                setSlot(s);
                setPeople(Math.min(people, Math.max(1, spots)));
                setMessage(null);
              }}
            >
              <strong>{s}</strong>
              <small>{mine ? "din tid" : spots === 0 ? "fullt" : `${spots} av 8 lediga`}</small>
            </button>
          );
        })}
      </div>
      <Stepper
        label="Antal personer"
        value={Math.min(people, maxPeople)}
        min={1}
        max={maxPeople}
        onChange={setPeople}
      />
      <Button
        disabled={left === 0}
        onClick={() => {
          const result = bookSauna(
            getHotel(),
            active.code,
            selectedDay,
            slot,
            Math.min(people, maxPeople),
          );
          if (!result.ok) return setMessage({ ok: false, text: result.error });
          saveHotel(result.state);
          setMessage({
            ok: true,
            text: `Bokat: ${formatDate(selectedDay)} ${slot}–${saunaEnd(slot)}. Kjell räknas inte.`,
          });
        }}
      >
        <Check className="size-4" /> Boka {slot} för {Math.min(people, maxPeople)}
      </Button>
      <Message message={message} />
      {active.sauna.length > 0 && (
        <ul className="sauna-list" aria-label="Dina bastutider">
          {active.sauna.map((s) => (
            <li key={s.id}>
              <span>
                {formatDate(s.date)} · {s.slot}–{saunaEnd(s.slot)} · {s.people}{" "}
                {s.people === 1 ? "person" : "personer"}
              </span>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  saveHotel(cancelSauna(getHotel(), active.code, s.id));
                  setMessage(null);
                }}
              >
                Avboka
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// --- Norrsken: chans, väder och ditt larm (påhittad prognos) ---

const auroraHours = [
  { hour: "21", chance: 45, weather: "Lite moln" },
  { hour: "22", chance: 82, weather: "Klart" },
  { hour: "23", chance: 64, weather: "Klart" },
  { hour: "00", chance: 20, weather: "Moln" },
];

export function AuroraPanel({ onBack, onNavigate }: PanelProps) {
  const { active } = useHotel();
  return (
    <div className="panel-content">
      <BackButton onClick={onBack} />
      <p className="panel-kicker">NORRSKEN I KVÄLL</p>
      <h2>Bra chans i kväll!</h2>
      <div className="aurora-score">
        <strong>82%</strong>
        <span>
          <b>Bäst klockan 22–23</b>
          <small>Titta mot norr, över fjället</small>
        </span>
      </div>
      <ul className="weather" aria-label="Vädret i kväll">
        <li>
          <CloudMoon /> <span>Himlen</span> <b>Klar</b>
        </li>
        <li>
          <Thermometer /> <span>Kyla</span> <b>−12 grader</b>
        </li>
        <li>
          <Wind /> <span>Vind</span> <b>Svag</b>
        </li>
      </ul>
      <div className="forecast" aria-label="Chans per timme">
        {auroraHours.map(({ hour, chance, weather }) => (
          <span key={hour} className={chance >= 70 ? "good" : chance >= 40 ? "maybe" : "poor"}>
            <b>Kl. {hour}</b>
            <small>
              {chance}% · {weather}
            </small>
          </span>
        ))}
      </div>
      {active && active.status !== "checked-out" ? (
        <AuroraAlarmSettings booking={active} />
      ) : (
        <button type="button" className="switch-row muted" onClick={() => onNavigate("book")}>
          <Moon className="size-4" />
          <span>
            <strong>Vill du bli väckt?</strong>
            <small>Boka ett rum så kan Hildur väcka dig — bara när himlen är klar.</small>
          </span>
        </button>
      )}
      <p className="panel-note">Klä dig varmt: mössa, vantar och kaffe i termos.</p>
    </div>
  );
}

// --- Taxi: först vart, sedan när ---

export function TaxiPanel({ onBack, onNavigate }: PanelProps) {
  const { active } = useHotel();
  const days = active ? stayDays(active) : [];
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [day, setDay] = useState(() => days.find((d) => d >= todayIso()) ?? days[0] ?? "");
  const [time, setTime] = useState("10.00");
  const [people, setPeople] = useState(active?.guests ?? 1);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (!active || active.status === "checked-out") {
    return (
      <NeedsRoom
        kicker="TAXI"
        title="Taxin bokas på ditt rum."
        text="Då vet chauffören vem som ska med. Du betalar när du checkar ut."
        onBack={onBack}
        onNavigate={onNavigate}
      />
    );
  }

  const destination = DESTINATIONS.find((d) => d.id === destinationId);
  const selectedDay = days.includes(day) ? day : days[0]!;

  if (!destination) {
    return (
      <div className="panel-content">
        <BackButton onClick={onBack} />
        <p className="panel-kicker">TAXI · STEG 1 AV 2</p>
        <h2>Vart vill du åka?</h2>
        <div className="choice-list">
          {DESTINATIONS.map((d) => (
            <button
              key={d.id}
              type="button"
              className="choice"
              onClick={() => setDestinationId(d.id)}
            >
              <span>
                <strong>{d.name}</strong>
                <small>{d.note}</small>
              </span>
              <b>{kr(d.price)}</b>
            </button>
          ))}
        </div>
        <TripList booking={active} onCancel={() => setMessage(null)} />
      </div>
    );
  }

  return (
    <div className="panel-content">
      <BackButton
        onClick={() => {
          setDestinationId(null);
          setMessage(null);
        }}
      />
      <p className="panel-kicker">TAXI · STEG 2 AV 2</p>
      <h2>När ska du åka?</h2>
      <p className="panel-summary">
        <CarTaxiFront className="size-4" /> Till {destination.name} · hämtning vid hotellets entré
      </p>
      <DayPicker
        days={days}
        value={selectedDay}
        onChange={(d) => {
          setDay(d);
          setMessage(null);
        }}
      />
      <div className="time-grid">
        {TAXI_TIMES.map((t) => (
          <button
            key={t}
            type="button"
            className={cn(time === t && "selected")}
            aria-pressed={time === t}
            onClick={() => {
              setTime(t);
              setMessage(null);
            }}
          >
            <strong>{t}</strong>
          </button>
        ))}
      </div>
      <Stepper
        label="Antal personer"
        value={Math.min(people, active.guests)}
        min={1}
        max={active.guests}
        onChange={setPeople}
      />
      <Button
        onClick={() => {
          const result = bookTrip(getHotel(), active.code, {
            date: selectedDay,
            time,
            destinationId: destination.id,
            people: Math.min(people, active.guests),
          });
          if (!result.ok) return setMessage({ ok: false, text: result.error });
          saveHotel(result.state);
          setMessage({
            ok: true,
            text: `Klart! Taxin står vid entrén ${formatDate(selectedDay)} klockan ${time}.`,
          });
        }}
      >
        <Check className="size-4" /> Boka taxi {time} · {kr(destination.price)}
      </Button>
      <Message message={message} />
      <TripList booking={active} onCancel={() => setMessage(null)} />
    </div>
  );
}

function TripList({ booking, onCancel }: { booking: Booking; onCancel: () => void }) {
  if (!booking.trips.length) return null;
  return (
    <ul className="sauna-list" aria-label="Dina taxiresor">
      {booking.trips.map((t) => (
        <li key={t.id}>
          <span>
            {formatDate(t.date)} {t.time} · {t.destination} · {t.people} pers.
          </span>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              saveHotel(cancelTrip(getHotel(), booking.code, t.id));
              onCancel();
            }}
          >
            Avboka
          </button>
        </li>
      ))}
    </ul>
  );
}

// --- Mat: först vad, sedan när och var ---

export function FoodPanel({ onBack, onNavigate }: PanelProps) {
  const { active } = useHotel();
  const days = active ? stayDays(active) : [];
  const [dishId, setDishId] = useState<string | null>(null);
  const [day, setDay] = useState(() => days.find((d) => d >= todayIso()) ?? days[0] ?? "");
  const [time, setTime] = useState("");
  const [portions, setPortions] = useState(active?.guests ?? 1);
  const [place, setPlace] = useState<MealPlace>("Matsalen");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (!active || active.status === "checked-out") {
    return (
      <NeedsRoom
        kicker="MAT"
        title="Maten bokas på ditt rum."
        text="Då kan köket duka åt rätt antal. Du betalar när du checkar ut."
        onBack={onBack}
        onNavigate={onNavigate}
      />
    );
  }

  const dish = MENU.find((d) => d.id === dishId);
  const selectedDay = days.includes(day) ? day : days[0]!;

  if (!dish) {
    return (
      <div className="panel-content">
        <BackButton onClick={onBack} />
        <p className="panel-kicker">MAT · STEG 1 AV 2</p>
        <h2>Vad vill du äta?</h2>
        <div className="choice-list">
          {MENU.map((d) => (
            <button
              key={d.id}
              type="button"
              className="choice"
              onClick={() => {
                setDishId(d.id);
                setTime(d.times[0]!);
              }}
            >
              <span>
                <strong>{d.name}</strong>
                <small>{d.note}</small>
              </span>
              <b>{kr(d.price)}</b>
            </button>
          ))}
        </div>
        <MealList booking={active} onCancel={() => setMessage(null)} />
      </div>
    );
  }

  const selectedTime = dish.times.includes(time) ? time : dish.times[0]!;
  const price = dish.price * portions + (place === "Till rummet" ? ROOM_SERVICE_FEE : 0);

  return (
    <div className="panel-content">
      <BackButton
        onClick={() => {
          setDishId(null);
          setMessage(null);
        }}
      />
      <p className="panel-kicker">MAT · STEG 2 AV 2</p>
      <h2>{dish.name}</h2>
      <DayPicker
        days={days}
        value={selectedDay}
        onChange={(d) => {
          setDay(d);
          setMessage(null);
        }}
      />
      <div className="time-grid">
        {dish.times.map((t) => (
          <button
            key={t}
            type="button"
            className={cn(selectedTime === t && "selected")}
            aria-pressed={selectedTime === t}
            onClick={() => {
              setTime(t);
              setMessage(null);
            }}
          >
            <strong>{t}</strong>
          </button>
        ))}
      </div>
      <div className="chip-row" role="radiogroup" aria-label="Var vill du äta?">
        <span>Var?</span>
        {(["Matsalen", "Till rummet"] as const).map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={place === p}
            className={cn("chip", place === p && "selected")}
            onClick={() => setPlace(p)}
          >
            {p}
            {p === "Till rummet" && ` (+${ROOM_SERVICE_FEE} kr)`}
          </button>
        ))}
      </div>
      <Stepper
        label="Antal portioner"
        value={portions}
        min={1}
        max={MAX_PORTIONS}
        onChange={setPortions}
      />
      <Button
        onClick={() => {
          const result = orderMeal(getHotel(), active.code, {
            date: selectedDay,
            time: selectedTime,
            dishId: dish.id,
            portions,
            place,
          });
          if (!result.ok) return setMessage({ ok: false, text: result.error });
          saveHotel(result.state);
          setMessage({
            ok: true,
            text: `Klart! ${portions} × ${dish.name} ${formatDate(selectedDay)} klockan ${selectedTime}, ${place === "Matsalen" ? "i matsalen" : "till rum " + active.roomNumber}.`,
          });
        }}
      >
        <Check className="size-4" /> Beställ · {kr(price)}
      </Button>
      <Message message={message} />
      <MealList booking={active} onCancel={() => setMessage(null)} />
    </div>
  );
}

function MealList({ booking, onCancel }: { booking: Booking; onCancel: () => void }) {
  if (!booking.meals.length) return null;
  return (
    <ul className="sauna-list" aria-label="Din beställda mat">
      {booking.meals.map((m) => (
        <li key={m.id}>
          <span>
            {formatDate(m.date)} {m.time} · {m.portions} × {m.dish} · {m.place.toLowerCase()}
          </span>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              saveHotel(cancelMeal(getHotel(), booking.code, m.id));
              onCancel();
            }}
          >
            Avboka
          </button>
        </li>
      ))}
    </ul>
  );
}
