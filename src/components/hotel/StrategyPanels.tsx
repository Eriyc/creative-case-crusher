import {
  BatteryCharging,
  Check,
  ChevronLeft,
  Cloud,
  CloudOff,
  DatabaseBackup,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";

// Hildurs säkerhetsstrategi (trygghetslöftet) och molnstrategi (flytten ur bastun).
// Texterna beskriver det prototypen faktiskt gör, och säger ärligt vad som krävs i skarp drift.

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="strategy-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

// --- Säkerhet: trygghetslöftet och Hildurs tre värsta missar ---

const promises = [
  {
    icon: LockKeyhole,
    title: "Bara det vistelsen behöver",
    text: "Namn, datum och rum. Inga personnummer, e-postadresser eller kortnummer — Hildur säger nej om någon försöker.",
  },
  {
    icon: KeyRound,
    title: "Din bokning är din nyckel",
    text: "Bastu, mat, taxi och felanmälan kräver bokningskod och namn. Fem fel försök ger en minuts paus.",
  },
  {
    icon: EyeOff,
    title: "Hemligheter visas bara för dig",
    text: "Dörrkod och Wi-Fi är personliga, dolda tills du trycker på Visa, och slutar gälla när du checkar ut.",
  },
  {
    icon: UserCheck,
    title: "Rätt person, rätt behörighet",
    text: "Personalen loggar in med egna konton. Bara admin ser receptionsvyn. Kjell har ingen behörighet alls.",
  },
  {
    icon: Check,
    title: "Du bestämmer",
    text: "Inget bokas utan att du bekräftar. Norrskenslarmet går bara till din telefon, och du kan logga ut när du vill.",
  },
];

const mistakes = [
  {
    was: "Wi-Fi-lösenordet ”kanelbulle” lästes upp i matsalens högtalare.",
    now: "Varje gäst får en egen kod som bara visas i appen och slutar gälla vid utcheckning. Hemligheter läses aldrig upp.",
  },
  {
    was: "Katten var admin — och hann ändra priserna.",
    now: "Behörighet efter roll: personal har egna konton, bara admin når receptionen, och inga delade konton finns. Kjell nekas.",
  },
  {
    was: "Hildur uppdaterade sig själv, utan kontroll och utan backup.",
    now: "Inga uppdateringar utan test och godkännande. Varje version kan rullas tillbaka, och allt säkerhetskopieras varje natt.",
  },
];

export function SecurityPanel({ onBack }: { onBack: () => void }) {
  return (
    <div className="panel-content">
      <button className="back-button" type="button" onClick={onBack}>
        <X className="size-4" /> Stäng
      </button>
      <p className="panel-kicker">HILDURS TRYGGHETSLÖFTE</p>
      <h2>Dina uppgifter är dina.</h2>

      <ul className="strategy-promises">
        {promises.map(({ icon: Icon, title, text }) => (
          <li key={title}>
            <Icon aria-hidden="true" />
            <div>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
          </li>
        ))}
      </ul>

      <Section title="Hildurs tre värsta missar — och vad vi gjort åt dem">
        <ol className="strategy-mistakes">
          {mistakes.map((m, i) => (
            <li key={m.was}>
              <span className="strategy-number" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <p className="was">
                  <X aria-hidden="true" /> <span className="sr-only">Då: </span>
                  {m.was}
                </p>
                <p className="now">
                  <ShieldCheck aria-hidden="true" /> <span className="sr-only">Nu: </span>
                  {m.now}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Ärligt om prototypen">
        <p className="strategy-text">
          I prototypen sparas allt i din webbläsare och spärrarna sitter i appen. I skarp drift
          flyttar inloggning och behörighet till servern, all trafik krypteras och gästdata raderas
          30 dagar efter utcheckning.
        </p>
      </Section>
      <p className="panel-note">Senaste säkerhetskontroll: 08.42 · Kjell saknar behörighet.</p>
    </div>
  );
}

// --- Moln: flytten ur bastun, backup och strömavbrott ---

const outageSteps = [
  {
    icon: Smartphone,
    text: "Gästerna märker inget i appen. Hildur bor i molnet och mobilen går på 4G.",
  },
  {
    icon: BatteryCharging,
    text: "Receptionen har en surfplatta och en 4G-router på reservbatteri som räcker minst fyra timmar.",
  },
  {
    icon: DatabaseBackup,
    text: "Dagens lista med ankomster, rum och felanmälningar laddas ner och skrivs ut varje morgon kl. 06.",
  },
  {
    icon: KeyRound,
    text: "Dörrlåsen går på batteri. Huvudnyckeln ligger i kassaskåpet bakom disken.",
  },
  {
    icon: Check,
    text: "När elen är tillbaka synkas allt som gjorts på papper in i Hildur igen.",
  },
];

export function CloudPanel({ onBack }: { onBack: () => void }) {
  return (
    <div className="panel-content">
      <button className="back-button" type="button" onClick={onBack}>
        <ChevronLeft className="size-4" /> Tillbaka
      </button>
      <p className="panel-kicker">FLYTTEN UR BASTUN</p>
      <h2>Hildur bor nu i molnet.</h2>
      <p className="hildur-copy">
        Förr bodde Hildur på en Raspberry Pi bakom bastuaggregatet. Varm, ensam och utan backup. Nu
        bor hon i en datahall i Sverige.
      </p>

      <div className="cloud-map">
        <span>Gäst</span>
        <b>→</b>
        <span className="cloud-node">
          Hildur 4.0<small>Moln i Sverige + backup</small>
        </span>
        <b>→</b>
        <span>Hotellet</span>
      </div>

      <Section title="Var bor Hildur?">
        <ul className="strategy-facts">
          <li>
            <Cloud aria-hidden="true" /> Hos en molnleverantör med datahallar i Sverige och EU, så
            gästdata stannar inom EU enligt GDPR.
          </li>
          <li>
            <Zap aria-hidden="true" /> Appen och bokningarna drivs i molnet, inte på hotellet. Ett
            strömavbrott i Hemavan stänger inte av Hildur.
          </li>
        </ul>
      </Section>

      <Section title="Backup">
        <dl className="strategy-numbers">
          <div>
            <dt>Säkerhetskopia</dt>
            <dd>Varje natt kl. 03 + löpande logg</dd>
          </div>
          <div>
            <dt>Kopian finns</dt>
            <dd>I en annan datahall i EU</dd>
          </div>
          <div>
            <dt>Mest som kan försvinna</dt>
            <dd>5 minuters ändringar</dd>
          </div>
          <div>
            <dt>Tillbaka igen</dt>
            <dd>Inom 1 timme</dd>
          </div>
          <div>
            <dt>Återställning testas</dt>
            <dd>En gång i månaden</dd>
          </div>
        </dl>
      </Section>

      <Section title="Om strömmen går på hotellet">
        <ol className="strategy-steps">
          {outageSteps.map(({ icon: Icon, text }) => (
            <li key={text}>
              <Icon aria-hidden="true" />
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Om molnet krånglar">
        <p className="strategy-text strategy-with-icon">
          <CloudOff aria-hidden="true" />
          <span>
            Appen visar en enkel reservsida med receptionens nummer. Receptionen jobbar från
            morgonens utskrift tills Hildur är tillbaka — och hon återställs från backupen.
          </span>
        </p>
      </Section>

      <p className="panel-note">
        Backup klar 03.00 · 0 bokningar förlorade · Raspberry Pi:n har pensionerats. Kjell sover
        numera på den.
      </p>
    </div>
  );
}
