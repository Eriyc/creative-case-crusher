import { Check, ChevronLeft, Lock, LogIn, Star } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { formatDate, todayIso } from "@/lib/hotel";
import { getHotel, saveHotel, useHotel } from "@/lib/hotel-store";
import {
  addReview,
  allReviews,
  hasReviewed,
  MAX_COMMENT,
  RATING_LABELS,
  reviewSummary,
} from "@/lib/reviews";
import { cn } from "@/lib/utils";

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  return (
    <span className={cn("stars", size)} role="img" aria-label={`${rating} av 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden="true" className={cn(n <= Math.round(rating) && "filled")} />
      ))}
    </span>
  );
}

// onLogin skickar gästen till inloggningen och sedan tillbaka hit.
export function ReviewsPanel({ onBack, onLogin }: { onBack: () => void; onLogin: () => void }) {
  const ids = useId();
  const { state, active } = useHotel();
  const [rating, setRating] = useState(0);
  const [name, setName] = useState(active ? (active.guestName.split(" ")[0] ?? "") : "");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const reviews = allReviews(state);
  const summary = reviewSummary(reviews);

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = addReview(
      getHotel(),
      {
        rating,
        name,
        comment,
        bookingCode: active?.code ?? "",
        ...(active ? { room: active.roomNumber } : {}),
      },
      todayIso(),
    );
    if (!result.ok) return setError(result.error);
    saveHotel(result.state);
    setSent(true);
  }

  return (
    <div className="panel-content">
      <button className="back-button" type="button" onClick={onBack}>
        <ChevronLeft className="size-4" /> Tillbaka
      </button>
      <p className="panel-kicker">OMDÖMEN</p>
      <h2>Vad tyckte gästerna?</h2>

      <div className="review-summary">
        <strong>
          {summary.average.toLocaleString("sv-SE", {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1,
          })}
        </strong>
        <div>
          <Stars rating={summary.average} size="lg" />
          <small>Snitt av {summary.count} omdömen</small>
        </div>
      </div>
      <ul className="review-bars" aria-label="Fördelning av betyg">
        {[5, 4, 3, 2, 1].map((n) => (
          <li key={n}>
            <span>{n}</span>
            <Star aria-hidden="true" className="filled" />
            <div aria-hidden="true">
              <i
                style={{
                  width: `${summary.count ? (summary.counts[n - 1]! / summary.count) * 100 : 0}%`,
                }}
              />
            </div>
            <b>{summary.counts[n - 1]}</b>
            <span className="sr-only">{`${summary.counts[n - 1]} gäster gav ${n}`}</span>
          </li>
        ))}
      </ul>

      <section className="review-form" aria-labelledby={`${ids}-rate`}>
        {!active ? (
          <div className="review-locked">
            <h3 id={`${ids}-rate`}>
              <Lock aria-hidden="true" /> Har du bott hos oss?
            </h3>
            <p>
              Logga in med din bokning för att betygsätta besöket. Så vet alla att omdömena kommer
              från riktiga gäster.
            </p>
            <Button onClick={onLogin}>
              <LogIn aria-hidden="true" /> Logga in och betygsätt
            </Button>
          </div>
        ) : sent || hasReviewed(state, active.code) ? (
          <div className="inline-success" role="status">
            <Check className="size-4" aria-hidden="true" /> Tack för ditt omdöme! Kjell spinner av
            glädje.
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h3 id={`${ids}-rate`}>Hur var ditt besök?</h3>
            <div className="rating-picker" role="radiogroup" aria-labelledby={`${ids}-rate`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} – ${RATING_LABELS[n - 1]}`}
                  className={cn(n <= rating && "filled", rating === n && "selected")}
                  onClick={() => {
                    setRating(n);
                    setError("");
                  }}
                >
                  <Star aria-hidden="true" />
                  <span>{n}</span>
                </button>
              ))}
            </div>
            <p className="rating-scale" aria-hidden="true">
              <span>1 = Inte nöjd</span>
              <span>5 = Väldigt nöjd</span>
            </p>
            <p className="rating-choice" aria-live="polite">
              {rating ? `Du valde ${rating}: ${RATING_LABELS[rating - 1]}` : "Tryck på en stjärna."}
            </p>
            {rating > 0 && (
              <>
                <label className="field">
                  <span>Vad tyckte du? (valfritt)</span>
                  <textarea
                    value={comment}
                    rows={3}
                    maxLength={MAX_COMMENT}
                    placeholder="Det bästa var …"
                    onChange={(e) => {
                      setComment(e.target.value);
                      setError("");
                    }}
                  />
                </label>
                <label className="field">
                  <span>Ditt förnamn (valfritt)</span>
                  <input
                    value={name}
                    maxLength={40}
                    autoComplete="off"
                    placeholder="Annars står det Anonym gäst"
                    onChange={(e) => {
                      setName(e.target.value);
                      setError("");
                    }}
                  />
                </label>
              </>
            )}
            {error && (
              <p className="inline-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="review-submit" disabled={!rating}>
              <Star aria-hidden="true" /> Skicka betyg
            </Button>
          </form>
        )}
      </section>

      <ul className="review-list" aria-label="Omdömen från tidigare gäster">
        {reviews.map((r) => (
          <li key={r.id}>
            <div>
              <Stars rating={r.rating} />
              <small>{formatDate(r.date)}</small>
            </div>
            {r.comment && <p>”{r.comment}”</p>}
            <strong>— {r.name}</strong>
          </li>
        ))}
      </ul>
      <p className="panel-note">Omdömena är påhittade, precis som gästerna i prototypen.</p>
    </div>
  );
}
