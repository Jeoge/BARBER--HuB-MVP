const rawUrl = process.env.SUPABASE_DB_URL;

function fail(message) {
  console.error(`SUPABASE_DB_URL validation failed: ${message}`);
  process.exit(1);
}

if (!rawUrl) {
  fail("Environment secret is missing or empty.");
}

let parsed;
try {
  parsed = new URL(rawUrl);
} catch {
  fail("Value must be a valid Postgres connection URL.");
}

if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
  fail("Protocol must be postgres:// or postgresql://.");
}

if (!parsed.username || !parsed.username.startsWith("postgres.")) {
  fail("Username must use the Supavisor session pooler form postgres.<PROJECT_REF>.");
}

if (!parsed.password) {
  fail("Password is missing from the connection URL.");
}

if (!parsed.hostname.endsWith(".pooler.supabase.com")) {
  fail("Host must be the Supabase Session pooler host, not the direct db.<PROJECT_REF>.supabase.co host.");
}

if (parsed.hostname.startsWith("db.") || parsed.hostname.endsWith(".supabase.co")) {
  fail("Direct Supabase database hosts are not allowed in GitHub Actions.");
}

if (parsed.port !== "5432") {
  fail("Port must be 5432 for the Session pooler. Do not use the transaction pooler port.");
}

const databaseName = parsed.pathname.replace(/^\//, "");
if (databaseName !== "postgres") {
  fail("Database name must be postgres.");
}

console.log("SUPABASE_DB_URL shape OK.");
console.log(`Using Supabase Session pooler host: ${parsed.hostname}`);
console.log(`Using port: ${parsed.port}`);
console.log("Direct db.<PROJECT_REF>.supabase.co:5432 is not used.");
