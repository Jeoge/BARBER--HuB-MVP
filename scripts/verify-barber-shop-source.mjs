import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tempRoot = await mkdtemp(join(root, ".barber-source-test-"));
const sourceFiles = ["lib/barber-import/normalization.ts", "lib/barber-import/csv.ts", "lib/barber-import/source.ts"];
const useRealUrl = process.argv.includes("--real-url");
const realUrl = "https://krk.or.jp/search/?post=&address=&name=";

function transpile(source) {
  return ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      esModuleInterop: true,
    },
  }).outputText
    .replace(/^import ["']server-only["'];\s*/m, "")
    .replace(/from ("|')(\.\/[^"']+)(\1)/g, "from $1$2.mjs$3")
    .replace(/import\(("|')(\.\/[^"']+)(\1)\)/g, "import($1$2.mjs$3)");
}

function assertPlainSerializable(value, path = "state") {
  if (value == null || ["string", "number", "boolean"].includes(typeof value)) return;
  assert.notEqual(typeof value, "undefined", `${path} must not contain undefined`);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertPlainSerializable(item, `${path}[${index}]`));
    return;
  }
  assert.equal(Object.getPrototypeOf(value), Object.prototype, `${path} must be a plain object`);
  Object.entries(value).forEach(([key, item]) => assertPlainSerializable(item, `${path}.${key}`));
}

try {
  for (const relativePath of sourceFiles) {
    const outputName = `${basename(relativePath, ".ts")}.mjs`;
    await writeFile(join(tempRoot, outputName), transpile(await readFile(join(root, relativePath), "utf8")), "utf8");
  }

  const fixture = await readFile(join(root, "tests/fixtures/krk-search.html"));
  const originalFetch = globalThis.fetch;
  if (!useRealUrl) {
    globalThis.fetch = async () => new Response(fixture, {
      status: 200,
      headers: { "content-type": "text/html; charset=UTF-8" },
    });
  }

  try {
    const { analyzeBarberShopSource, createBarberShopSourcePreview } = await import(`${pathToFileURL(join(tempRoot, "source.mjs")).href}?fixture=${Date.now()}`);
    const input = {
      sourceUrl: useRealUrl ? realUrl : "https://example.com/search/?post=&address=&name=",
      prefecture: useRealUrl ? "神奈川県" : "東京都",
      municipality: useRealUrl ? "" : "千代田区",
      sourceName: useRealUrl ? "神奈川県理容生活衛生同業組合 組合加盟店一覧" : "fixture 組合加盟店一覧",
    };
    const analysis = await analyzeBarberShopSource(input);
    const analysisState = { analysis, preview: null, error: null };
    assertPlainSerializable(analysisState);
    const analysisStateBytes = new TextEncoder().encode(JSON.stringify(analysisState)).byteLength;
    assert.ok(analysisStateBytes < 1_000_000, "analysis action state must stay below 1 MB");

    assert.equal(analysis.format, "HTML table");
    assert.equal(analysis.responseStatus, 200);
    assert.equal(analysis.encoding, "utf-8");
    assert.equal(analysis.tableCount, 1);
    assert.equal(analysis.pageDisplayCount, useRealUrl ? 30 : 2);
    assert.equal(analysis.reportedTotalCount, useRealUrl ? 1388 : 2);
    assert.equal(analysis.paginationDetected, true);
    assert.deepEqual(analysis.headers, ["店名", "郵便番号", "住所", "TEL"]);
    assert.deepEqual(analysis.autoMapping, { name: 0, address: 2, phone: 3 });
    assert.ok(analysis.sampleRows[0]?.[0]);

    const preview = await createBarberShopSourcePreview({
      ...input,
      mapping: analysis.autoMapping,
    });
    const previewState = { analysis, preview, error: null };
    assertPlainSerializable(previewState);
    const previewStateBytes = new TextEncoder().encode(JSON.stringify(previewState)).byteLength;
    assert.ok(previewStateBytes < 1_000_000, "preview action state must stay below 1 MB");
    assert.equal(preview.outputCount, useRealUrl ? 30 : 2);
    assert.equal(preview.paginationDetected, true);
    assert.ok(preview.rows[0]?.name);
    if (useRealUrl) {
      assert.match(preview.rows[0]?.address ?? "", /^川崎市川崎区/);
      assert.match(preview.rows[0]?.phone ?? "", /^044-/);
    } else {
      assert.equal(preview.rows[0]?.address, "東京都千代田区1-1");
      assert.equal(preview.rows[0]?.phone, "03-0000-0001");
    }
    assert.match(preview.csv, /^\uFEFF/);
    const csvLines = preview.csv.split(/\r\n|\n/);
    assert.equal(csvLines[0], "\uFEFF店名,都道府県,市区町村,住所,電話番号,掲載元,認証状態");
    assert.match(csvLines[1] ?? "", /,未認証$/);
    if (!useRealUrl) {
      assert.match(preview.csv, /fixture barber A/);
      assert.match(preview.csv, /fixture barber B/);
    }
    console.log(JSON.stringify({
      format: analysis.format,
      headers: analysis.headers,
      autoMapping: analysis.autoMapping,
      sampleRows: analysis.sampleRows.length,
      outputCount: preview.outputCount,
      paginationDetected: preview.paginationDetected,
      responseStatus: analysis.responseStatus,
      encoding: analysis.encoding,
      reportedTotalCount: analysis.reportedTotalCount,
      analysisStateBytes,
      previewStateBytes,
    }));
  } finally {
    globalThis.fetch = originalFetch;
  }
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
