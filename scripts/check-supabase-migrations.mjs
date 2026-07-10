import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
const migrationNamePattern = /^(\d{12})_[a-z0-9_]+\.sql$/;

function stripCommentsAndStrings(sql) {
  let output = "";
  let i = 0;
  let mode = "normal";
  let dollarTag = "";

  while (i < sql.length) {
    const char = sql[i];
    const next = sql[i + 1] ?? "";

    if (mode === "line-comment") {
      if (char === "\n") {
        output += "\n";
        mode = "normal";
      } else {
        output += " ";
      }
      i += 1;
      continue;
    }

    if (mode === "block-comment") {
      if (char === "*" && next === "/") {
        output += "  ";
        i += 2;
        mode = "normal";
      } else {
        output += char === "\n" ? "\n" : " ";
        i += 1;
      }
      continue;
    }

    if (mode === "single-quote") {
      if (char === "'" && next === "'") {
        output += "  ";
        i += 2;
        continue;
      }
      output += char === "\n" ? "\n" : " ";
      if (char === "'") mode = "normal";
      i += 1;
      continue;
    }

    if (mode === "double-quote") {
      if (char === '"' && next === '"') {
        output += "  ";
        i += 2;
        continue;
      }
      output += char === "\n" ? "\n" : " ";
      if (char === '"') mode = "normal";
      i += 1;
      continue;
    }

    if (mode === "dollar-quote") {
      if (sql.startsWith(dollarTag, i)) {
        output += " ".repeat(dollarTag.length);
        i += dollarTag.length;
        mode = "normal";
      } else {
        output += char === "\n" ? "\n" : " ";
        i += 1;
      }
      continue;
    }

    if (char === "-" && next === "-") {
      output += "  ";
      i += 2;
      mode = "line-comment";
      continue;
    }

    if (char === "/" && next === "*") {
      output += "  ";
      i += 2;
      mode = "block-comment";
      continue;
    }

    if (char === "'") {
      output += " ";
      mode = "single-quote";
      i += 1;
      continue;
    }

    if (char === '"') {
      output += " ";
      mode = "double-quote";
      i += 1;
      continue;
    }

    if (char === "$") {
      const match = sql.slice(i).match(/^\$[a-zA-Z_][a-zA-Z0-9_]*\$|^\$\$/);
      if (match) {
        dollarTag = match[0];
        output += " ".repeat(dollarTag.length);
        i += dollarTag.length;
        mode = "dollar-quote";
        continue;
      }
    }

    output += char;
    i += 1;
  }

  return output;
}

function splitStatements(sql) {
  return sql
    .split(";")
    .map((statement) => statement.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function hasWhere(statement) {
  return /\bwhere\b/i.test(statement);
}

function inspectDangerousStatements(fileName, sql) {
  const stripped = stripCommentsAndStrings(sql);
  const statements = splitStatements(stripped);
  const errors = [];
  const warnings = [];

  for (const statement of statements) {
    if (/\bdrop\s+table\b/i.test(statement)) {
      errors.push("DROP TABLE is blocked for automated production migration.");
    }

    if (/\bdrop\s+column\b/i.test(statement)) {
      errors.push("DROP COLUMN is blocked for automated production migration.");
    }

    if (/\btruncate\b/i.test(statement)) {
      errors.push("TRUNCATE is blocked for automated production migration.");
    }

    if (/\bdelete\s+from\b/i.test(statement) && !hasWhere(statement)) {
      errors.push("DELETE without WHERE is blocked for automated production migration.");
    }

    if (/^\s*update\s+[\w".]+\s+set\b/i.test(statement) && !hasWhere(statement)) {
      errors.push("UPDATE without WHERE is blocked for automated production migration.");
    }

    if (/\balter\s+table\b.+\balter\s+column\b.+\btype\b/i.test(statement)) {
      warnings.push("ALTER COLUMN TYPE found. Review lock/backfill risk before production approval.");
    }

    if (/\bset\s+not\s+null\b/i.test(statement)) {
      warnings.push("SET NOT NULL found. Confirm existing rows are valid before production approval.");
    }

    if (/\bdisable\s+row\s+level\s+security\b/i.test(statement)) {
      warnings.push("RLS disable statement found. This should normally be rejected unless explicitly justified.");
    }

    if (/\bdrop\s+policy\b/i.test(statement)) {
      warnings.push("DROP POLICY found. Confirm replacement policies are created in the same migration.");
    }
  }

  return {
    errors: [...new Set(errors)].map((message) => `${fileName}: ${message}`),
    warnings: [...new Set(warnings)].map((message) => `${fileName}: ${message}`),
  };
}

const entries = await readdir(migrationsDir, { withFileTypes: true });
const files = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
  .map((entry) => entry.name)
  .sort();

const errors = [];
const warnings = [];
const timestamps = new Map();

for (const fileName of files) {
  const match = fileName.match(migrationNamePattern);
  if (!match) {
    errors.push(`${fileName}: migration file name must match YYYYMMDDHHMM_description.sql.`);
    continue;
  }

  const timestamp = match[1];
  if (timestamps.has(timestamp)) {
    errors.push(`${fileName}: duplicate migration timestamp also used by ${timestamps.get(timestamp)}.`);
  } else {
    timestamps.set(timestamp, fileName);
  }

  const sql = await readFile(path.join(migrationsDir, fileName), "utf8");
  const inspected = inspectDangerousStatements(fileName, sql);
  errors.push(...inspected.errors);
  warnings.push(...inspected.warnings);
}

console.log(`Checked ${files.length} Supabase migration file(s).`);

for (const warning of warnings) {
  console.warn(`warning: ${warning}`);
}

if (errors.length > 0) {
  console.error("Blocked Supabase migration check:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
