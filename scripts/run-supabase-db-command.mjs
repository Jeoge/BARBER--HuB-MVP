import { spawn } from "node:child_process";

const dbUrl = process.env.SUPABASE_DB_URL;
const args = process.argv.slice(2);

if (!dbUrl) {
  console.error("SUPABASE_DB_URL is required.");
  process.exit(1);
}

if (args.length === 0) {
  console.error("Usage: node scripts/run-supabase-db-command.mjs <supabase args...>");
  process.exit(1);
}

function sanitize(value) {
  return value
    .replaceAll(dbUrl, "[SUPABASE_DB_URL]")
    .replace(/(postgres(?:ql)?:\/\/[^:\s/@]+:)[^@\s]+(@)/gi, "$1[REDACTED]$2");
}

function classifyFailure(output) {
  const lower = output.toLowerCase();

  if (
    /password authentication failed|authentication failed|invalid password|sasl|28p01|role .* does not exist|permission denied/i.test(
      output,
    )
  ) {
    return "authentication/credential error. Check the SUPABASE_DB_URL username and password from the Supabase Dashboard Session pooler string.";
  }

  if (
    lower.includes("failed to connect") ||
    lower.includes("network is unreachable") ||
    lower.includes("no such host") ||
    lower.includes("connection refused") ||
    lower.includes("timeout") ||
    lower.includes("enetwork") ||
    lower.includes("enetunreach") ||
    lower.includes("econnrefused") ||
    lower.includes("etimedout") ||
    lower.includes("cannot assign requested address")
  ) {
    return "network/pooler reachability error. Check that SUPABASE_DB_URL uses the Session pooler host and port 5432.";
  }

  return "unknown Supabase DB command error. Check the sanitized command output above.";
}

const child = spawn("supabase", [...args, "--db-url", dbUrl], {
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
});

let stdout = "";
let stderr = "";

child.stdout.on("data", (chunk) => {
  stdout += chunk.toString();
});

child.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
});

child.on("error", (error) => {
  console.error(`Failed to start Supabase CLI: ${sanitize(error.message)}`);
  process.exit(1);
});

child.on("close", (code) => {
  const safeStdout = sanitize(stdout);
  const safeStderr = sanitize(stderr);

  if (safeStdout.trim()) process.stdout.write(safeStdout);
  if (safeStderr.trim()) process.stderr.write(safeStderr);

  if (code !== 0) {
    console.error(`Supabase DB command failed: ${classifyFailure(`${stdout}\n${stderr}`)}`);
    process.exit(code ?? 1);
  }
});
