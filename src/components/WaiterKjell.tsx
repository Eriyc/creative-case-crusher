import { useEffect, useRef, useState, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

// Kattpoäng är påhittade: de sparas bara i webbläsaren och kan aldrig köpas för riktiga pengar.
const STORAGE_KEY = "hjortronet-kjell";
const POINTS_PER_HOUR = 10;
const HOUR = 60 * 60 * 1000;

const foods = [
  {
    id: "roding",
    emoji: "🐟",
    name: "Fjällrödingscrunch",
    note: "Fångad av Kjell i en dröm",
    cost: 2,
    fill: 15,
  },
  {
    id: "ren",
    emoji: "🥩",
    name: "Renskavsbitar à la Hildur",
    note: "Utan rim, med sky",
    cost: 4,
    fill: 30,
  },
  {
    id: "hjortron",
    emoji: "🍮",
    name: "Hjortrongrädde för katter",
    note: "Husets specialitet",
    cost: 6,
    fill: 45,
  },
];

const petLines = [
  "Prrr. Två koppar, noll adminrättigheter.",
  "Jag har omplacerats. Från admin till servering.",
  "Priserna är återställda. Jag lovar. Mjau.",
  "Mjölken är min. Men du får låna lite.",
  "Klappa gärna. Det är det enda jag har behörighet till.",
];

type Saved = {
  points: number;
  petLog: number[];
  fullness: number;
  fullnessAt: number;
  sound: boolean;
};
type Heart = { id: number; x: number; delay: number };

const initial: Saved = { points: 0, petLog: [], fullness: 40, fullnessAt: 0, sound: false };

// Kjell blir hungrig igen med en procentenhet i minuten.
function currentFullness(s: Saved, now: number) {
  if (!s.fullnessAt) return s.fullness;
  return Math.max(0, Math.round(s.fullness - (now - s.fullnessAt) / 60000));
}

function minutesUntilNextPoint(recentPets: number[], now: number) {
  const oldest = recentPets[0];
  if (recentPets.length < POINTS_PER_HOUR || oldest === undefined) return 0;
  return Math.max(1, Math.ceil((oldest + HOUR - now) / 60000));
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Ett mjukt spinn: brunt brus genom ett bandpassfilter, pulserat i ungefär 24 Hz.
function playPurr(ctx: AudioContext) {
  const length = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  const t = ctx.currentTime;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 160;
  filter.Q.value = 0.8;
  const pulse = ctx.createGain();
  pulse.gain.value = 0.5;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 24;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0.5;
  const volume = ctx.createGain();
  volume.gain.setValueAtTime(0, t);
  volume.gain.linearRampToValueAtTime(0.35, t + 0.25);
  volume.gain.setValueAtTime(0.35, t + 1.3);
  volume.gain.linearRampToValueAtTime(0, t + 1.9);
  lfo.connect(lfoDepth).connect(pulse.gain);
  noise.connect(filter).connect(pulse).connect(volume).connect(ctx.destination);
  noise.start(t);
  lfo.start(t);
  noise.stop(t + 2);
  lfo.stop(t + 2);
}

export function WaiterKjell() {
  const [saved, setSaved] = useState<Saved>(initial);
  const [now, setNow] = useState(() => Date.now());
  const [mood, setMood] = useState<"idle" | "petted" | "eating">("idle");
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [line, setLine] = useState("Kaffe till välkomsten? Klappa mig gärna.");
  const [shopOpen, setShopOpen] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const moodTimer = useRef<number | undefined>(undefined);
  const heartId = useRef(0);
  const loaded = useRef(false);

  // Läs sparat läge först efter montering så att servern och klienten renderar samma sak.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSaved({ ...initial, ...JSON.parse(raw) });
    } catch {
      // Trasigt sparläge: börja om med en hungrig men glad katt.
    }
    loaded.current = true;
    const tick = window.setInterval(() => setNow(Date.now()), 30000);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(moodTimer.current);
      audio.current?.close();
    };
  }, []);

  useEffect(() => {
    if (loaded.current) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [saved]);

  const fullness = currentFullness(saved, now);
  const recentPets = saved.petLog.filter((t) => now - t < HOUR);
  const nextPointIn = minutesUntilNextPoint(recentPets, now);

  function purr() {
    if (!saved.sound) return;
    audio.current ??= new AudioContext();
    void audio.current.resume().then(() => audio.current && playPurr(audio.current));
  }

  function showMood(next: "petted" | "eating", ms: number) {
    window.clearTimeout(moodTimer.current);
    setMood(next);
    moodTimer.current = window.setTimeout(() => setMood("idle"), ms);
  }

  function pet() {
    const t = Date.now();
    setNow(t);
    const log = saved.petLog.filter((p) => t - p < HOUR);
    const earns = log.length < POINTS_PER_HOUR;
    setSaved({
      ...saved,
      points: saved.points + (earns ? 1 : 0),
      petLog: earns ? [...log, t] : log,
    });
    setLine(
      earns
        ? `${petLines[saved.points % petLines.length]} +1 kattpoäng`
        : `Prrr. Max ${POINTS_PER_HOUR} kattpoäng i timmen — nästa om ${minutesUntilNextPoint(log, t)} min.`,
    );
    showMood("petted", 900);
    purr();
    const burst = prefersReducedMotion() ? 1 : 3;
    const fresh = Array.from({ length: burst }, (_, i) => ({
      id: ++heartId.current,
      x: burst === 1 ? 0 : (i - 1) * 1.6 + (Math.random() - 0.5),
      delay: i * 0.12,
    }));
    setHearts((h) => [...h, ...fresh]);
    window.setTimeout(() => setHearts((h) => h.filter((x) => !fresh.includes(x))), 1600);
  }

  function feed(food: (typeof foods)[number]) {
    const t = Date.now();
    setNow(t);
    const current = currentFullness(saved, t);
    if (current >= 100)
      return setLine(
        "Proppmätt. Jag tar en tupplur bakom bastuaggregatet. Nej förresten, där bor ingen längre.",
      );
    if (saved.points < food.cost)
      return setLine(`${food.name} kostar ${food.cost} kattpoäng. Klappa mig lite till först.`);
    setSaved({
      ...saved,
      points: saved.points - food.cost,
      fullness: Math.min(100, current + food.fill),
      fullnessAt: t,
    });
    setLine(`Mums! ${food.name}. Tack, kära gäst.`);
    showMood("eating", 2200);
    purr();
  }

  function toggleSound() {
    const sound = !saved.sound;
    setSaved({ ...saved, sound });
    if (sound) {
      audio.current ??= new AudioContext();
      void audio.current.resume().then(() => audio.current && playPurr(audio.current));
    } else {
      void audio.current?.suspend();
    }
  }

  const happy = mood !== "idle";

  return (
    <div className="waiter-kjell">
      <p className="waiter-bubble" aria-live="polite">
        {line}
      </p>

      <button
        className={cn(
          "waiter-pet",
          mood === "petted" && "is-petted",
          mood === "eating" && "is-eating",
        )}
        type="button"
        aria-label="Klappa Kjell"
        aria-describedby="kjell-alt"
        onClick={pet}
      >
        <svg className="waiter-svg" viewBox="0 0 220 280" role="img" aria-labelledby="kjell-alt">
          <title id="kjell-alt">
            Kjell, hotellets rödvita katt, klädd som servitör i väst och fluga. Han har en vit
            handduk över armen, ena tassen bakom ryggen och bär en bricka med två ångande
            kaffekoppar.
          </title>
          <g className="kjell-figure">
            <g className="kjell-tail">
              <path
                className="kjell-limb-outline"
                d="M88 230 C54 236 34 214 38 186 C40 170 30 158 22 164"
              />
              <path
                className="kjell-limb"
                d="M88 230 C54 236 34 214 38 186 C40 170 30 158 22 164"
              />
            </g>
            <path className="kjell-limb-outline" d="M78 170 Q64 196 88 212" />
            <path className="kjell-limb" d="M78 170 Q64 196 88 212" />
            <rect className="kjell-fur" x="86" y="230" width="16" height="28" rx="8" />
            <rect className="kjell-fur" x="112" y="230" width="16" height="28" rx="8" />
            <ellipse className="kjell-white" cx="93" cy="260" rx="14" ry="8" />
            <ellipse className="kjell-white" cx="121" cy="260" rx="14" ry="8" />
            <path
              className="kjell-fur"
              d="M107 150 C76 150 68 180 70 206 C72 232 86 244 107 244 C128 244 142 232 144 206 C146 180 138 150 107 150 Z"
            />
            <path className="kjell-shirt" d="M90 156 L124 156 L128 238 L86 238 Z" />
            <path
              className="kjell-vest"
              d="M84 158 L107 200 L107 240 C94 240 82 234 76 222 C72 200 74 172 84 158 Z"
            />
            <path
              className="kjell-vest"
              d="M130 158 L107 200 L107 240 C120 240 132 234 138 222 C142 200 140 172 130 158 Z"
            />
            <circle className="kjell-button" cx="107" cy="212" r="2.6" />
            <circle className="kjell-button" cx="107" cy="226" r="2.6" />
            <path
              className="kjell-bowtie"
              d="M107 157 L91 149 L91 167 Z M107 157 L123 149 L123 167 Z"
            />
            <circle className="kjell-bowtie" cx="107" cy="157" r="4" />

            <g className="kjell-head">
              <path className="kjell-fur" d="M72 92 L76 56 L98 76 Z" />
              <path className="kjell-fur" d="M142 92 L138 56 L116 76 Z" />
              <path className="kjell-ear" d="M79 84 L80 66 L93 78 Z" />
              <path className="kjell-ear" d="M135 84 L134 66 L121 78 Z" />
              <ellipse className="kjell-fur" cx="107" cy="108" rx="44" ry="40" />
              <path className="kjell-stripe" d="M98 74 L100 86 M107 71 L107 85 M116 74 L114 86" />
              <path
                className="kjell-white"
                d="M107 104 C92 104 80 114 82 126 C84 138 96 144 107 144 C118 144 130 138 132 126 C134 114 122 104 107 104 Z"
              />
              {happy ? (
                <path
                  className="kjell-line kjell-happy-eyes"
                  d="M84 106 Q91 96 98 106 M116 106 Q123 96 130 106"
                />
              ) : (
                <g className="kjell-eyes">
                  <ellipse className="kjell-eye" cx="91" cy="104" rx="6" ry="7.5" />
                  <ellipse className="kjell-eye" cx="123" cy="104" rx="6" ry="7.5" />
                  <circle className="kjell-glint" cx="93" cy="101" r="2" />
                  <circle className="kjell-glint" cx="125" cy="101" r="2" />
                </g>
              )}
              <ellipse
                className={cn("kjell-cheek", happy && "is-blushing")}
                cx="80"
                cy="122"
                rx="6"
                ry="3.5"
              />
              <ellipse
                className={cn("kjell-cheek", happy && "is-blushing")}
                cx="134"
                cy="122"
                rx="6"
                ry="3.5"
              />
              <path className="kjell-nose" d="M102 116 L112 116 L107 122 Z" />
              {mood === "eating" ? (
                <g className="kjell-chew">
                  <path className="kjell-mouth-open" d="M99 125 Q107 138 115 125 Z" />
                  <path className="kjell-tongue" d="M103 130 Q107 135 111 130 Z" />
                </g>
              ) : (
                <path
                  className="kjell-line"
                  d="M107 122 Q107 128 101 128 M107 122 Q107 128 113 128"
                />
              )}
              <path
                className="kjell-whisker"
                d="M84 124 L60 120 M84 129 L61 131 M130 124 L154 120 M130 129 L153 131"
              />
            </g>

            <path className="kjell-limb-outline" d="M136 168 Q158 196 166 176 L172 146" />
            <path className="kjell-limb" d="M136 168 Q158 196 166 176 L172 146" />
            <path
              className="kjell-towel"
              d="M150 178 C158 184 168 180 172 172 L174 214 C168 220 160 216 156 222 C152 214 148 210 146 204 Z"
            />
            <path className="kjell-line kjell-fold" d="M160 186 L162 212 M168 182 L168 208" />
            <circle className="kjell-fur" cx="172" cy="142" r="9" />
            <ellipse className="kjell-tray" cx="174" cy="134" rx="42" ry="6" />
            <ellipse className="kjell-cup" cx="156" cy="130" rx="13" ry="3" />
            <ellipse className="kjell-cup" cx="192" cy="130" rx="13" ry="3" />
            <path
              className="kjell-cup"
              d="M146 112 L166 112 L163 128 L149 128 Z M166 116 C174 116 174 124 164 124 M182 112 L202 112 L199 128 L185 128 Z M202 116 C210 116 210 124 200 124"
            />
            <ellipse className="kjell-coffee" cx="156" cy="112.5" rx="9.5" ry="1.8" />
            <ellipse className="kjell-coffee" cx="192" cy="112.5" rx="9.5" ry="1.8" />
            <g className="kjell-steam">
              <path d="M152 104 C146 96 158 90 152 80" />
              <path d="M160 104 C154 96 166 90 160 80" />
              <path d="M188 104 C182 96 194 90 188 80" />
              <path d="M196 104 C190 96 202 90 196 80" />
            </g>
          </g>
        </svg>
        {hearts.map((h) => (
          <span
            key={h.id}
            className="kjell-heart"
            style={{ "--heart-x": `${h.x}rem`, animationDelay: `${h.delay}s` } as CSSProperties}
            aria-hidden="true"
          >
            ♥
          </span>
        ))}
      </button>

      <div className="waiter-controls">
        <span
          className="kjell-points"
          title={
            nextPointIn
              ? `Nästa poäng om ${nextPointIn} min`
              : `Upp till ${POINTS_PER_HOUR} poäng i timmen`
          }
        >
          🐾 {saved.points} <small>kattpoäng</small>
        </span>
        <button
          type="button"
          className="kjell-sound"
          aria-pressed={saved.sound}
          aria-label={saved.sound ? "Stäng av spinnljud" : "Slå på spinnljud"}
          onClick={toggleSound}
        >
          {saved.sound ? "🔊" : "🔇"} <small>Spinn {saved.sound ? "på" : "av"}</small>
        </button>
        <button
          type="button"
          className="kjell-feed"
          aria-expanded={shopOpen}
          aria-controls="kjell-shop"
          onClick={() => setShopOpen(!shopOpen)}
        >
          Mata Kjell
        </button>
      </div>

      <div
        className="kjell-meter"
        role="meter"
        aria-label="Hur mätt Kjell är"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={fullness}
        aria-valuetext={`${fullness} procent mätt`}
      >
        <span>Mätt</span>
        <div>
          <i style={{ width: `${fullness}%` }} />
        </div>
        <b>{fullness}%</b>
      </div>

      {shopOpen && (
        <section id="kjell-shop" className="kjell-shop" aria-label="Kjells kattmatsbutik">
          <header>
            <p className="panel-kicker">KJELLS SKAFFERI</p>
            <button type="button" onClick={() => setShopOpen(false)} aria-label="Stäng butiken">
              ✕
            </button>
          </header>
          <ul>
            {foods.map((food) => (
              <li key={food.id}>
                <span className="kjell-food-emoji" aria-hidden="true">
                  {food.emoji}
                </span>
                <span>
                  <strong>{food.name}</strong>
                  <small>
                    {food.note} · +{food.fill}% mätt
                  </small>
                </span>
                <button
                  type="button"
                  disabled={saved.points < food.cost || fullness >= 100}
                  onClick={() => feed(food)}
                >
                  {food.cost} 🐾
                </button>
              </li>
            ))}
          </ul>
          <p className="kjell-shop-note">
            Påhittad kattmat, påhittade poäng. Inga riktiga pengar, inga kort, ingen Kjell med
            adminbehörighet.
          </p>
        </section>
      )}
    </div>
  );
}
