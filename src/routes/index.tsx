import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BedDouble,
  Cat,
  Check,
  ChevronLeft,
  House,
  KeyRound,
  LockKeyhole,
  LogIn,
  LogOut,
  Wrench,
  ShieldCheck,
  Star,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

import receptionImage from "@/assets/hjortronet-reception.jpg";
import { Button } from "@/components/ui/button";
import { FelanmalanSection } from "@/components/FelanmalanSection";
import { HereMap } from "@/components/HereMap";
import { ReviewsPanel } from "@/components/hotel/ReviewsPanel";
import { WaiterKjell } from "@/components/WaiterKjell";
import { AboutPanel, AuroraPanel, BookingPanel, FoodPanel, LoginPanel, PortalMenu, SaunaPanel, StayPanel, TaxiPanel } from "@/components/hotel/HotelPanels";
import { GUEST_ONLY, type HotelPanel, type NavTarget } from "@/lib/navigation";
import { findBooking, hasActiveStay } from "@/lib/hotel";
import { getHotel, guestSignOut, useHotel } from "@/lib/hotel-store";
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

type Panel = "welcome" | HotelPanel | "security";

function Reception() {
  const [panel, setPanel] = useState<Panel>("welcome");
  const [loginNext, setLoginNext] = useState<NavTarget | undefined>(undefined);
  const { active } = useHotel();
  const stay = hasActiveStay(active) ? active : undefined;

  // All navigering går hit. Gästfunktioner kräver inloggning med en bokning; annars visas inloggningen
  // och gästen skickas vidare dit hen var på väg efteråt.
  function go(target: NavTarget) {
    const current = getHotel();
    const booking = findBooking(current, current.activeCode);
    const allowed = target === "stay" ? Boolean(booking) : hasActiveStay(booking);
    if (GUEST_ONLY.includes(target) && !allowed) return requireLogin(target);
    if (target === "login") setLoginNext(undefined);
    if (target === "report") {
      setPanel("welcome");
      scrollToDrift();
      return;
    }
    setPanel(target);
  }

  function requireLogin(next: NavTarget) {
    setLoginNext(next);
    setPanel("login");
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  function signOut() {
    guestSignOut();
    setPanel("welcome");
  }

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
        <div className="status-pill"><span className="status-dot" /> {stay?.status === "checked-in" ? `Incheckad · rum ${stay.roomNumber}` : stay ? `Bokad · rum ${stay.roomNumber}` : active ? "Utcheckad" : "Hildur är vaken"}</div>
        {active && <Button variant="glass" size="sm" onClick={signOut}><LogOut className="size-4" /> Logga ut</Button>}
        <Button variant="glass" size="sm" onClick={() => setPanel("security")}><ShieldCheck className="size-4" /> Trygghet</Button>
      </header>

      {/* Tre zoner på desktop: Kjell till vänster, bokningen i mitten, fri utsikt till höger. På mobil en kolumn i DOM-ordning. */}
      <div className="scene-layout">
      <section className="hildur-panel" aria-live="polite">
        <div className="hildur-heading">
          <div className="hildur-avatar">H<span className="avatar-dot" /></div>
          <div><p>HILDUR 4.0</p><span>Digital receptionist · ovanligt pålitlig</span></div>
        </div>
        {panel === "welcome" ? (
          <>
            <p className="panel-kicker">KJELL HÄLSAR</p>
            <h1 lang="en">Meawcome Home!</h1>
            <p className="hildur-copy">{stay ? `Välkommen hem, ${stay.guestName.split(" ")[0]}! Rum ${stay.roomNumber} ${stay.status === "checked-in" ? "är ditt." : "väntar på dig."} Tryck på det du vill göra.` : active ? `Tack för besöket, ${active.guestName.split(" ")[0]}! Berätta gärna vad du tyckte.` : "Välkommen! Jag heter Kjell och är hotellets katt. Har du bokat? Logga in med din bokningskod."}</p>
            <PortalMenu booking={active} onNavigate={go} />
            <p className="microcopy">Hildur svarar utan rim. Kjell svarar med mjau.</p>
          </>
        ) : (
          <PanelContent key={panel} panel={panel} loginNext={loginNext} onBack={() => setPanel("welcome")} onNavigate={go} onLogin={() => requireLogin("reviews")} />
        )}
      </section>

      <aside className="scene-kjell" aria-label="Kjell, hotellets katt">
        <WaiterKjell />
      </aside>

      <HereMap />
      </div>

      <nav className="scene-nav" aria-label="Receptionens tjänster">
        <button className={cn(panel === "welcome" && "active")} onClick={() => setPanel("welcome")}><House className="size-4" /><span>Start</span></button>
        {active ? (
          <button className={cn(panel === "stay" && "active")} onClick={() => go("stay")}><KeyRound className="size-4" /><span>Mitt rum</span></button>
        ) : (
          <button className={cn(panel === "book" && "active")} onClick={() => go("book")}><BedDouble className="size-4" /><span>Boka rum</span></button>
        )}
        {stay ? (
          <button onClick={() => go("report")}><Wrench className="size-4" /><span>Drift</span></button>
        ) : !active ? (
          <button className={cn(panel === "login" && "active")} onClick={() => go("login")}><LogIn className="size-4" /><span>Logga in</span></button>
        ) : null}
        <button className={cn(panel === "reviews" && "active")} onClick={() => go("reviews")}><Star className="size-4" /><span>Omdömen</span></button>
        <button className={cn((panel === "about" || panel === "cloud") && "active")} onClick={() => go("about")}><Cat className="size-4" /><span>Om hotellet</span></button>
      </nav>
    </div>
    <FelanmalanSection onLogin={() => requireLogin("report")} />
    <footer className="site-footer">
      <span>Hotell Hjortronet · Hemavan</span>
      <Link to="/reception">Personalingång</Link>
    </footer>
    </main>
  );
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Felanmälan ligger under scenen. Fokus flyttas dit så att tangentbord och skärmläsare följer med.
function scrollToDrift() {
  const section = document.getElementById("drift");
  if (!section) return;
  section.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  section.focus({ preventScroll: true });
}

function PanelContent({ panel, loginNext, onBack, onNavigate, onLogin }: { panel: Exclude<Panel, "welcome">; loginNext: NavTarget | undefined; onBack: () => void; onNavigate: (target: NavTarget) => void; onLogin: () => void }) {
  if (panel === "login") return <LoginPanel onBack={onBack} onNavigate={onNavigate} next={loginNext} />;
  if (panel === "about") return <AboutPanel onBack={onBack} onNavigate={onNavigate} />;
  if (panel === "book") return <BookingPanel onBack={onBack} onNavigate={onNavigate} />;
  if (panel === "stay") return <StayPanel onBack={onBack} onNavigate={onNavigate} />;
  if (panel === "sauna") return <SaunaPanel onBack={onBack} onNavigate={onNavigate} />;
  if (panel === "aurora") return <AuroraPanel onBack={onBack} onNavigate={onNavigate} />;
  if (panel === "taxi") return <TaxiPanel onBack={onBack} onNavigate={onNavigate} />;
  if (panel === "food") return <FoodPanel onBack={onBack} onNavigate={onNavigate} />;
  if (panel === "reviews") return <ReviewsPanel onBack={onBack} onLogin={onLogin} />;
  if (panel === "security") return <div className="panel-content"><button className="back-button" onClick={onBack}><X className="size-4" /> Stäng</button><p className="panel-kicker">HILDURS TRYGGHETSLÖFTE</p><h2>Dina uppgifter är dina.</h2><ul className="promise-list"><li><LockKeyhole /> Bara det vistelsen behöver sparas.</li><li><Check /> Du godkänner innan något bokas.</li><li><ShieldCheck /> Personal och admin har skilda nycklar.</li><li><X /> Lösenord läses aldrig upp i matsalen.</li></ul><p className="panel-note">Senaste säkerhetskontroll: 08.42 · Kjell saknar behörighet.</p></div>;
  return <div className="panel-content"><button className="back-button" onClick={onBack}><ChevronLeft className="size-4" /> Tillbaka</button><p className="panel-kicker">FLYTTEN UR BASTUN</p><h2>Hildur bor tryggt i molnet.</h2><div className="cloud-map"><span>Gäst</span><b>→</b><span className="cloud-node">Hildur 4.0<small>Moln + backup</small></span><b>→</b><span>Hotellet</span></div><div className="outage"><Zap /><div><strong>Om strömmen går</strong><p>Gästernas mobiler fungerar vidare. Receptionen har dagens reservlista och allt synkas när elen återvänder.</p></div></div><p className="panel-note">Backup klar 03.00 · 0 bokningar förlorade · Raspberry Pi:n har pensionerats.</p></div>;
}