import {
  BedDouble,
  Car,
  Cat,
  CircleCheck,
  Droplets,
  Phone,
  Send,
  Snowflake,
  TriangleAlert,
  Volume2,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Felanmälan sparas bara i komponentens state tills det finns en riktig backend.

type Priority = "later" | "today" | "asap";

const priorities: { value: Priority; label: string }[] = [
  { value: "later", label: "Kan vänta till i morgon" },
  { value: "today", label: "Idag" },
  { value: "asap", label: "Snarast" },
];

type Category = { id: string; name: string; icon: LucideIcon; faults: [string, Priority][] };

const categories: Category[] = [
  {
    id: "varme",
    name: "Värme & vatten",
    icon: Droplets,
    faults: [
      ["Elementet är kallt", "today"],
      ["Inget varmvatten", "asap"],
      ["Stopp i avlopp eller toalett", "today"],
      ["Läckage eller droppande kran", "asap"],
      ["Dålig ventilation eller kondens", "later"],
    ],
  },
  {
    id: "el",
    name: "El & teknik",
    icon: Wifi,
    faults: [
      ["Wifi fungerar inte", "today"],
      ["TV eller streaming krånglar", "later"],
      ["Nyckelkortet öppnar inte dörren", "asap"],
      ["Lampa eller eluttag fungerar inte", "today"],
    ],
  },
  {
    id: "bastu",
    name: "Bastu",
    icon: Zap,
    faults: [
      ["Aggregatet värmer inte", "asap"],
      ["Min bokning syns inte", "today"],
      ["Bastun är upptagen trots min bokning", "asap"],
      ["Slut på handdukar eller bastuskopa", "later"],
    ],
  },
  {
    id: "skidrum",
    name: "Skid- & torkrum",
    icon: Snowflake,
    faults: [
      ["Pjäxtorken går inte", "today"],
      ["Låsskåpet har låst sig", "asap"],
      ["Min utrustning saknas", "asap"],
    ],
  },
  {
    id: "stad",
    name: "Städ & påfyllning",
    icon: BedDouble,
    faults: [
      ["Extra handdukar", "later"],
      ["Extra filt eller kudde", "later"],
      ["Städningen blev missad", "today"],
      ["Kaffe eller te är slut", "later"],
    ],
  },
  {
    id: "parkering",
    name: "Parkering",
    icon: Car,
    faults: [
      ["Motorvärmaruttaget ger ingen ström", "asap"],
      ["Platsen behöver snöröjas", "today"],
      ["Laddstolpen fungerar inte", "today"],
    ],
  },
  {
    id: "storning",
    name: "Störning",
    icon: Volume2,
    faults: [
      ["Oväsen från grannrum", "asap"],
      ["Brandvarnaren piper (batteri)", "asap"],
      ["Konstig lukt", "asap"],
    ],
  },
  {
    id: "kjell",
    name: "Kjell",
    icon: Cat,
    faults: [
      ["Kjell har tagit sig in på rummet", "later"],
      ["Kjell sover på min skidjacka", "later"],
      ["Allergi – Kjell behöver hållas borta", "asap"],
    ],
  },
];

type Ticket = {
  id: string;
  room: string;
  fault: string;
  category: string;
  priority: Priority;
  phone: string;
  description: string;
  mayEnter: boolean;
};

const priorityLabel = (priority: Priority) => priorities.find((p) => p.value === priority)!.label;

export function FelanmalanSection() {
  const ids = useId();
  const [showPhone, setShowPhone] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [fault, setFault] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority>("today");
  const [room, setRoom] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [mayEnter, setMayEnter] = useState(true);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const category = categories.find((c) => c.id === categoryId);

  function chooseCategory(id: string) {
    setCategoryId(id);
    setFault(null);
  }

  function chooseFault(name: string, defaultPriority: Priority) {
    setFault(name);
    setPriority(defaultPriority);
  }

  function reset() {
    setCategoryId(null);
    setFault(null);
    setPriority("today");
    setRoom("");
    setPhone("");
    setDescription("");
    setMayEnter(true);
    setError("");
    setTicket(null);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!category || !fault) return;
    if (!room.trim()) return setError("Skriv ditt rumsnummer så vi vet vart vi ska gå.");
    setTicket({
      id: `HJ-${String(Date.now()).slice(-5)}`,
      room: room.trim(),
      fault,
      category: category.name,
      priority,
      phone: phone.trim(),
      description: description.trim(),
      mayEnter,
    });
  }

  return (
    <section id="drift" className="drift-section" aria-labelledby={`${ids}-title`} tabIndex={-1}>
      <div className="drift-intro">
        <h2 id={`${ids}-title`}>Något som krånglar?</h2>
        <p>
          Berätta vad som är fel så skickar jag det till rätt person. Ett element som inte värmer
          hamnar hos fastighetsskötaren, inte hos Kjell.
        </p>
        <div className="drift-warning" role="note">
          <TriangleAlert aria-hidden="true" />
          <p>
            Brand, personskada eller vatten som sprider sig? Använd inte formuläret. Ring{" "}
            <a href="tel:112">112</a> vid nödläge, annars receptionen dygnet runt.
          </p>
        </div>
        <button
          type="button"
          className="drift-link"
          aria-expanded={showPhone}
          aria-controls={`${ids}-phone`}
          onClick={() => setShowPhone(!showPhone)}
        >
          <Phone aria-hidden="true" />{" "}
          {showPhone ? "Dölj receptionens nummer" : "Visa receptionens nummer"}
        </button>
        <p id={`${ids}-phone`} className="drift-phone" hidden={!showPhone}>
          Anknytning 9 från rumstelefonen, eller <a href="tel:+46000000000">+46 00 000 00 00</a>
        </p>
      </div>

      <div className="drift-panel">
        {ticket ? (
          <div className="drift-done" role="status">
            <CircleCheck className="drift-done-icon" aria-hidden="true" />
            <h3>Felanmälan skickad</h3>
            <p>
              Ärende {ticket.id} gäller rum {ticket.room}: {ticket.fault}.
            </p>
            <p>Prioritet: {priorityLabel(ticket.priority)}</p>
            <dl className="drift-summary">
              <dt>Kategori</dt>
              <dd>{ticket.category}</dd>
              <dt>Telefon</dt>
              <dd>{ticket.phone || "Nås via rummet"}</dd>
              <dt>Beskrivning</dt>
              <dd>{ticket.description || "Ingen"}</dd>
              <dt>Får gå in</dt>
              <dd>{ticket.mayEnter ? "Ja" : "Nej, knacka först"}</dd>
            </dl>
            <Button variant="glass" onClick={reset}>
              Gör en ny felanmälan
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h3 id={`${ids}-step1`} className="drift-step">
              <span>1</span> Vad gäller det?
            </h3>
            <div className="drift-categories" role="group" aria-labelledby={`${ids}-step1`}>
              {categories.map(({ id, name, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={cn("drift-category", categoryId === id && "selected")}
                  aria-pressed={categoryId === id}
                  onClick={() => chooseCategory(id)}
                >
                  <Icon aria-hidden="true" />
                  <span>{name}</span>
                </button>
              ))}
            </div>

            {category && (
              <>
                <h3 id={`${ids}-step2`} className="drift-step">
                  <span>2</span> Vad är fel?
                </h3>
                <div className="drift-faults" role="group" aria-labelledby={`${ids}-step2`}>
                  {category.faults.map(([name, defaultPriority]) => (
                    <button
                      key={name}
                      type="button"
                      className={cn("drift-pill", fault === name && "selected")}
                      aria-pressed={fault === name}
                      onClick={() => chooseFault(name, defaultPriority)}
                    >
                      {name}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={cn(
                      "drift-pill other",
                      fault === `Annat (${category.name})` && "selected",
                    )}
                    aria-pressed={fault === `Annat (${category.name})`}
                    onClick={() => chooseFault(`Annat (${category.name})`, "today")}
                  >
                    Något annat
                  </button>
                </div>
              </>
            )}

            {category && fault && (
              <>
                <h3 className="drift-step">
                  <span>3</span> Var och hur bråttom?
                </h3>
                <label className="drift-field">
                  <span>Rumsnummer</span>
                  <input
                    value={room}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="t.ex. 214"
                    required
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${ids}-error` : undefined}
                    onChange={(e) => {
                      setRoom(e.target.value);
                      setError("");
                    }}
                  />
                </label>
                <label className="drift-field">
                  <span>
                    Telefon <small>(valfritt)</small>
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    autoComplete="tel"
                    placeholder="Om vi behöver nå dig"
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
                <label className="drift-field">
                  <span>
                    Beskriv kort <small>(valfritt)</small>
                  </span>
                  <textarea
                    value={description}
                    rows={3}
                    placeholder="När började det? Har du provat något redan?"
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </label>
                <fieldset className="drift-priority">
                  <legend>Hur bråttom är det?</legend>
                  <div>
                    {priorities.map((p) => (
                      <label key={p.value} className={cn(priority === p.value && "selected")}>
                        <input
                          type="radio"
                          name={`${ids}-priority`}
                          value={p.value}
                          checked={priority === p.value}
                          onChange={() => setPriority(p.value)}
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="drift-check">
                  <input
                    type="checkbox"
                    checked={mayEnter}
                    onChange={(e) => setMayEnter(e.target.checked)}
                  />
                  <span>Personal får gå in på rummet när jag inte är där</span>
                </label>
              </>
            )}

            <Button type="submit" className="drift-submit" disabled={!fault}>
              <Send aria-hidden="true" /> Skicka felanmälan
            </Button>
            {error && (
              <p id={`${ids}-error`} className="drift-error" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
