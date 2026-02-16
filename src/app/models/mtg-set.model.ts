export interface MtgSet {
  code: string;          // Set-Kürzel (z.B. "MH3")
  name: string;          // Set-Name (z.B. "Modern Horizons 3")
  released_at: string;   // Release-Datum (ISO format: "YYYY-MM-DD")
  icon_svg_uri: string;  // URL zum Set-Logo (SVG)
  set_type: string;      // Set-Typ (z.B. "expansion", "core", "commander")
  card_count: number;    // Anzahl der Karten im Set
  block?: string;        // Block-Name (optional)
}

// Response von Scryfall API
export interface ScryfallSetResponse {
  object: string;
  id: string;
  code: string;
  name: string;
  released_at: string;
  icon_svg_uri: string;
  set_type: string;
  card_count: number;
  block?: string;
  block_code?: string;
  // Weitere Felder werden ignoriert
}
