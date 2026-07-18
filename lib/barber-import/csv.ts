export const BARBER_SHOP_CSV_HEADERS = ["店名", "都道府県", "市区町村", "住所", "電話番号", "掲載元", "認証状態"] as const;

export type BarberShopCsvHeader = (typeof BARBER_SHOP_CSV_HEADERS)[number];

export type ParsedCsv = {
  headers: string[];
  rows: string[][];
  encoding: "utf-8" | "shift_jis";
};

function stripBom(value: string) {
  return value.replace(/^\uFEFF/, "");
}

function decodeWithLabel(bytes: Uint8Array, label: "utf-8" | "shift_jis") {
  return new TextDecoder(label, { fatal: false }).decode(bytes);
}

function headerScore(text: string) {
  const firstLine = stripBom(text).split(/\r\n|\n|\r/, 1)[0] ?? "";
  const replacementPenalty = (text.match(/\uFFFD/g) ?? []).length;
  const matchedHeaders = BARBER_SHOP_CSV_HEADERS.filter((header) => firstLine.includes(header)).length;

  return matchedHeaders * 20 - replacementPenalty;
}

export function decodeCsv(arrayBuffer: ArrayBuffer): { text: string; encoding: ParsedCsv["encoding"] } {
  const bytes = new Uint8Array(arrayBuffer);
  const utf8 = decodeWithLabel(bytes, "utf-8");
  let shiftJis = "";

  try {
    shiftJis = decodeWithLabel(bytes, "shift_jis");
  } catch {
    return { text: utf8, encoding: "utf-8" };
  }

  if (headerScore(shiftJis) > headerScore(utf8)) {
    return { text: shiftJis, encoding: "shift_jis" };
  }

  return { text: utf8, encoding: "utf-8" };
}

export function parseCsvText(text: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
      continue;
    }

    if (char === ",") {
      row.push(current);
      current = "";
      continue;
    }

    if (char === "\n" || char === "\r") {
      row.push(current);
      rows.push(row);
      row = [];
      current = "";

      if (char === "\r" && next === "\n") {
        index += 1;
      }
      continue;
    }

    current += char;
  }

  row.push(current);
  rows.push(row);

  return rows.filter((item) => item.some((cell) => cell.trim().length > 0));
}

export function parseBarberShopCsv(arrayBuffer: ArrayBuffer): ParsedCsv {
  const decoded = decodeCsv(arrayBuffer);
  const rows = parseCsvText(decoded.text);
  const [headerRow, ...bodyRows] = rows;

  return {
    headers: (headerRow ?? []).map((header, index) => (index === 0 ? stripBom(header) : header).trim()),
    rows: bodyRows,
    encoding: decoded.encoding,
  };
}

export function missingCsvHeaders(headers: string[]) {
  return BARBER_SHOP_CSV_HEADERS.filter((header) => !headers.includes(header));
}
