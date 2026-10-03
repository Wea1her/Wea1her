import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { parse } from "parse5";

const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
const hasClass = (node, name) =>
  attr(node, "class")?.split(/\s+/).includes(name);
function findAll(node, predicate) {
  return [
    ...(predicate(node) ? [node] : []),
    ...(node.childNodes ?? []).flatMap((child) => findAll(child, predicate)),
  ];
}
const text = (node) =>
  node.nodeName === "#text"
    ? node.value
    : (node.childNodes ?? []).map(text).join("");
const readPage = (path) =>
  parse(readFileSync(`dist/${path}/index.html`, "utf8"));
const links = (page) =>
  findAll(page, (n) => n.tagName === "a").map((n) => attr(n, "href"));

test("section lists expose time and tags with working tag links", () => {
  for (const section of ["blog", "note", "project"]) {
    const page = readPage(section);
    const sidebar = findAll(
      page,
      (n) => attr(n, "data-taxonomy-sidebar") !== undefined,
    )[0];
    assert.ok(sidebar, section);
    assert.deepEqual(
      findAll(sidebar, (n) => hasClass(n, "content-toc-title")).map((n) =>
        text(n).trim(),
      ),
      section === "project" ? ["Time"] : ["Time", "Tags"],
    );
    for (const href of links(sidebar).filter((h) =>
      h?.startsWith(`/${section}/tag/`),
    )) {
      assert.ok(existsSync(`dist${decodeURIComponent(href)}index.html`), href);
    }
  }
});

test("DeFi tag contains all eleven lessons and no deleted directory note", () => {
  const page = readPage("note/tag/defi");
  const hrefs = links(page);
  assert.ok(
    findAll(
      page,
      (n) =>
        n.tagName === "a" &&
        attr(n, "href") === "/note/tag/defi/" &&
        attr(n, "aria-current") === "page",
    ).length,
  );
  const lessons = readdirSync("src/content/note/defi-berkeley").filter((f) =>
    f.endsWith(".mdx"),
  );
  assert.equal(lessons.length, 11);
  for (const lesson of lessons) {
    const slug = `defi-berkeley-${lesson.replace(/\.mdx$/, "")}`;
    assert.ok(hrefs.includes(`/note/${slug}/`), slug);
    const article = readPage(`note/${slug}`);
    assert.ok(links(article).includes("/note/tag/defi/"));
    assert.equal(findAll(article, (n) => hasClass(n, "katex-error")).length, 0);
    for (const counter of findAll(article, (n) =>
      hasClass(n, "waline-comment-count"),
    )) {
      assert.equal(attr(counter, "data-path"), `/note/${slug}`);
    }
  }
  assert.ok(!hrefs.includes("/note/defi-berkeley/"));
});

test("legacy post dates, draft visibility, and comment identities survive the upgrade", () => {
  const page = readPage("blog/erc7962");
  const posting = findAll(
    page,
    (n) => n.tagName === "script" && attr(n, "type") === "application/ld+json",
  )
    .map((n) => JSON.parse(text(n)))
    .find((n) => n["@type"] === "BlogPosting");
  assert.ok(posting.datePublished.startsWith("2026-03-01"));
  assert.ok(posting.keywords.includes("erc7962"));
  for (const counter of findAll(page, (n) =>
    hasClass(n, "waline-comment-count"),
  )) {
    assert.equal(attr(counter, "data-path"), "/blog/erc7962");
  }
  assert.ok(!existsSync("dist/blog/encrypted-test/index.html"));
});

test("the sitemap includes real tag pages on the personal domain", () => {
  const sitemap = readFileSync("dist/sitemap-0.xml", "utf8");
  for (const path of ["blog/tag/web3", "note/tag/defi", "note/tag/thoughts"]) {
    assert.ok(sitemap.includes(`https://www.0xweather.com/${path}/`), path);
  }
  assert.ok(!sitemap.includes("https://example.com"));
});
