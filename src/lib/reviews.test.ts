import { describe, expect, it } from "vitest";

import { emptyHotel } from "@/lib/hotel";
import { addReview, allReviews, PAST_REVIEWS, reviewSummary } from "@/lib/reviews";

describe("omdömen", () => {
  it("tar emot betyg 1–5 och lägger nya omdömen först", () => {
    const result = addReview(
      emptyHotel,
      { rating: 4, name: "", comment: "Mysigt!", bookingCode: "HJ-111111" },
      "2026-10-02",
    );
    if (!result.ok) throw new Error(result.error);
    expect(result.review.name).toBe("Anonym gäst");
    const reviews = allReviews(result.state);
    expect(reviews[0]).toBe(result.review);
    expect(reviews).toHaveLength(PAST_REVIEWS.length + 1);
  });

  it("nekar betyg utanför skalan och personuppgifter", () => {
    expect(
      addReview(
        emptyHotel,
        { rating: 0, name: "", comment: "", bookingCode: "HJ-111111" },
        "2026-10-02",
      ).ok,
    ).toBe(false);
    expect(
      addReview(
        emptyHotel,
        { rating: 6, name: "", comment: "", bookingCode: "HJ-111111" },
        "2026-10-02",
      ).ok,
    ).toBe(false);
    expect(
      addReview(
        emptyHotel,
        { rating: 3.5, name: "", comment: "", bookingCode: "HJ-111111" },
        "2026-10-02",
      ).ok,
    ).toBe(false);
    expect(
      addReview(
        emptyHotel,
        { rating: 5, name: "a@b.se", comment: "", bookingCode: "HJ-111111" },
        "2026-10-02",
      ).ok,
    ).toBe(false);
    expect(
      addReview(
        emptyHotel,
        { rating: 5, name: "", comment: "mejla a@b.se", bookingCode: "HJ-111111" },
        "2026-10-02",
      ).ok,
    ).toBe(false);
  });

  it("kräver en bokning och tillåter bara ett omdöme per vistelse", () => {
    expect(
      addReview(emptyHotel, { rating: 5, name: "", comment: "", bookingCode: "" }, "2026-10-02").ok,
    ).toBe(false);
    const first = addReview(
      emptyHotel,
      { rating: 5, name: "", comment: "", bookingCode: "HJ-222222" },
      "2026-10-02",
    );
    if (!first.ok) throw new Error(first.error);
    const again = addReview(
      first.state,
      { rating: 1, name: "", comment: "", bookingCode: "HJ-222222" },
      "2026-10-02",
    );
    expect(again.ok).toBe(false);
  });

  it("räknar snitt och fördelning", () => {
    const summary = reviewSummary([
      { id: "a", rating: 5, name: "A", comment: "", date: "2026-01-01" },
      { id: "b", rating: 2, name: "B", comment: "", date: "2026-01-02" },
    ]);
    expect(summary.average).toBe(3.5);
    expect(summary.counts).toEqual([0, 1, 0, 0, 1]);
  });
});
