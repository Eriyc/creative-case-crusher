import { createFileRoute } from "@tanstack/react-router";
import {
  BedDouble,
  Bell,
  Check,
  ChevronLeft,
  House,
  Info,
  KeyRound,
  LockKeyhole,
  Wrench,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

import receptionImage from "@/assets/hjortronet-reception.jpg";
import { Button } from "@/components/ui/button";
import { FelanmalanSection } from "@/components/FelanmalanSection";
import { WaiterKjell } from "@/components/WaiterKjell";
import { AuroraPanel, BookingPanel, FoodPanel, PortalMenu, SaunaPanel, StayPanel, TaxiPanel, type HotelPanel } from "@/components/hotel/HotelPanels";
import { useHotel } from "@/lib/hotel-store";
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

type Panel = "welcome" | HotelPanel | "security" | "cloud";

function Reception() {
  const [panel, setPanel] = useState<Panel>("welcome");
  const { active } = useHotel();
  const stay = active && active.status !== "checked-out" ? active : undefined;
  const [catLine, setCatLine] = useState("Kjell är utloggad");

  useEffect(() => {
    const timer = window.setTimeout(() => setCatLine("Kjell är utloggad · och bevakad"), 4200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main>
    <div className="reception-scene">
      <img className="scene-image" src={receptionImage} alt="Receptionen på Hotell Hjortronet med snöklädda fjäll utanför och Kjell på disken" width={1920} height={1088} />
      <div className="scene-shade" />

      <header className="scene-header">
        <button className="brand-mark" type="button" onClick={() => setPanel("welcome")} aria-label="Till välkomstvyn">HH</button>
        <div>
          <p className="brand-name">Hotell Hjortronet</p>
          <p className="brand-place">Hemavan · sedan 1948</p>
        </div>
        <div className="status-pill"><span className="status-dot" /> {stay?.status === "checked-in" ? `Incheckad · rum ${stay.roomNumber}` : stay ? `Bokad · rum ${stay.roomNumber}` : "Hildur är vaken"}</div>
        <Button variant="glass" size="sm" onClick={() => setPanel("security")}><ShieldCheck className="size-4" /> Trygghet</Button>
      </header>

      <section className={cn("hildur-panel", panel !== "welcome" && "hildur-panel-compact")} aria-live="polite">
        <div className="hildur-heading">
          <div className="hildur-avatar">H<span className="avatar-dot" /></div>
          <div><p>HILDUR 4.0</p><span>Digital receptionist · ovanligt pålitlig</span></div>
        </div>
        {panel === "welcome" ? (
          <>
            <p className="panel-kicker">KJELL HÄLSAR</p>
            <h1 lang="en">Meawcome Home!</h1>
            <p className="hildur-copy">{stay ? `Välkommen hem, ${stay.guestName.split(" ")[0]}! Rum ${stay.roomNumber} ${stay.status === "checked-in" ? "är ditt." : "väntar på dig."} Tryck på det du vill göra.` : "Välkommen hem! Jag heter Kjell och är hotellets katt. Tryck på det du vill göra."}</p>
            <PortalMenu stay={stay} onNavigate={setPanel} />
            <p className="microcopy">Hildur svarar utan rim. Kjell svarar med mjau.</p>
          </>
        ) : (
          <PanelContent key={panel} panel={panel} onBack={() => setPanel("welcome")} onNavigate={setPanel} />
        )}
      </section>

      <div className="scene-landmarks">
        {panel === "welcome" ? <WaiterKjell /> : <button className="cat-hotspot" type="button" aria-label="Prata med Kjell" onClick={() => setCatLine(catLine.includes("bevakad") ? "Mjau. Jag nekar till allt." : "Kjell är utloggad · och bevakad")}>
          <span className="hotspot-ring"><Info className="size-4" /></span>
          <span className="cat-label"><strong>Kjell</strong><small>{catLine}</small></span>
        </button>}

        <button className="bell-hotspot" type="button" aria-label="Ring på receptionens klocka" onClick={() => setPanel("welcome")}><Bell className="size-4" /><span>Ring på Hildur</span></button>
      </div>

      <nav className="scene-nav" aria-label="Receptionens tjänster">
        <button className={cn(panel === "welcome" && "active")} onClick={() => setPanel("welcome")}><House className="size-4" /><span>Start</span></button>
        <button className={cn((panel === "stay" || panel === "book") && "active")} onClick={() => setPanel(stay ? "stay" : "book")}><BedDouble className="size-4" /><span>{stay ? "Mitt rum" : "Boka rum"}</span></button>
        <button onClick={scrollToDrift}><Wrench className="size-4" /><span>Drift</span></button>
        <button className={cn(panel === "cloud" && "active")} onClick={() => setPanel("cloud")}><ShieldCheck className="size-4" /><span>Om Hildur</span></button>
      </nav>
    </div>
    <FelanmalanSection />
    </main>
  );
}

// Felanmälan ligger under scenen. Fokus flyttas dit så att tangentbord och skärmläsare följer med.
function scrollToDrift() {
  const section = document.getElementById("drift");
  if (!section) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  section.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  section.focus({ preventScroll: true });
}

function PanelContent({ panel, onBack, onNavigate }: { panel: Exclude<Panel, "welcome">; onBack: () => void; onNavigate: (panel: Panel) => void }) {
  if (panel === "book") return <BookingPanel onBack={onBack} onNavigate={onNavigate} />;
  if (panel === "stay") return <StayPanel onBack={onBack} onNavigate={onNavigate} />;
  if (panel === "sauna") return <SaunaPanel onBack={onBack} onNavigate={onNavigate} />;
  if (panel === "aurora") return <AuroraPanel onBack={onBack} onNavigate={onNavigate} />;
  if (panel === "taxi") return <TaxiPanel onBack={onBack} onNavigate={onNavigate} />;
  if (panel === "food") return <FoodPanel onBack={onBack} onNavigate={onNavigate} />;
  if (panel === "security") return <div className="panel-content"><button className="back-button" onClick={onBack}><X className="size-4" /> Stäng</button><p className="panel-kicker">HILDURS TRYGGHETSLÖFTE</p><h2>Dina uppgifter är dina.</h2><ul className="promise-list"><li><LockKeyhole /> Bara det vistelsen behöver sparas.</li><li><Check /> Du godkänner innan något bokas.</li><li><ShieldCheck /> Personal och admin har skilda nycklar.</li><li><X /> Lösenord läses aldrig upp i matsalen.</li></ul><p className="panel-note">Senaste säkerhetskontroll: 08.42 · Kjell saknar behörighet.</p></div>;
  return <div className="panel-content"><button className="back-button" onClick={onBack}><ChevronLeft className="size-4" /> Tillbaka</button><p className="panel-kicker">FLYTTEN UR BASTUN</p><h2>Hildur bor tryggt i molnet.</h2><div className="cloud-map"><span>Gäst</span><b>→</b><span className="cloud-node">Hildur 4.0<small>Moln + backup</small></span><b>→</b><span>Hotellet</span></div><div className="outage"><Zap /><div><strong>Om strömmen går</strong><p>Gästernas mobiler fungerar vidare. Receptionen har dagens reservlista och allt synkas när elen återvänder.</p></div></div><p className="panel-note">Backup klar 03.00 · 0 bokningar förlorade · Raspberry Pi:n har pensionerats.</p></div>;
}