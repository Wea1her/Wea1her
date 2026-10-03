import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

const config = JSON.parse(readFileSync("vercel.json", "utf8"));

test("Vercel builds the static Astro site with the pinned package manager", () => {
  assert.equal(config.framework, "astro");
  assert.equal(config.outputDirectory, "dist");
  assert.equal(config.buildCommand, "pnpm build");
  assert.match(readFileSync("astro.config.mjs", "utf8"), /output: "static"/);
  assert.equal(
    JSON.parse(readFileSync("package.json", "utf8")).packageManager,
    "pnpm@11.15.1",
  );
});

test("published archive links redirect to existing tag or listing pages", () => {
  for (const redirect of config.redirects) {
    assert.equal(redirect.permanent, true);
    assert.ok(
      existsSync(`dist${redirect.destination}index.html`),
      redirect.destination,
    );
  }
  assert.ok(
    config.redirects.some(
      (r) =>
        r.source === "/note-archive/defi-berkeley" &&
        r.destination === "/note/tag/defi/",
    ),
  );
  assert.ok(!existsSync("dist/note/defi-berkeley/index.html"));
});
