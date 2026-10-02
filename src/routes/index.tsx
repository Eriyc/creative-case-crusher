import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  Check,
  ChevronLeft,
  CloudSun,
  Info,
  LockKeyhole,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

import receptionImage from "@/assets/hjortronet-reception.jpg";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hildur 4.0 — Hotell Hjortronet" },
      { name: "description", content: "Möt Hildur 4.0, Hotell Hjortronets trygga digitala receptionist i Hemavan." },
      { property: "og:title", content: "Hildur 4.0 — Hotell Hjortronet" },
      { property: "og:description", content: "Boka bastu, kolla norrskenet och träffa Kjell i Hotell Hjortronets digitala reception." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reception,
});

type Panel = "welcome" | "sauna" | "aurora" | "security" | "cloud";

function Reception() {
  const [panel, setPanel] = useState<Panel>("welcome");
  const [time, setTime] = useState("19.00");
  const [guests, setGuests] = useState(2);
  const [booked, setBooked] = useState(false);
  const [catLine, setCatLine] = useState("Kjell är utloggad");

  useEffect(() => {
    const timer = window.setTimeout(() => setCatLine("Kjell är utloggad · och bevakad"), 4200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="reception-scene">
      <img className="scene-image" src={receptionImage} alt="Receptionen på Hotell Hjortronet med snöklädda fjäll utanför och Kjell på disken" width={1920} height={1088} />
      <div className="scene-shade" />

      <header className="scene-header">
        <button className="brand-mark" type="button" onClick={() => setPanel("welcome")} aria-label="Till välkomstvyn">HH</button>
        <div>
          <p className="brand-name">Hotell Hjortronet</p>
          <p className="brand-place">Hemavan · sedan 1948</p>
        </div>
        <div className="status-pill"><span className="status-dot" /> Hildur är vaken</div>
        <Button variant="glass" size="sm" onClick={() => setPanel("security")}><ShieldCheck className="size-4" /> Trygghet</Button>
      </header>

      <section className={cn("hildur-panel", panel !== "welcome" && "hildur-panel-compact")} aria-live="polite">
        <div className="hildur-heading">
          <div className="hildur-avatar">H<span className="avatar-dot" /></div>
          <div><p>HILDUR 4.0</p><span>Digital receptionist · ovanligt pålitlig</span></div>
        </div>
        {panel === "welcome" ? (
          <>
            <h1>Välkommen in<br />från fjället.</h1>
            <p className="hildur-copy">Jag är Hildur. Jag hjälper dig med vistelsen — utan rim, hittepå eller fyrtio personer i bastun.</p>
            <div className="action-row">
              <Button onClick={() => setPanel("sauna")}><Zap className="size-4" /> Boka bastu</Button>
              <Button variant="glass" onClick={() => setPanel("aurora")}><Sparkles className="size-4" /> Se norrsken</Button>
            </div>
            <p className="microcopy">Jag kan rimma om du ber snällt. Annars håller vi oss till användbar information.</p>
          </>
        ) : (
          <PanelContent panel={panel} time={time} setTime={setTime} guests={guests} setGuests={setGuests} booked={booked} setBooked={setBooked} onBack={() => { setPanel("welcome"); setBooked(false); }} />
        )}
      </section>

      <div className="scene-landmarks" aria-hidden="true">
        <button className="cat-hotspot" type="button" aria-label="Prata med Kjell" aria-hidden="false" onClick={() => setCatLine(catLine.includes("bevakad") ? "Mjau. Jag nekar till allt." : "Kjell är utloggad · och bevakad")}>
          <span className="hotspot-ring"><Info className="size-4" /></span>
          <span className="cat-label"><strong>Kjell</strong><small>{catLine}</small></span>
        </button>

        <button className="bell-hotspot" type="button" aria-label="Ring på receptionens klocka" aria-hidden="false" onClick={() => setPanel("welcome")}><Bell className="size-4" /><span>Ring på Hildur</span></button>
      </div>

      <nav className="scene-nav" aria-label="Receptionens tjänster">
        <button className={cn(panel === "sauna" && "active")} onClick={() => setPanel("sauna")}><Zap className="size-4" /><span>Bastu</span></button>
        <button className={cn(panel === "aurora" && "active")} onClick={() => setPanel("aurora")}><CloudSun className="size-4" /><span>Norrsken</span></button>
        <button className={cn(panel === "cloud" && "active")} onClick={() => setPanel("cloud")}><ShieldCheck className="size-4" /><span>Drift</span></button>
      </nav>
    </main>
  );
}

function PanelContent({ panel, time, setTime, guests, setGuests, booked, setBooked, onBack }: { panel: Exclude<Panel, "welcome">; time: string; setTime: (v: string) => void; guests: number; setGuests: (v: number) => void; booked: boolean; setBooked: (v: boolean) => void; onBack: () => void }) {
  if (panel === "sauna") return (
    <div className="panel-content">
      <button className="back-button" onClick={onBack}><ChevronLeft className="size-4" /> Tillbaka</button>
      {booked ? <div className="success-state"><span><Check className="size-6" /></span><h2>Bastun är din.</h2><p>{time}–{time === "18.00" ? "19.00" : time === "19.00" ? "20.00" : "21.00"} för {guests} {guests === 1 ? "person" : "personer"}. Kjell räknas inte.</p><Button variant="glass" onClick={onBack}>Klart</Button></div> : <>
        <p className="panel-kicker">BASTU · IKVÄLL</p><h2>Välj en varm timme.</h2>
        <div className="time-grid">{["18.00", "19.00", "20.00"].map((slot) => <button key={slot} className={cn(time === slot && "selected")} onClick={() => setTime(slot)}><strong>{slot}</strong><small>{slot === "20.00" ? "2 platser" : "ledig"}</small></button>)}</div>
        <div className="guest-stepper"><span>Antal gäster</span><div><button onClick={() => setGuests(Math.max(1, guests - 1))} aria-label="Minska antal"><Minus /></button><strong>{guests}</strong><button onClick={() => setGuests(Math.min(8, guests + 1))} aria-label="Öka antal"><Plus /></button></div></div>
        <Button onClick={() => setBooked(true)}><Check className="size-4" /> Boka {time} för {guests}</Button>
      </>}
    </div>
  );
  if (panel === "aurora") return <div className="panel-content"><button className="back-button" onClick={onBack}><ChevronLeft className="size-4" /> Tillbaka</button><p className="panel-kicker">NORRSKENSKOLLEN</p><h2>God chans i kväll.</h2><div className="aurora-score"><strong>82%</strong><span><b>22.00–23.30</b><small>Klart mot norr · KP 5</small></span></div><div className="forecast"><span className="good">22<br /><small>God chans</small></span><span className="maybe">23<br /><small>Möjligt</small></span><span className="poor">00<br /><small>Moln</small></span></div><p className="panel-note">Ta på mössan. För en gångs skull är Hildurs larm befogat.</p></div>;
  if (panel === "security") return <div className="panel-content"><button className="back-button" onClick={onBack}><X className="size-4" /> Stäng</button><p className="panel-kicker">HILDURS TRYGGHETSLÖFTE</p><h2>Dina uppgifter är dina.</h2><ul className="promise-list"><li><LockKeyhole /> Bara det vistelsen behöver sparas.</li><li><Check /> Du godkänner innan något bokas.</li><li><ShieldCheck /> Personal och admin har skilda nycklar.</li><li><X /> Lösenord läses aldrig upp i matsalen.</li></ul><p className="panel-note">Senaste säkerhetskontroll: 08.42 · Kjell saknar behörighet.</p></div>;
  return <div className="panel-content"><button className="back-button" onClick={onBack}><ChevronLeft className="size-4" /> Tillbaka</button><p className="panel-kicker">FLYTTEN UR BASTUN</p><h2>Hildur bor tryggt i molnet.</h2><div className="cloud-map"><span>Gäst</span><b>→</b><span className="cloud-node">Hildur 4.0<small>Moln + backup</small></span><b>→</b><span>Hotellet</span></div><div className="outage"><Zap /><div><strong>Om strömmen går</strong><p>Gästernas mobiler fungerar vidare. Receptionen har dagens reservlista och allt synkas när elen återvänder.</p></div></div><p className="panel-note">Backup klar 03.00 · 0 bokningar förlorade · Raspberry Pi:n har pensionerats.</p></div>;
}