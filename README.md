# Desk Buddy

A [Ledger](https://github.com/mastifdogo/Bookeeping) module: a little anime
girl who keeps you company while you do the books. She lives on top of
Ledger's windows:

- wanders along the bottom of the screen, peeks up from below it and follows
  your cursor with her eyes;
- climbs the sides of windows (side-by-side panes, cards, dialogs, also the
  cards inside other panes) and sits on top of them with her legs dangling;
- **falls** when the window she's on goes away: close a pane or a dialog,
  or scroll her card off the screen, and she drops to whatever is below
  (often the bottom of the screen, sometimes with dizzy stars);
- notices new windows (open a pane beside) and often runs over to climb them;
- climbs the edges of the screen and hangs there for a bit before letting go;
- sits and watches while you type, waves when your cursor hangs around her,
  and falls asleep when you stop working (any input wakes her up);
- can be dragged and thrown. Click to poke her, double-click for a heart.

She is drawn in SVG and runs entirely in your browser; nothing is stored.

## Use

1. Install: Settings → Modules → enter `mastifdogo/fun_module`.
2. Open **Desk Buddy** in the sidebar. She jumps out into the Ledger tab and
   stays there while you go to other pages.
3. To have her come back after a reload, open Desk Buddy *beside* (the button
   next to it in the sidebar) and make the pane narrow: Ledger restores panes
   on reload, and the page summons her again.

"Send her home" on the Desk Buddy page puts her away.

## Settings (Settings → Desk Buddy)

| Setting | Default | |
|---|---|---|
| Her name | Hana | Used in her speech bubbles. |
| Come out when the page opens | on | Off: she waits for the Summon button. |
| Hair colour | Sakura pink | Pink, midnight blue, silver, chestnut, mint, honey blonde. |
| Height | 84 px | 48–160. |
| Energy | Normal | Calm sits and watches; Hyper climbs everything. |
| Speech bubbles | on | |
| Falls asleep after | 120 s | Seconds without mouse or keyboard input. |
| Extra things she can climb | — | CSS selectors, comma-separated (e.g. `table, .toolbar`). |

## How it works

`ui/index.html` is the module's page. Because Ledger serves it from the same
origin, it loads `ui/buddy.js` into the Ledger tab around it (`window.top`)
and starts her there, so she outlives the page and can see the whole tab:
panes (`section.pane`), cards (`.card`), module pages (`iframe.module`) and
dialogs, including those inside same-origin pane iframes. Every frame she
re-measures the window she's on; when it's removed, hidden or scrolled away
she falls with gravity and lands on the next window top below or on the
bottom of the screen. Her overlay ignores the pointer except on her, so she
never blocks clicks. `server.mjs` only serves her settings
(`GET /api/v1/m/desk-buddy/config`). No migrations, no database tables, no
journal entries.

Requires Ledger 0.9.1 or newer (settings and a drawn sidebar icon).

## Develop and release

```sh
TEST_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/postgres \
  node <ledger>/.claude/skills/ledger-module/scripts/check-module.ts .
```

To release, bump `version` in `ledger-module.json`, tag `v<version>`, push the
tag and create a GitHub Release from it.

## Changes

- 0.1.0: first version.
