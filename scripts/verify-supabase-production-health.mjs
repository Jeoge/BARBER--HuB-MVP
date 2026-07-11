const projectRef = process.env.SUPABASE_PROJECT_REF;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!projectRef) {
  console.error("SUPABASE_PROJECT_REF is required.");
  process.exit(1);
}

if (!publishableKey) {
  console.error("SUPABASE_PUBLISHABLE_KEY is required for post-migration public API health checks.");
  process.exit(1);
}

const baseUrl = `https://${projectRef}.supabase.co`;
const headers = {
  apikey: publishableKey,
  Authorization: `Bearer ${publishableKey}`,
  "Content-Type": "application/json",
};

async function requestJson(label, path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${label} failed with HTTP ${response.status}: ${text.slice(0, 300)}`);
  }

  return response.json();
}

const checks = [];

const count = await requestJson("get_public_barber_shop_count", "/rest/v1/rpc/get_public_barber_shop_count", {
  method: "POST",
  body: "{}",
});
checks.push(`get_public_barber_shop_count responded: ${count}`);

const municipalities = await requestJson("list_barber_shop_municipalities", "/rest/v1/rpc/list_barber_shop_municipalities", {
  method: "POST",
  body: JSON.stringify({ shop_prefecture: "福岡県" }),
});
checks.push(`list_barber_shop_municipalities responded with ${Array.isArray(municipalities) ? municipalities.length : 0} row(s).`);

const shops = await requestJson(
  "barber_shops select",
  "/rest/v1/barber_shops?select=id,name,verification_status,is_public,is_deleted,is_duplicate&limit=1"
);
checks.push(`barber_shops select responded with ${Array.isArray(shops) ? shops.length : 0} row(s).`);

const claims = await requestJson("barber_shop_claims select", "/rest/v1/barber_shop_claims?select=id,status&limit=1");
checks.push(`barber_shop_claims select responded with ${Array.isArray(claims) ? claims.length : 0} row(s).`);

for (const check of checks) {
  console.log(check);
}
