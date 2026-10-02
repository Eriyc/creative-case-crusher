// Omdömen från gäster. De tidigare omdömena är påhittade, som alla gäster i prototypen.

import { validateGuestName, type HotelState, type Review } from "@/lib/hotel";

export const RATING_LABELS = ["Inte nöjd", "Mindre nöjd", "Okej", "Nöjd", "Väldigt nöjd"] as const;

export const MAX_COMMENT = 400;

export const PAST_REVIEWS: Review[] = [
  {
    id: "tidigare-1",
    rating: 5,
    name: "Elvy, 78 år",
    comment: "Stora knappar och tydlig text. Jag bokade taxi till flyget själv för första gången!",
    date: "2026-09-27",
  },
  {
    id: "tidigare-2",
    rating: 5,
    name: "Margit från Umeå",
    comment: "Kjell serverade kaffe och Hildur rimmade inte en enda gång. Äntligen.",
    date: "2026-09-21",
  },
  {
    id: "tidigare-3",
    rating: 4,
    name: "Holger från Tärnaby",
    comment: "Bastun hade plats. Åtta personer, inte fyrtio. Varmt rum och fantastisk utsikt.",
    date: "2026-09-14",
  },
  {
    id: "tidigare-4",
    rating: 5,
    name: "Familjen Ripgren",
    comment:
      "Barnen klappade Kjell hela kvällen. Han fick bara tio poäng i timmen men verkade nöjd ändå.",
    date: "2026-09-08",
  },
  {
    id: "tidigare-5",
    rating: 3,
    name: "Sixten",
    comment:
      "God renskav och skön säng. Norrskenslarmet gick — men norrskenet uteblev. Det är väl inte Hildurs fel.",
    date: "2026-08-30",
  },
  {
    id: "tidigare-6",
    rating: 2,
    name: "Anonym gäst",
    comment:
      "Fick vänta på varmvattnet en morgon. Fast felanmälan gick fort och någon kom inom en timme.",
    date: "2026-08-22",
  },
];

export function hasReviewed(state: HotelState, bookingCode: string) {
  return state.reviews.some((r) => r.bookingCode === bookingCode);
}

export function allReviews(state: HotelState) {
  return [...state.reviews, ...PAST_REVIEWS].sort((a, b) => b.date.localeCompare(a.date));
}

export function reviewSummary(reviews: Review[]) {
  const counts = [1, 2, 3, 4, 5].map((rating) => reviews.filter((r) => r.rating === rating).length);
  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  return { average, count: reviews.length, counts };
}

export type ReviewInput = {
  rating: number;
  name: string;
  comment: string;
  bookingCode: string;
  room?: number;
};

export function addReview(
  state: HotelState,
  input: ReviewInput,
  today: string,
  now = Date.now(),
): { ok: true; state: HotelState; review: Review } | { ok: false; error: string } {
  if (!input.bookingCode)
    return { ok: false, error: "Logga in med din bokning för att betygsätta." };
  if (hasReviewed(state, input.bookingCode)) {
    return { ok: false, error: "Du har redan betygsatt den här vistelsen. Tack!" };
  }
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { ok: false, error: "Välj ett betyg från 1 till 5." };
  }
  const name = input.name.trim();
  if (name) {
    const problem = validateGuestName(name);
    if (problem) return { ok: false, error: problem };
  }
  const comment = input.comment.trim();
  if (comment.length > MAX_COMMENT)
    return { ok: false, error: `Håll det kort, max ${MAX_COMMENT} tecken.` };
  if (comment.includes("@")) return { ok: false, error: "Skriv inga e-postadresser i omdömet." };

  const review: Review = {
    id: `omdome-${now}`,
    rating: input.rating,
    name: name || "Anonym gäst",
    comment,
    date: today,
    bookingCode: input.bookingCode,
    ...(input.room ? { room: input.room } : {}),
  };
  return { ok: true, review, state: { ...state, reviews: [review, ...state.reviews] } };
}
