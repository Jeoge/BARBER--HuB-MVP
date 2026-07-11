const rawUrl = process.env.SUPABASE_DB_URL;

function fail(message) {
  console.error(`SUPABASE_DB_URL validation failed: ${message}`);
  process.exit(1);
}

if (!rawUrl) {
  fail("Environment secret is missing or empty.");
}

function extractRawPasswordSegment(value) {
  const protocolMatch = value.match(/^postgres(?:ql)?:\/\//i);
  if (!protocolMatch) {
    fail("Protocol must be postgres:// or postgresql://.");
  }

  const afterProtocol = value.slice(protocolMatch[0].length);
  const authorityEndIndex = afterProtocol.search(/[/?#]/);
  const authority = authorityEndIndex === -1 ? afterProtocol : afterProtocol.slice(0, authorityEndIndex);
  const atMatches = authority.match(/@/g) ?? [];

  if (atMatches.length === 0) {
    fail(
      "Credentials separator is missing before the host. If the password contains /, ?, or #, URL-encode the password part only.",
    );
  }

  if (atMatches.length > 1) {
    fail("Credentials contain more than one @. URL-encode @ in the password as %40.");
  }

  const userInfo = authority.slice(0, authority.indexOf("@"));
  const passwordSeparatorIndex = userInfo.indexOf(":");

  if (passwordSeparatorIndex === -1) {
    fail("Password is missing from the connection URL.");
  }

  const rawPassword = userInfo.slice(passwordSeparatorIndex + 1);
  if (!rawPassword) {
    fail("Password is missing from the connection URL.");
  }

  return rawPassword;
}

function validatePasswordEncoding(rawPassword) {
  const unreserved = /^[A-Za-z0-9._~-]$/;

  for (let index = 0; index < rawPassword.length; index += 1) {
    const char = rawPassword[index];

    if (char === "%") {
      const escapeSequence = rawPassword.slice(index + 1, index + 3);
      if (!/^[0-9A-Fa-f]{2}$/.test(escapeSequence)) {
        fail("Password contains an invalid percent escape. Encode literal % as %25.");
      }
      index += 2;
      continue;
    }

    if (!unreserved.test(char)) {
      fail(
        "Password contains characters that must be URL-encoded before storing SUPABASE_DB_URL. Encode the password part only, not the entire connection string.",
      );
    }
  }
}

validatePasswordEncoding(extractRawPasswordSegment(rawUrl));

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
