#!/usr/bin/env node
/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster
 *
 * This file is part of Fonoster.
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// Renders the shareable card the Release workflow attaches to each GitHub release: the
// commits that shipped since the previous tag, grouped by conventional-commit type, on a
// 1080x1350 (4:5) card in the Fonoster colors (site/assets/css/v1.css). Ported from
// fonoster/routr. satori lays the card out as SVG and resvg rasterizes it; fonts and emoji
// come from pinned CDN versions. RELEASE_CARD_THEME picks dark or light.
//
//   cd ops/release/release-card && npm ci
//   node ops/release/release-card/release-card.mjs v0.31.0 release-card-v0.31.0.png

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const WIDTH = 1080;
const HEIGHT = 1350;
// Room left for sections between the title and the footer, in px, and the rough height
// of what goes in it. Messages wrap at about CHARS_PER_LINE, so the cut is by height, not
// by item count, or a release with long subjects pushes the footer off the card.
const SECTIONS_HEIGHT = 800;
const SECTION_HEADER_HEIGHT = 100;
const LINE_HEIGHT = 41;
const ROW_GAP = 14;
const CHARS_PER_LINE = 44;
const REPO = process.env.GITHUB_REPOSITORY || "fonoster/fonoster";
const THEME = process.env.RELEASE_CARD_THEME === "light" ? "light" : "dark";
const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../../.."
);
// The docs logos: dark.svg is the one drawn for dark backgrounds.
const LOGO_SVG = fs.readFileSync(
  path.join(ROOT, "docs-site/logo", `${THEME}.svg`)
);
const LOGO = `data:image/svg+xml;base64,${LOGO_SVG.toString("base64")}`;

// Only what ships: the same types that make .scripts/next-release.sh cut a release.
const SECTIONS = {
  feat: { emoji: "🎉", label: "New Features" },
  fix: { emoji: "🐛", label: "Bug Fixes" },
  perf: { emoji: "⚡", label: "Performance" },
  refactor: { emoji: "🔧", label: "Refactors" }
};

// Fonoster tokens: #181818 dark background, #39E19E accent, #008751 accent text on light.
const PALETTES = {
  dark: {
    bg: "#181818",
    accent: "#39E19E",
    pillBg: "#0F2A1F",
    pillText: "#39E19E",
    pillBorder: "#1F5A40",
    ink: "#FFFFFF",
    body: "#D6D6D6",
    muted: "#8D8D8D",
    hair: "#2E2E2E",
    bullet: "#39E19E",
    chipBg: "#232323",
    chipText: "#A8A8A8"
  },
  light: {
    bg: "#FFFFFF",
    accent: "#39E19E",
    pillBg: "#EAFBF3",
    pillText: "#008751",
    pillBorder: "#BDEFD8",
    ink: "#181818",
    body: "#333333",
    muted: "#8D8D8D",
    hair: "#E8E8E8",
    bullet: "#008751",
    chipBg: "#F4F4F4",
    chipText: "#555555"
  }
};
const COLORS = PALETTES[THEME];

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();

// The commits between the tag before `tag` and `tag`, grouped by type.
function collectNotes(tag) {
  let range = tag;
  try {
    range = `${git("describe", "--tags", "--abbrev=0", "--match", "v[0-9]*", `${tag}^`)}..${tag}`;
  } catch {
    // first tag: everything up to it
  }
  const commits = git(
    "log",
    range,
    "--no-merges",
    "--abbrev=7",
    "--format=%h%x09%an%x09%s"
  )
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [sha, author, subject] = line.split("\t");
      return { sha, author, subject };
    });

  const sections = Object.keys(SECTIONS).map((type) => ({ type, items: [] }));
  for (const { sha, subject } of commits) {
    const match = subject.match(/^(\w+)(\([^)]*\))?!?:\s*(.+)$/);
    const section =
      match && sections.find((s) => s.type === match[1].toLowerCase());
    if (!section) continue;
    const message = match[3].replace(/`/g, "");
    // Capitalize prose, but leave identifiers like spec.trace.enabled as written.
    const prose = !/[._/-]/.test(message.split(" ")[0]);
    section.items.push({
      sha,
      message: prose
        ? message.charAt(0).toUpperCase() + message.slice(1)
        : message
    });
  }

  const humans = new Set(
    commits.map((c) => c.author).filter((a) => !/bot\b|\[bot\]/i.test(a))
  );
  return {
    tag,
    date: git("log", "-1", "--format=%cs", tag),
    contributors: humans.size,
    commits: commits.length,
    sections: sections.filter((s) => s.items.length)
  };
}

const CACHE = path.join(os.tmpdir(), "fonoster-release-card");
fs.mkdirSync(CACHE, { recursive: true });

async function fetchCached(url, file) {
  const cached = path.join(CACHE, file);
  if (fs.existsSync(cached)) return fs.readFileSync(cached);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(cached, buf);
  return buf;
}

// The last @fontsource 4.x release of each family, the line that still ships .woff files.
const FONT_VERSIONS = { poppins: "4.5.10", "jetbrains-mono": "4.5.12" };

const loadFont = (pkg, weight) => {
  const file = `${pkg}-latin-${weight}-normal.woff`;
  return fetchCached(
    `https://cdn.jsdelivr.net/npm/@fontsource/${pkg}@${FONT_VERSIONS[pkg]}/files/${file}`,
    file
  );
};

// A missing emoji renders as nothing rather than failing the card.
async function loadEmoji(emoji) {
  const code = [...emoji]
    .filter((c) => c !== "️")
    .map((c) => c.codePointAt(0).toString(16))
    .join("-");
  try {
    const svg = await fetchCached(
      `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/${code}.svg`,
      `emoji-${code}.svg`
    );
    return `data:image/svg+xml;base64,${svg.toString("base64")}`;
  } catch {
    return "";
  }
}

const h = (type, style, children) => ({ type, props: { style, children } });

function commitRow(item) {
  return h(
    "div",
    { display: "flex", alignItems: "flex-start", marginTop: 14, width: "100%" },
    [
      h(
        "div",
        {
          display: "flex",
          width: 8,
          height: 8,
          borderRadius: 8,
          backgroundColor: COLORS.bullet,
          marginTop: 14,
          marginRight: 16,
          flexShrink: 0
        },
        []
      ),
      h(
        "div",
        {
          display: "flex",
          flex: 1,
          color: COLORS.body,
          fontSize: 30,
          lineHeight: 1.35
        },
        item.message
      ),
      h(
        "div",
        {
          display: "flex",
          fontFamily: "JetBrains Mono",
          fontSize: 22,
          color: COLORS.chipText,
          backgroundColor: COLORS.chipBg,
          border: `1px solid ${COLORS.hair}`,
          borderRadius: 8,
          padding: "2px 10px",
          marginLeft: 12,
          lineHeight: 1.4
        },
        item.sha
      )
    ]
  );
}

function sectionBlock(section) {
  const { emoji, label } = SECTIONS[section.type];
  return h("div", { display: "flex", flexDirection: "column", marginTop: 24 }, [
    h(
      "div",
      { display: "flex", alignItems: "center", marginBottom: 6, marginTop: 14 },
      [
        h("div", { display: "flex", fontSize: 34, marginRight: 14 }, emoji),
        h(
          "div",
          { display: "flex", fontSize: 36, fontWeight: 700, color: COLORS.ink },
          label
        )
      ]
    ),
    h(
      "div",
      {
        display: "flex",
        width: "100%",
        height: 1,
        backgroundColor: COLORS.hair
      },
      []
    ),
    ...section.items.map(commitRow)
  ]);
}

function buildCard(notes) {
  // Fill the card until the next row would not fit; the rest becomes "+N more".
  const rowHeight = (item) =>
    ROW_GAP + LINE_HEIGHT * Math.ceil(item.message.length / CHARS_PER_LINE);
  let room = SECTIONS_HEIGHT;
  let dropped = 0;
  const sections = [];
  for (const section of notes.sections) {
    const items = [];
    for (const item of section.items) {
      const needed =
        rowHeight(item) + (items.length ? 0 : SECTION_HEADER_HEIGHT);
      if (dropped || needed > room) {
        dropped++;
        continue;
      }
      room -= needed;
      items.push(item);
    }
    if (items.length) sections.push({ ...section, items });
  }

  const header = h(
    "div",
    {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%"
    },
    [
      { type: "img", props: { src: LOGO, width: 194, height: 50 } },
      h(
        "div",
        {
          display: "flex",
          fontFamily: "JetBrains Mono",
          fontSize: 26,
          fontWeight: 700,
          color: COLORS.pillText,
          backgroundColor: COLORS.pillBg,
          border: `1px solid ${COLORS.pillBorder}`,
          borderRadius: 999,
          padding: "6px 20px"
        },
        notes.tag
      )
    ]
  );

  const title = h(
    "div",
    { display: "flex", flexDirection: "column", marginTop: 40 },
    [
      h(
        "div",
        {
          display: "flex",
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: 4,
          color: COLORS.muted
        },
        "RELEASE"
      ),
      h(
        "div",
        {
          display: "flex",
          fontSize: 84,
          fontWeight: 700,
          color: COLORS.ink,
          marginTop: 4,
          lineHeight: 1
        },
        notes.tag
      ),
      h(
        "div",
        { display: "flex", fontSize: 28, color: COLORS.muted, marginTop: 12 },
        notes.date
      )
    ]
  );

  const stats = [
    REPO,
    `${notes.contributors} contributor${notes.contributors === 1 ? "" : "s"}`,
    `${notes.commits} commits`
  ].join("  ·  ");
  const footer = h(
    "div",
    {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      marginTop: "auto",
      paddingTop: 28,
      borderTop: `1px solid ${COLORS.hair}`,
      color: COLORS.muted,
      fontSize: 26
    },
    [
      h("div", { display: "flex" }, stats),
      h(
        "div",
        { display: "flex", fontWeight: 600, color: COLORS.ink },
        "fonoster.com"
      )
    ]
  );

  const more = dropped
    ? [
        h(
          "div",
          { display: "flex", color: COLORS.muted, fontSize: 26, marginTop: 22 },
          `+ ${dropped} more commits`
        )
      ]
    : [];

  return h(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      position: "relative",
      width: WIDTH,
      height: HEIGHT,
      backgroundColor: COLORS.bg,
      padding: "72px 72px 56px",
      fontFamily: "Poppins"
    },
    [
      h(
        "div",
        {
          display: "flex",
          width: WIDTH,
          height: 14,
          backgroundColor: COLORS.accent,
          position: "absolute",
          top: 0,
          left: 0
        },
        []
      ),
      header,
      title,
      ...sections.map(sectionBlock),
      ...more,
      footer
    ]
  );
}

async function main() {
  const [tag, out] = process.argv.slice(2);
  if (!tag || !out) {
    console.error("usage: release-card.mjs <tag> <out.png>");
    process.exit(1);
  }

  const notes = collectNotes(tag);
  if (!notes.sections.length) {
    console.error(`no feat, fix, perf or refactor commits in ${tag}; no card`);
    process.exit(1);
  }

  const [poppins400, poppins600, poppins700, mono] = await Promise.all([
    loadFont("poppins", 400),
    loadFont("poppins", 600),
    loadFont("poppins", 700),
    loadFont("jetbrains-mono", 400)
  ]);
  const svg = await satori(buildCard(notes), {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: "Poppins", data: poppins400, weight: 400, style: "normal" },
      { name: "Poppins", data: poppins600, weight: 600, style: "normal" },
      { name: "Poppins", data: poppins700, weight: 700, style: "normal" },
      { name: "JetBrains Mono", data: mono, weight: 400, style: "normal" }
    ],
    loadAdditionalAsset: async (code, segment) =>
      code === "emoji" ? loadEmoji(segment) : code
  });
  fs.writeFileSync(
    out,
    new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } }).render().asPng()
  );

  const counts = notes.sections
    .map((s) => `${s.items.length} ${s.type}`)
    .join(" · ");
  console.log(`${out}: ${counts} across ${notes.commits} commits`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
