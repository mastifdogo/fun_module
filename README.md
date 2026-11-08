# Desk Buddy

A [Ledger](https://github.com/mastifdogo/Bookeeping) module: a little
companion who keeps you company while you do the books. She's a young woman
with dark skin, brown eyes and loose, curly black hair, in a traditional
dress (a West African wax-print Ankara dress, or a yukata), drawn in a crisp
anime style in SVG: realistic proportions, cel shading, big detailed eyes,
glossy hair with a rim light, and jointed limbs. She lives on top of
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

She moves smoothly between poses (her curls and skirt trail behind her), and
runs entirely in your browser; nothing is stored.

## Use

1. Install: Settings → Modules → enter `mastifdogo/fun_module`.
2. Open **Desk Buddy** in the sidebar. She jumps out into the Ledger tab and
   stays there while you go to other pages.
3. To have her come back after a reload, open Desk Buddy *beside* (the button
   next to it in the sidebar) and make the pane narrow: Ledger restores panes
   on reload, and the page summons her again.

"Send her home" on the Desk Buddy page puts her away.

## Making her 3D (lifelike)

Desk Buddy has a full 3D renderer (three.js, bundled in `ui/vendor/`, MIT
licence). Add a rigged human model and she becomes a lit, shaded 3D character
who does everything the drawn version does: walks, climbs, hangs, sits on
window edges, falls, gets dragged. Without a model she stays drawn.

1. Get a **rigged humanoid** model as **glTF binary (`.glb`)**. Good sources:
   - **MakeHuman** (free; exported models are public domain/CC0): build her,
     add hair, skin and clothes, use the *Game engine* or *Default* skeleton,
     export glTF/GLB.
   - **Mixamo** (free with an Adobe account): rigged characters and
     animations. Download animations *In Place*.
   - **Character Creator / Daz / VRoid** exports also work.
2. Save it in this repository as **`ui/model/buddy.glb`** (or set
   *3D model file* in Settings), commit, and release.
3. If she doesn't face you when standing, set *3D model turn* (e.g. 180).

What's detected automatically:

- **Skeleton**: Mixamo, MakeHuman, VRoid/VRM, Character Creator and Rigify
  bone names (arms, forearms, thighs, shins, head). Her poses are applied to
  these bones.
- **Animation clips** in the file are used when their names match what she's
  doing: `idle`, `walk`, `climb`, `hang`, `jump`, `fall`, `land`, `sit`,
  `sleep`, `wave`, `hurt`, `point`, `laugh`... (e.g. Mixamo "Walking",
  "Sitting Idle", "Falling Idle", "Waving"). Real motion-capture clips make
  her look far more lifelike than the built-in poses.
- **Face morphs** for blinking, smiling and an open mouth (names like
  `eyeBlink`, `mouthSmile`, `jawOpen`, VRoid `Fcl_EYE_Close`).

Tips: keep the file under ~10 MB (she's small on screen; 1K textures are
plenty), don't use Draco or Meshopt compression, and remember that if this
repository is public, the model file is public too: only commit a model whose
licence allows redistribution.

## Settings (Settings → Desk Buddy)

| Setting | Default | |
|---|---|---|
| Her name | Hana | Used in her speech bubbles. |
| Come out when the page opens | on | Off: she waits for the Summon button. |
| Hair colour | Black | Black, dark brown, midnight blue, pink, silver, honey blonde. |
| Dress | Ankara | Ankara wax-print dress or yukata. |
| Height | 130 px | 72–220. |
| Energy | Normal | Calm sits and watches; Hyper climbs everything. |
| Speech bubbles | on | |
| Falls asleep after | 120 s | Seconds without mouse or keyboard input. |
| Extra things she can climb | — | CSS selectors, comma-separated (e.g. `table, .toolbar`). |
| Look | 3D when a model is installed | Or always the drawn version. |
| 3D model file | model/buddy.glb | Path inside `ui/`. |
| 3D model turn | 0° | Turns a model that doesn't face you. |

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

- 0.4.0: 3D renderer: add a rigged `.glb` model (`ui/model/buddy.glb`) and
  she's shown as a lit 3D character, posed by her behaviours or by the
  model's own animation clips. New Look / 3D model settings.
- 0.3.0: high-definition anime style: cel shading, larger detailed anime eyes
  with layered irises and catch-lights, glossy skin and lips, a highlight band
  and rim light on her curls, crisper line art, slightly larger head.
- 0.2.0: new look: realistic proportions, dark skin, brown eyes, loose curly
  black hair, traditional dress (Ankara or yukata, new Dress setting), soft
  shading, knees and elbows, smooth pose blending.
- 0.1.0: first version.
