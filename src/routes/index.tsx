import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BedDouble,
  Cat,
  House,
  KeyRound,
  LogIn,
  LogOut,
  Wrench,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import receptionImage from "@/assets/hjortronet-reception.jpg";
import { Button } from "@/components/ui/button";
import { FelanmalanSection } from "@/components/FelanmalanSection";
import { ReviewsPanel } from "@/components/hotel/ReviewsPanel";
import { CloudPanel, SecurityPanel } from "@/components/hotel/StrategyPanels";
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
  const cardRef = useRef<HTMLElement>(null);
  const keepScroll = useRef(true);

  // Varje ny vy börjar överst i kortet. På mobil scrollar vi upp till kortet om gästen stod längre ner.
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (keepScroll.current) {
      keepScroll.current = false;
      return;
    }
    card.scrollTop = 0;
    if (card.getBoundingClientRect().top < 0) {
      card.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
  }, [panel]);

  // Visar en tonad kant i kortets botten när det finns mer att scrolla till.
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const update = () => {
      card.toggleAttribute("data-more", card.scrollHeight - card.scrollTop - card.clientHeight > 8);
    };
    update();
    card.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(card);
    Array.from(card.children).forEach((child) => observer.observe(child));
    return () => {
      card.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [panel]);
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
      // Felanmälan ligger under scenen: låt scrollningen dit vara kvar.
      if (panel !== "welcome") keepScroll.current = true;
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
        <div className="status-pill"><span className="status-dot" /> {stay?.status === "checked-in" ? `Incheckad · rum ${stay.roomNumber}` : stay ? `Bokad · rum ${stay.roomNumber}` : active ? "Utcheckad" : "Hildur 4.0 är vaken"}</div>
        {active && <Button variant="glass" size="sm" onClick={signOut}><LogOut className="size-4" /> Logga ut</Button>}
        <Button variant="glass" size="sm" onClick={() => setPanel("security")}><ShieldCheck className="size-4" /> Trygghet</Button>
      </header>

      {/* Tre zoner på desktop: Kjell till vänster, bokningen i mitten, fri utsikt till höger. På mobil en kolumn i DOM-ordning. */}
      <div className="scene-layout">
      <section ref={cardRef} className="hildur-panel" aria-live="polite">
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
  if (panel === "security") return <SecurityPanel onBack={onBack} />;
  return <CloudPanel onBack={onBack} />;
}