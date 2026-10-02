// Vart gästen kan navigera i receptionsscenen, och vad som kräver inloggning med en bokning.

export type HotelPanel =
  "book" | "stay" | "sauna" | "aurora" | "taxi" | "food" | "login" | "about" | "reviews" | "cloud";

// "report" är felanmälan, som ligger som egen sektion under scenen.
export type NavTarget = HotelPanel | "report";

// Kräver inloggning med en bokning. "stay" räcker med vilken bokning som helst (även utcheckad, för kvittot),
// resten kräver en vistelse som inte är utcheckad.
export const GUEST_ONLY: NavTarget[] = ["stay", "sauna", "aurora", "taxi", "food", "report"];
