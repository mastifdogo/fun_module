/*
 * Desk Buddy: a little companion who lives on top of Ledger's windows.
 *
 * The Desk Buddy page loads this file into the Ledger tab around it (same
 * origin) and calls __deskBuddyKit.start(config). From then on she lives in
 * that tab, independent of the page that summoned her: she walks along the
 * bottom of the screen, climbs the sides of panes, cards and dialogs (also
 * inside side-by-side panes), sits on their tops, and falls when the window
 * under her closes or scrolls away. She watches the cursor, reacts to typing
 * and clicks, falls asleep when you stop working, and can be dragged and
 * thrown.
 *
 * Plain JavaScript, no dependencies. All text goes in with textContent.
 */
(function () {
	"use strict";
	const VERSION = "0.1.0";
	const NS = "http://www.w3.org/2000/svg";
	const kit = (window.__deskBuddyKit = window.__deskBuddyKit || {});
	if (kit.version === VERSION && kit.start) return;
	kit.version = VERSION;

	// ---------------------------------------------------------------- art --

	const HAIR = {
		pink: { base: "#f6a5c8", shade: "#d9729f", eye: "#7b4fd8" },
		midnight: { base: "#343a60", shade: "#1d2140", eye: "#e0506f" },
		silver: { base: "#e4e7ef", shade: "#aab3c6", eye: "#3f8fd9" },
		chestnut: { base: "#9a5d3c", shade: "#6b3d24", eye: "#3aa36f" },
		mint: { base: "#8adfcb", shade: "#4fb29c", eye: "#d9567a" },
		honey: { base: "#f5cb62", shade: "#cf9c2c", eye: "#4a6fdc" },
	};
	const INK = "#3b2b33";
	const SKIN = "#ffe6d8";
	const NAVY = "#33508f";
	const RED = "#e2525f";

	function node(doc, tag, attrs, parent) {
		const n = doc.createElementNS(NS, tag);
		for (const k in attrs) n.setAttribute(k, String(attrs[k]));
		if (parent) parent.appendChild(n);
		return n;
	}

	/** Builds her SVG (viewBox 48x64, feet at the bottom centre) and returns the movable parts. */
	function createSvg(doc, hairName) {
		const h = HAIR[hairName] || HAIR.pink;
		const ln = (a) => Object.assign({ stroke: INK, "stroke-width": 1.1, "stroke-linejoin": "round", "stroke-linecap": "round" }, a);
		const svg = node(doc, "svg", { viewBox: "0 0 48 64", width: "100%", height: "100%", overflow: "visible", "aria-hidden": "true" });
		const rig = node(doc, "g", {}, svg);
		const p = { svg, rig };

		// Twin tails, behind everything; they swing and fly up when she falls.
		p.tails = node(doc, "g", {}, rig);
		p.tailL = node(doc, "g", {}, p.tails);
		node(doc, "path", ln({ d: "M11 13 C3 16 1.5 30 6 41 C8.5 34 12.5 24 13.5 15 Z", fill: h.base }), p.tailL);
		node(doc, "path", { d: "M9 18 C6 24 5.5 31 6.5 37", fill: "none", stroke: h.shade, "stroke-width": 1 }, p.tailL);
		p.tailR = node(doc, "g", {}, p.tails);
		node(doc, "path", ln({ d: "M37 13 C45 16 46.5 30 42 41 C39.5 34 35.5 24 34.5 15 Z", fill: h.base }), p.tailR);
		node(doc, "path", { d: "M39 18 C42 24 42.5 31 41.5 37", fill: "none", stroke: h.shade, "stroke-width": 1 }, p.tailR);

		// Legs (pivot at the hips).
		const leg = (x) => {
			const g = node(doc, "g", {}, rig);
			node(doc, "rect", ln({ x: x - 1.7, y: 49, width: 3.4, height: 9, rx: 1.5, fill: SKIN }), g);
			node(doc, "rect", ln({ x: x - 1.8, y: 55.5, width: 3.6, height: 5.5, rx: 1.2, fill: "#ffffff" }), g);
			node(doc, "ellipse", ln({ cx: x + 0.9, cy: 61.8, rx: 3, ry: 1.9, fill: "#6a4232" }), g);
			return g;
		};
		p.legL = leg(21);
		p.legR = leg(27);

		// Body: neck, sailor shirt, collar and bow, pleated skirt.
		p.body = node(doc, "g", {}, rig);
		node(doc, "rect", { x: 22.4, y: 30, width: 3.2, height: 5, fill: SKIN }, p.body);
		node(doc, "path", ln({ d: "M16 44 L32 44 L35.5 53 Q24 55.5 12.5 53 Z", fill: NAVY }), p.body);
		node(doc, "path", { d: "M20 45 L18.5 53.5 M24 45 L24 54.5 M28 45 L29.5 53.5", stroke: "#24396b", "stroke-width": 0.8, fill: "none" }, p.body);
		node(doc, "path", ln({ d: "M18.5 34 L29.5 34 L31.5 45.5 L16.5 45.5 Z", fill: "#ffffff" }), p.body);
		node(doc, "path", ln({ d: "M18.3 34 L24 39.5 L29.7 34 L31.2 37.2 L24 42.5 L16.8 37.2 Z", fill: NAVY }), p.body);
		node(doc, "path", ln({ d: "M24 40.5 L20.2 38.4 L20.6 42.6 Z M24 40.5 L27.8 38.4 L27.4 42.6 Z", fill: RED }), p.body);
		node(doc, "circle", ln({ cx: 24, cy: 40.5, r: 1.2, fill: RED }), p.body);

		// Head: back hair, face, eyes, mouth, bangs, ribbon and a cowlick.
		p.head = node(doc, "g", {}, rig);
		node(doc, "path", ln({ d: "M10 20 Q8.5 31 12.5 33.5 L35.5 33.5 Q39.5 31 38 20 Z", fill: h.base }), p.head);
		node(doc, "circle", ln({ cx: 24, cy: 18.5, r: 14, fill: h.base }), p.head);
		node(doc, "circle", { cx: 11, cy: 13.5, r: 1.9, fill: RED, stroke: INK, "stroke-width": 0.9 }, p.head);
		node(doc, "circle", { cx: 37, cy: 13.5, r: 1.9, fill: RED, stroke: INK, "stroke-width": 0.9 }, p.head);
		node(doc, "ellipse", ln({ cx: 24, cy: 21, rx: 11.5, ry: 11, fill: SKIN }), p.head);
		node(doc, "ellipse", { cx: 17.2, cy: 27, rx: 2, ry: 1.1, fill: "#ff9db1", opacity: 0.65 }, p.head);
		node(doc, "ellipse", { cx: 30.8, cy: 27, rx: 2, ry: 1.1, fill: "#ff9db1", opacity: 0.65 }, p.head);

		p.eyes = {};
		p.eyes.open = node(doc, "g", {}, p.head);
		p.pupils = node(doc, "g", {}, p.eyes.open);
		for (const x of [19.4, 28.6]) {
			node(doc, "ellipse", { cx: x, cy: 23, rx: 2.5, ry: 3.3, fill: INK }, p.pupils);
			node(doc, "ellipse", { cx: x, cy: 24, rx: 1.9, ry: 2.1, fill: h.eye }, p.pupils);
			node(doc, "circle", { cx: x - 0.8, cy: 21.8, r: 1, fill: "#ffffff" }, p.pupils);
			node(doc, "circle", { cx: x + 0.9, cy: 24.9, r: 0.45, fill: "#ffffff" }, p.pupils);
			node(doc, "path", { d: `M${x - 3} 20.4 Q${x} 18.6 ${x + 3} 20.4`, stroke: INK, "stroke-width": 1.3, fill: "none", "stroke-linecap": "round" }, p.eyes.open);
		}
		const eyeLines = (d) => node(doc, "path", { d, stroke: INK, "stroke-width": 1.2, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round", display: "none" }, p.head);
		p.eyes.closed = eyeLines("M16.9 23.4 Q19.4 25.4 21.9 23.4 M26.1 23.4 Q28.6 25.4 31.1 23.4");
		p.eyes.happy = eyeLines("M16.9 24.4 Q19.4 21.2 21.9 24.4 M26.1 24.4 Q28.6 21.2 31.1 24.4");
		p.eyes.x = eyeLines("M17.6 21.4 L21.2 25 M21.2 21.4 L17.6 25 M26.8 21.4 L30.4 25 M30.4 21.4 L26.8 25");
		p.eyes.wide = node(doc, "g", { display: "none" }, p.head);
		for (const x of [19.4, 28.6]) {
			node(doc, "ellipse", { cx: x, cy: 23, rx: 2.6, ry: 3.4, fill: "#ffffff", stroke: INK, "stroke-width": 1.1 }, p.eyes.wide);
			node(doc, "circle", { cx: x, cy: 23.2, r: 1.1, fill: INK }, p.eyes.wide);
		}

		p.mouth = {};
		p.mouth.smile = node(doc, "path", { d: "M22.4 28.2 Q24 29.6 25.6 28.2", stroke: INK, "stroke-width": 1, fill: "none", "stroke-linecap": "round" }, p.head);
		p.mouth.open = node(doc, "ellipse", { cx: 24, cy: 28.8, rx: 1.3, ry: 1.6, fill: "#c2475e", stroke: INK, "stroke-width": 0.8, display: "none" }, p.head);
		p.mouth.wavy = node(doc, "path", { d: "M21.8 28.8 q1.1 -1.1 2.2 0 q1.1 1.1 2.2 0", stroke: INK, "stroke-width": 1, fill: "none", "stroke-linecap": "round", display: "none" }, p.head);
		p.mouth.cat = node(doc, "path", { d: "M22 28 Q23 29.4 24 28 Q25 29.4 26 28", stroke: INK, "stroke-width": 1, fill: "none", "stroke-linecap": "round", display: "none" }, p.head);

		node(doc, "path", ln({ d: "M10.5 20 Q11 6.5 24 5.5 Q37 6.5 37.5 20 L34.6 15.2 L31.6 19.6 L28.6 12.8 L24.6 18 L20.6 12.8 L17.2 19.6 L14 15.2 Z", fill: h.base }), p.head);
		node(doc, "path", { d: "M15 12 Q19 8.5 23 9", stroke: "#ffffff", "stroke-width": 1, opacity: 0.55, fill: "none", "stroke-linecap": "round" }, p.head);
		node(doc, "path", ln({ d: "M24 5.8 Q26.5 0.5 29.5 2.2 Q26.5 2.6 25.4 6", fill: h.base }), p.head);
		const bow = node(doc, "g", {}, p.head);
		node(doc, "path", ln({ d: "M33 8 L29.6 5 L29.4 10.4 Z M33 8 L36.6 5.4 L36.4 10.8 Z", fill: RED }), bow);
		node(doc, "circle", ln({ cx: 33, cy: 8, r: 1.3, fill: RED }), bow);
		// Arms (pivot at the shoulders), in front of the head so raised hands show.
		const arm = (x) => {
			const g = node(doc, "g", {}, rig);
			node(doc, "rect", ln({ x: x - 1.5, y: 35.5, width: 3, height: 9.5, rx: 1.4, fill: SKIN }), g);
			node(doc, "rect", ln({ x: x - 2, y: 34.5, width: 4, height: 4.5, rx: 1.6, fill: "#ffffff" }), g);
			node(doc, "circle", ln({ cx: x, cy: 45.6, r: 1.8, fill: SKIN }), g);
			return g;
		};
		p.armL = arm(18.5);
		p.armR = arm(29.5);

		return p;
	}

	const PIVOT = { legL: [21, 49.5], legR: [27, 49.5], armL: [18.5, 35.8], armR: [29.5, 35.8], tailL: [11, 13.5], tailR: [37, 13.5] };

	/** Poses the parts. Angles in degrees; 0 = hanging down, -90 = pointing forward (towards where she faces). */
	function applyPose(p, q) {
		for (const k of ["legL", "legR", "armL", "armR", "tailL", "tailR"]) {
			const [px, py] = PIVOT[k];
			p[k].setAttribute("transform", `rotate(${(q[k] || 0).toFixed(1)} ${px} ${py})`);
		}
		const tilt = `rotate(${(q.headTilt || 0).toFixed(1)} 24 33)`;
		p.head.setAttribute("transform", tilt);
		p.tails.setAttribute("transform", tilt);
		const sx = q.sx || 1, sy = q.sy || 1;
		p.rig.setAttribute("transform", `translate(${(q.dx || 0).toFixed(2)} ${(q.bob || 0).toFixed(2)}) translate(24 64) rotate(${(q.rot || 0).toFixed(1)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-24 -64)`);
		for (const k in p.eyes) p.eyes[k].setAttribute("display", k === (q.eyes || "open") ? "inline" : "none");
		for (const k in p.mouth) p.mouth[k].setAttribute("display", k === (q.mouth || "smile") ? "inline" : "none");
		p.pupils.setAttribute("transform", `translate(${(q.lookX || 0).toFixed(2)} ${(q.lookY || 0).toFixed(2)})`);
	}

	kit.createSvg = createSvg;
	kit.applyPose = applyPose;

	// ------------------------------------------------------------- engine --

	const BASE_SELECTORS = ['section.pane', '.card', 'iframe.module', 'dialog[open]', '[role="dialog"]', '[role="alertdialog"]'];

	const LINES = {
		hello: ["Hi! {name} reporting for duty!", "{name} is here~", "Hello again!", "Let's do some bookkeeping!"],
		newWindow: ["Ooh, a new window!", "What's this?", "A new one!", "Let me see~"],
		vanish: ["Eek!", "Waaah!", "Hey!!", "Nooo\u2014"],
		ouch: ["Ow ow ow\u2026", "That hurt\u2026", "Rude\u2026", "I'm okay!"],
		typing: ["Tap tap tap\u2026", "Busy busy!", "So many numbers\u2026", "Don't forget to save~", "You type so fast!"],
		poke: ["Hehe!", "That tickles!", "Hm?", "Yes?"],
		wave: ["Hi!", "Hello~", "Hey there!", "Psst!"],
		curious: ["What's this?", "Poke poke", "Hmm\u2026", "Ooh, a button"],
		throwLand: ["Again! Again!", "Wheee!", "Dizzy\u2026"],
		wake: ["Huh? I'm awake!", "Five more minutes\u2026", "Oh! You're back!"],
		hang: ["High up here!", "Don't look down\u2026", "I can see everything!"],
		drop: ["Wheee!", "Here I go!", "Catch me!"],
		edge: ["Nice view~", "\u266a", "La la la~"],
		scroll: ["Whoa!", "Hold still!", "Woah woah"],
		bye: ["Bye bye!", "See you later!"],
	};

	const pick = (a) => a[Math.floor(Math.random() * a.length)];
	const rnd = (a, b) => a + Math.random() * (b - a);
	const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

	function start(rawCfg) {
		if (window.__deskBuddy && window.__deskBuddy.alive) {
			window.__deskBuddy.configure(rawCfg);
			return window.__deskBuddy;
		}
		const W = window;
		const doc = W.document;
		let cfg = normalize(rawCfg);

		// ---- DOM: an overlay that ignores the pointer, except on her.
		const style = doc.createElement("style");
		style.textContent = `
.ldb-root{position:fixed;inset:0;pointer-events:none;z-index:2147483000;overflow:hidden;contain:strict}
.ldb-sprite{position:absolute;left:0;top:0;pointer-events:auto;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;transform-origin:50% 100%}
.ldb-sprite:active{cursor:grabbing}
.ldb-sprite svg{display:block;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.25))}
.ldb-bubble{position:absolute;left:0;top:0;max-width:180px;padding:4px 9px;border-radius:10px;font:600 12px/1.3 system-ui,sans-serif;background:#fff;color:#1d232b;border:1px solid #dde1e6;box-shadow:0 2px 6px rgba(0,0,0,.15);white-space:nowrap;opacity:0;transition:opacity .15s;pointer-events:none}
.ldb-bubble.show{opacity:1}
.ldb-bubble::after{content:"";position:absolute;left:50%;bottom:-5px;width:8px;height:8px;margin-left:-4px;background:inherit;border-right:1px solid #dde1e6;border-bottom:1px solid #dde1e6;transform:rotate(45deg)}
.ldb-fx{position:absolute;left:0;top:0;font:700 13px/1 system-ui,sans-serif;color:#f2b632;pointer-events:none;text-shadow:0 1px 1px rgba(0,0,0,.3);display:none}
.ldb-fx.zz{color:#7b8fd8}.ldb-fx.heart{color:#ff6b8f}
@media (prefers-color-scheme: dark){.ldb-bubble{background:#232933;color:#e3e7ec;border-color:#3a434e}.ldb-bubble::after{border-color:#3a434e}}
@media (prefers-reduced-motion: reduce){.ldb-bubble{transition:none}}`;
		const root = doc.createElement("div");
		root.className = "ldb-root";
		root.setAttribute("aria-hidden", "true");
		const sprite = doc.createElement("div");
		sprite.className = "ldb-sprite";
		sprite.title = "";
		const bubble = doc.createElement("div");
		bubble.className = "ldb-bubble";
		const fx = doc.createElement("div");
		fx.className = "ldb-fx";
		root.append(sprite, fx, bubble);
		let parts = null;
		function build() {
			sprite.replaceChildren();
			parts = createSvg(doc, cfg.hair);
			sprite.appendChild(parts.svg);
			sprite.title = `${cfg.name} (drag me!)`;
		}
		build();
		function mount() {
			if (!style.isConnected) (doc.head || doc.documentElement).appendChild(style);
			if (!root.isConnected) doc.body.appendChild(root);
		}
		mount();

		// ---- sizes (all in screen pixels)
		let S, H, SW, HALF, REACH, JUMPX, WALK, CLIMB;
		const G = 2000;
		function sizes() {
			S = cfg.size / 64;
			H = cfg.size;
			SW = 48 * S;
			HALF = 15 * S;
			REACH = H * 2.4;
			JUMPX = H * 2.2;
			const e = cfg.energy === "calm" ? 0.75 : cfg.energy === "hyper" ? 1.4 : 1;
			WALK = 62 * S * e;
			CLIMB = 46 * S * e;
			sprite.style.width = SW + "px";
			sprite.style.height = H + "px";
		}
		sizes();
		let vw = W.innerWidth, vh = W.innerHeight;

		// ---- the world: windows she can climb
		/** @type {{el: Element, frames: HTMLIFrameElement[], key: string, firstSeen: number}[]} */
		let boxes = [];
		let known = new WeakSet();
		const watchedWindows = new WeakSet();
		let firstScan = true;
		const FLOOR = { floor: true };
		const SCREEN_L = { screen: "L" };
		const SCREEN_R = { screen: "R" };

		function selectors() {
			const extra = cfg.extraWindows.split(",").map((s) => s.trim()).filter(Boolean);
			const ok = [];
			for (const s of BASE_SELECTORS.concat(extra)) {
				try {
					doc.querySelector(s);
					ok.push(s);
				} catch {
					/* invalid selector from settings: skip it */
				}
			}
			return ok.join(",");
		}
		let SEL = selectors();

		function scan() {
			mount();
			const found = [];
			const fresh = [];
			const visit = (d, frames, depth) => {
				let list;
				try {
					list = d.querySelectorAll(SEL);
				} catch {
					return;
				}
				for (const el of list) {
					if (root.contains(el)) continue;
					const b = { el, frames, firstSeen: performance.now() };
					found.push(b);
					if (!known.has(el)) {
						known.add(el);
						fresh.push(b);
					}
				}
				if (depth >= 2) return;
				for (const f of d.querySelectorAll("iframe")) {
					let inner;
					try {
						inner = f.contentDocument;
					} catch {
						continue;
					}
					if (!inner || !inner.body) continue;
					watchWindow(f.contentWindow, frames.concat([f]));
					visit(inner, frames.concat([f]), depth + 1);
				}
			};
			visit(doc, [], 0);
			const prev = new Map(boxes.map((b) => [b.el, b]));
			boxes = found.map((b) => prev.get(b.el) || b);
			if (!firstScan) {
				for (const b of fresh) {
					const r = rectOf(b);
					if (r && (r.right - r.left) * (r.bottom - r.top) > 30000) onNewWindow(b);
				}
			}
			firstScan = false;
		}

		/** The box's rectangle in this window's viewport, clipped by the frames it's inside; null if it's gone. */
		function rectOf(b) {
			if (b === FLOOR) return { left: -1e5, right: 1e5, top: vh, bottom: vh + 1e5 };
			if (b === SCREEN_L) return { left: -40, right: 0, top: -1e5, bottom: vh };
			if (b === SCREEN_R) return { left: vw, right: vw + 40, top: -1e5, bottom: vh };
			if (!b.el.isConnected) return null;
			let r = b.el.getBoundingClientRect();
			if (r.width < 60 || r.height < 30) return null;
			let left = r.left, top = r.top, right = r.right, bottom = r.bottom;
			for (let i = b.frames.length - 1; i >= 0; i--) {
				const f = b.frames[i];
				if (!f.isConnected) return null;
				const fr = f.getBoundingClientRect();
				const ox = fr.left + f.clientLeft, oy = fr.top + f.clientTop;
				left = Math.max(left + ox, ox);
				top = Math.max(top + oy, oy);
				right = Math.min(right + ox, ox + f.clientWidth);
				bottom = Math.min(bottom + oy, oy + f.clientHeight);
				if (right - left < 40 || bottom - top < 20) return null;
			}
			if (right < 0 || left > vw || bottom < 0 || top > vh) return null;
			return { left, top, right, bottom };
		}
		const topUsable = (r) => r.top >= H * 0.9 && r.top <= vh - 6;

		// ---- input: cursor, typing, clicks, scrolling (also inside same-origin frames)
		const input = { x: -1, y: -1, t: 0, active: performance.now(), keys: [], downAt: 0, downX: 0, downY: 0 };
		function offsetOf(frames) {
			let ox = 0, oy = 0;
			for (const f of frames) {
				if (!f.isConnected) return null;
				const fr = f.getBoundingClientRect();
				ox += fr.left + f.clientLeft;
				oy += fr.top + f.clientTop;
			}
			return [ox, oy];
		}
		const listeners = [];
		function on(target, type, fn, opts) {
			target.addEventListener(type, fn, opts);
			listeners.push([target, type, fn, opts]);
		}
		function watchWindow(w, frames) {
			if (!w || watchedWindows.has(w)) return;
			watchedWindows.add(w);
			const map = (e) => {
				const o = offsetOf(frames);
				return o ? [e.clientX + o[0], e.clientY + o[1]] : null;
			};
			on(w, "pointermove", (e) => {
				const p = map(e);
				if (!p) return;
				input.x = p[0];
				input.y = p[1];
				input.t = performance.now();
				activity();
			}, { passive: true, capture: true });
			on(w, "pointerdown", (e) => {
				if (e.target === sprite || sprite.contains(e.target)) return;
				const p = map(e);
				if (p) onClickNear(p[0], p[1]);
				activity();
			}, { passive: true, capture: true });
			on(w, "keydown", () => {
				const now = performance.now();
				input.keys.push(now);
				while (input.keys.length && now - input.keys[0] > 3000) input.keys.shift();
				activity();
			}, { passive: true, capture: true });
			on(w, "wheel", () => activity(), { passive: true, capture: true });
		}
		watchWindow(W, []);
		on(W, "resize", () => {
			vw = W.innerWidth;
			vh = W.innerHeight;
		});

		// ---- her state
		const st = {
			x: clamp(vw * rnd(0.55, 0.85), 40, vw - 40),
			y: -H * 0.2,
			vx: 0,
			vy: 0,
			face: Math.random() < 0.5 ? -1 : 1,
			mode: "fall",
			t: 0, // time in the current mode
			dur: 0, // how long the current mode lasts (when it times out)
			ground: null, // box she stands on
			wall: null, // { b, side: "L"|"R" } she climbs; side = which side of the box she is on
			plan: null, // what she's walking towards
			why: "", // why she's falling ("vanish", "throw", "drop")
			fallFrom: 0,
			sat: null, // "edge" | "floor"
			lastSay: -1e9,
			blinkAt: 2,
			blink: 0,
			fxKind: "",
			nearSince: 0,
			lastWave: -1e9,
			lastHop: -1e9,
			lastTypingLine: -1e9,
			drag: null,
			lastGroundTop: null,
		};
		let clock = 0;
		const decisionGap = () => (cfg.energy === "calm" ? rnd(4, 9) : cfg.energy === "hyper" ? rnd(1, 3) : rnd(2.2, 5.5));

		// ---- speech
		let bubbleUntil = 0;
		// prio 1: skip the rate limit (important moments); prio 2: also when speech is off.
		function say(text, secs, prio) {
			if (!cfg.speech && (prio || 0) < 2) return;
			if (!prio && clock - st.lastSay < 2.5) return;
			st.lastSay = clock;
			bubble.textContent = String(text).replace("{name}", cfg.name);
			bubble.classList.add("show");
			bubbleUntil = clock + (secs || 2.6);
		}
		const sayFrom = (k, secs, prio) => say(pick(LINES[k]), secs, prio);

		// ---- modes
		function setMode(m, dur) {
			st.mode = m;
			st.t = 0;
			st.dur = dur == null ? decisionGap() : dur;
			if (m !== "sit" && m !== "sleep") st.sat = null;
		}
		const grounded = () => ["idle", "walk", "sit", "sleep", "wave", "poke", "watch", "land", "ouch", "peek", "look"].includes(st.mode);
		const calm = () => ["idle", "walk", "sit", "watch", "look"].includes(st.mode);

		function fall(why, vx, vy) {
			st.ground = null;
			st.wall = null;
			st.plan = null;
			st.why = why || "";
			st.vx = vx || 0;
			st.vy = vy || 0;
			st.fallFrom = st.y;
			setMode("fall", 99);
			if (why === "vanish") sayFrom("vanish", 1.6, 1);
		}

		function land(b, r) {
			const speed = st.vy;
			st.y = r.top;
			st.vy = 0;
			st.vx = 0;
			st.ground = b;
			st.lastGroundTop = r.top;
			const hard = speed > Math.sqrt(2 * G * H * 3.2) || (st.why === "vanish" && st.y - st.fallFrom > H * 1.5);
			if (hard) {
				setMode("ouch", 2.6);
				if (st.why === "throw") sayFrom("throwLand", 2.2, 1);
				else sayFrom("ouch", 2.2, 1);
			} else {
				setMode("land", 0.28);
			}
			st.why = "";
		}

		/** Launches a jump that lands at (tx, ty) or, with grab, catches a wall at that point. */
		function jumpTo(tx, ty, grab) {
			const apex = Math.min(st.y, ty) - H * 0.45;
			const up = Math.max(1, st.y - apex);
			const down = Math.max(1, ty - apex);
			const vy0 = -Math.sqrt(2 * G * up);
			const T = -vy0 / G + Math.sqrt((2 * down) / G);
			st.vx = (tx - st.x) / T;
			st.vy = vy0;
			st.face = tx >= st.x ? 1 : -1;
			st.ground = null;
			st.jump = { tx, ty, grab, T };
			st.why = "";
			setMode("jump", 99);
		}

		// ---- reactions
		function onNewWindow(b) {
			if (!calm() && st.mode !== "sleep") return;
			if (st.mode === "sleep") return;
			if (Math.random() < 0.25) return;
			const opt = climbOptions().find((o) => o.b === b) || hopOptions().find((o) => o.b === b);
			sayFrom("newWindow", 2);
			if (opt) {
				st.plan = opt;
				setMode("look", 0.7);
			}
		}
		function onClickNear(x, y) {
			const cx = st.x, cy = st.y - H * 0.5;
			if (Math.hypot(x - cx, y - cy) < H * 0.9 && grounded() && st.mode !== "sleep" && clock - st.lastHop > 4) {
				st.lastHop = clock;
				st.face = x >= st.x ? 1 : -1;
				say("!", 1, false);
				const g = st.ground;
				const r = g && rectOf(g);
				if (r) jumpTo(st.x, r.top, null);
			}
		}
		function activity() {
			const now = performance.now();
			const wasAsleep = st.mode === "sleep";
			input.active = now;
			if (wasAsleep) {
				st.fxKind = "";
				setMode("wave", 1.4);
				sayFrom("wake", 2);
			}
		}

		// ---- planning: where can she go from here?
		function groundSpan() {
			const r = st.ground && rectOf(st.ground);
			if (!r) return null;
			return { left: Math.max(r.left, 0) + HALF * 0.6, right: Math.min(r.right, vw) - HALF * 0.6, top: r.top };
		}
		function climbOptions() {
			const g = groundSpan();
			if (!g) return [];
			const out = [];
			const all = boxes.concat(st.ground === FLOOR ? [SCREEN_L, SCREEN_R] : []);
			for (const b of all) {
				if (b === st.ground) continue;
				const r = rectOf(b);
				if (!r || r.top > st.y - H * 0.7) continue;
				const lowEnd = Math.min(r.bottom, vh);
				if (lowEnd < st.y - REACH) continue;
				for (const side of b.screen ? [b.screen === "L" ? "R" : "L"] : ["L", "R"]) {
					const wx = side === "L" ? r.left - HALF * 0.7 : r.right + HALF * 0.7;
					if (wx < HALF * 0.5 || wx > vw - HALF * 0.5) continue;
					if (wx < g.left - HALF * 2 || wx > g.right + HALF * 2) continue;
					out.push({ kind: "climb", b, side, x: wx, dist: Math.abs(wx - st.x) });
				}
			}
			return out;
		}
		function hopOptions() {
			const g = groundSpan();
			if (!g) return [];
			const out = [];
			for (const b of boxes) {
				if (b === st.ground) continue;
				const r = rectOf(b);
				if (!r || !topUsable(r) || r.top > st.y - H * 0.3 || r.top < st.y - REACH) continue;
				if (r.right - r.left < HALF * 3) continue;
				let from, to;
				if (st.x < r.left) {
					from = Math.max(g.left, r.left - HALF * 1.6);
					to = r.left + HALF * 1.2;
				} else if (st.x > r.right) {
					from = Math.min(g.right, r.right + HALF * 1.6);
					to = r.right - HALF * 1.2;
				} else {
					from = clamp(st.x, g.left, g.right);
					to = clamp(from, r.left + HALF, r.right - HALF);
				}
				if (Math.abs(to - from) > JUMPX) continue;
				out.push({ kind: "hop", b, x: from, to, dist: Math.abs(from - st.x) });
			}
			return out;
		}

		function decide() {
			const g = groundSpan();
			if (!g) return fall("");
			const onBox = st.ground !== FLOOR;
			const hyper = cfg.energy === "hyper", lazy = cfg.energy === "calm";
			const options = [];
			const add = (w, fn) => w > 0 && options.push([w, fn]);
			add(3, () => {
				st.plan = { kind: "walk", x: rnd(g.left, g.right) };
				setMode("walk", 30);
			});
			add(lazy ? 3 : 1.5, () => {
				setMode("sit", rnd(4, 10));
				st.sat = onBox && Math.random() < 0.6 ? "edge" : "floor";
				if (st.sat === "edge") {
					st.plan = { kind: "edge" };
					setMode("walk", 30);
				}
			});
			add(1, () => setMode("look", rnd(1.5, 3)));
			const climbs = climbOptions();
			const hops = hopOptions();
			add(climbs.length ? (hyper ? 5 : lazy ? 0.6 : 2.5) : 0, () => {
				climbs.sort((a, b) => a.dist - b.dist);
				st.plan = Math.random() < 0.6 ? climbs[0] : pick(climbs);
				setMode("walk", 30);
			});
			add(hops.length ? (hyper ? 4 : lazy ? 0.5 : 2) : 0, () => {
				st.plan = pick(hops);
				setMode("walk", 30);
			});
			add(onBox ? (hyper ? 2 : 1) : 0, () => {
				st.plan = { kind: "hopdown", dir: Math.random() < 0.5 ? -1 : 1 };
				setMode("walk", 30);
			});
			add(!onBox ? (hyper ? 0.6 : 1) : 0, () => setMode("peek", rnd(3, 5)));
			const cursorRecent = performance.now() - input.t < 4000 && input.x >= 0;
			add(cursorRecent ? 1.5 : 0, () => {
				st.plan = { kind: "curious", x: clamp(input.x - st.face * HALF, g.left, g.right) };
				setMode("walk", 30);
			});
			let total = options.reduce((s, o) => s + o[0], 0);
			let r = Math.random() * total;
			for (const [w, fn] of options) {
				if ((r -= w) <= 0) return fn();
			}
		}

		/** Walk towards the plan's x; true when she's there. */
		function walkTowards(tx, dt) {
			const g = groundSpan();
			if (g) tx = clamp(tx, g.left, g.right);
			const d = tx - st.x;
			if (Math.abs(d) < 2) return true;
			st.face = d > 0 ? 1 : -1;
			st.x += Math.sign(d) * Math.min(Math.abs(d), WALK * dt);
			return false;
		}

		function arrive() {
			const p = st.plan;
			st.plan = null;
			if (!p) return setMode("idle");
			if (p.kind === "climb") {
				const r = rectOf(p.b);
				if (!r) return setMode("idle");
				st.face = p.side === "L" ? 1 : -1;
				const lowEnd = Math.min(r.bottom, vh);
				if (Math.abs(st.x - p.x) > HALF * 0.8) {
					jumpTo(p.x, Math.min(st.y, lowEnd + H * 0.3), { b: p.b, side: p.side });
				} else if (lowEnd >= st.y - H * 0.35) {
					st.wall = { b: p.b, side: p.side };
					st.ground = null;
					setMode("climb", 99);
				} else {
					jumpTo(p.x, lowEnd + H * 0.3, { b: p.b, side: p.side });
				}
			} else if (p.kind === "hop") {
				const r = rectOf(p.b);
				if (!r || !topUsable(r)) return setMode("idle");
				jumpTo(clamp(p.to, r.left + HALF, r.right - HALF), r.top, null);
			} else if (p.kind === "hopdown") {
				st.face = p.dir;
				fall("drop", p.dir * WALK * 2.2, -Math.sqrt(2 * G * H * 0.5));
				setMode("jump", 99);
				st.jump = null;
			} else if (p.kind === "edge") {
				st.face = -st.face;
				setMode("sit", rnd(5, 12));
				st.sat = "edge";
				if (Math.random() < 0.4) sayFrom("edge", 2);
			} else if (p.kind === "curious") {
				const near = Math.abs(input.y - (st.y - H * 0.55)) < H * 0.8 && Math.abs(input.x - st.x) < H;
				st.face = input.x >= st.x ? 1 : -1;
				setMode(near ? "poke" : "look", near ? 1.6 : 2);
				if (Math.random() < 0.5) sayFrom("curious", 1.8);
			} else {
				setMode("idle");
			}
		}

		// ---- dragging her around
		on(sprite, "pointerdown", (e) => {
			if (e.button !== 0) return;
			e.preventDefault();
			try {
				sprite.setPointerCapture(e.pointerId);
			} catch {
				/* ignore */
			}
			st.drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false, lx: e.clientX, ly: e.clientY, lt: performance.now(), vx: 0, vy: 0, at: clock };
			activity();
		});
		on(sprite, "pointermove", (e) => {
			const d = st.drag;
			if (!d || e.pointerId !== d.id) return;
			if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 5) return;
			if (!d.moved) {
				d.moved = true;
				st.ground = null;
				st.wall = null;
				st.plan = null;
				st.fxKind = "";
				setMode("drag", 99);
				say(pick(["Waah!", "Put me down!", "Hey!", "Wheee?"]), 1.5);
			}
			const now = performance.now();
			const dt = Math.max(1, now - d.lt) / 1000;
			d.vx = d.vx * 0.5 + ((e.clientX - d.lx) / dt) * 0.5;
			d.vy = d.vy * 0.5 + ((e.clientY - d.ly) / dt) * 0.5;
			d.lx = e.clientX;
			d.ly = e.clientY;
			d.lt = now;
			st.x = e.clientX;
			st.y = e.clientY + H * 0.62;
		});
		const release = (e) => {
			const d = st.drag;
			if (!d || e.pointerId !== d.id) return;
			st.drag = null;
			if (d.moved) {
				const fresh = performance.now() - d.lt < 80;
				fall("throw", fresh ? clamp(d.vx, -2200, 2200) : 0, fresh ? clamp(d.vy, -2200, 2200) : 0);
			} else if (grounded()) {
				const dbl = clock - (st.lastTap || -9) < 0.4;
				st.lastTap = clock;
				if (dbl) {
					st.fxKind = "heart";
					setMode("wave", 1.6);
					say("\u2665", 1.6, false);
				} else {
					setMode("poked", 1.1);
					sayFrom("poke", 1.6);
				}
			}
		};
		on(sprite, "pointerup", release);
		on(sprite, "pointercancel", release);
		on(sprite, "contextmenu", (e) => e.preventDefault());

		// ---- per-frame update
		function update(dt) {
			clock += dt;
			st.t += dt;
			const now = performance.now();
			if (bubbleUntil && clock > bubbleUntil) {
				bubble.classList.remove("show");
				bubbleUntil = 0;
			}

			// Stand on (and ride along with) the window under her.
			if (grounded() || st.mode === "poked") {
				const r = st.ground && rectOf(st.ground);
				const ok = r && (st.ground === FLOOR || topUsable(r)) && st.x >= r.left - HALF * 0.5 && st.x <= r.right + HALF * 0.5;
				if (!ok) {
					fall(st.ground !== FLOOR && (!r || !topUsable(r)) ? "vanish" : "");
				} else {
					if (st.lastGroundTop != null && Math.abs(r.top - st.lastGroundTop) > H * 0.5 && st.ground !== FLOOR) sayFrom("scroll", 1.2);
					st.y = r.top;
					st.lastGroundTop = r.top;
					st.x = clamp(st.x, HALF * 0.5, vw - HALF * 0.5);
				}
			}

			switch (st.mode) {
				case "idle":
				case "look":
					if (st.t > st.dur) {
						if (st.plan) setMode("walk", 30);
						else decide();
					}
					break;
				case "walk": {
					const p = st.plan;
					let tx;
					if (!p) {
						setMode("idle");
						break;
					}
					if (p.kind === "edge" || p.kind === "hopdown") {
						const g = groundSpan();
						if (!g) break;
						const dir = p.kind === "hopdown" ? p.dir : st.x - g.left < g.right - st.x ? -1 : 1;
						p.dir = dir;
						tx = dir < 0 ? g.left : g.right;
					} else tx = p.x;
					if (walkTowards(tx, dt)) arrive();
					break;
				}
				case "sit":
				case "watch":
				case "wave":
				case "poke":
				case "poked":
				case "land":
				case "peek":
					if (st.t > st.dur) {
						st.fxKind = "";
						setMode("idle", st.mode === "land" ? rnd(0.3, 1.2) : rnd(0.6, 2));
					}
					break;
				case "ouch":
					st.fxKind = "stars";
					if (st.t > st.dur) {
						st.fxKind = "";
						setMode("idle", 1);
					}
					break;
				case "sleep":
					st.fxKind = "zz";
					break;
				case "climb":
				case "hang": {
					const r = rectOf(st.wall.b);
					if (!r) {
						fall("vanish");
						break;
					}
					st.x = st.wall.side === "L" ? r.left - HALF * 0.7 : r.right + HALF * 0.7;
					st.face = st.wall.side === "L" ? 1 : -1;
					if (st.x < 0 || st.x > vw) {
						fall("vanish");
						break;
					}
					const lowEnd = Math.min(r.bottom, vh) + H * 0.6;
					if (st.y > lowEnd) {
						fall("");
						break;
					}
					if (st.mode === "climb") {
						st.y -= CLIMB * dt;
						if (topUsable(r) && !st.wall.b.screen) {
							if (st.y <= r.top + H * 0.15) {
								const inside = st.wall.side === "L" ? r.left + HALF * 1.1 : r.right - HALF * 1.1;
								st.ground = st.wall.b;
								st.wall = null;
								st.x = inside;
								st.y = r.top;
								st.lastGroundTop = r.top;
								setMode("land", 0.35);
							}
						} else {
							const stop = Math.max(r.top, 0) + H * 1.15;
							if (st.y <= stop) {
								st.y = stop;
								setMode("hang", rnd(2, 5));
								if (Math.random() < 0.5) sayFrom("hang", 2);
							}
						}
					} else if (st.t > st.dur) {
						sayFrom("drop", 1.4);
						fall("drop", -st.face * WALK * 1.5, -200);
					}
					break;
				}
				case "jump":
				case "fall": {
					const prevY = st.y;
					st.vy += G * dt;
					st.vy = Math.min(st.vy, 2600);
					st.x += st.vx * dt;
					st.y += st.vy * dt;
					if (st.x < HALF * 0.6) {
						st.x = HALF * 0.6;
						st.vx = Math.abs(st.vx) * 0.55;
					} else if (st.x > vw - HALF * 0.6) {
						st.x = vw - HALF * 0.6;
						st.vx = -Math.abs(st.vx) * 0.55;
					}
					if (st.y - H < -H * 3 && st.vy < 0) st.vy = 0;
					const j = st.jump;
					if (st.mode === "jump" && j && j.grab && st.vy > 0 && st.y >= j.ty - 4) {
						const r = rectOf(j.grab.b);
						if (r) {
							st.wall = j.grab;
							st.y = j.ty;
							st.vx = st.vy = 0;
							st.jump = null;
							setMode("climb", 99);
							break;
						}
					}
					if (st.vy > 0) {
						let best = null, bestTop = Infinity;
						for (const b of boxes) {
							const r = rectOf(b);
							if (!r || !topUsable(r)) continue;
							if (r.top >= prevY - 1 && r.top <= st.y && st.x >= r.left + 4 && st.x <= r.right - 4 && r.top < bestTop) {
								best = b;
								bestTop = r.top;
							}
						}
						if (best) land(best, rectOf(best));
						else if (st.y >= vh) land(FLOOR, rectOf(FLOOR));
						if (st.mode !== "jump" && st.mode !== "fall") st.jump = null;
					}
					break;
				}
				case "drag":
					break;
			}

			// Moods that interrupt calm moments.
			if (calm() && st.mode !== "watch") {
				if (now - input.active > cfg.sleepAfter * 1000) {
					st.plan = null;
					setMode("sleep", 1e9);
					say("*yawn*", 2);
				} else if (input.keys.length >= 6 && st.mode !== "walk") {
					setMode("watch", rnd(3, 6));
					if (clock - st.lastTypingLine > 25 && Math.random() < 0.5) {
						st.lastTypingLine = clock;
						sayFrom("typing", 2.4);
					}
				}
			}
			const near = input.x >= 0 && now - input.t < 1500 && Math.hypot(input.x - st.x, input.y - (st.y - H * 0.5)) < H * 1.3;
			if (near && calm()) {
				if (!st.nearSince) st.nearSince = clock;
				if (clock - st.nearSince > 1.2 && clock - st.lastWave > 20) {
					st.lastWave = clock;
					st.face = input.x >= st.x ? 1 : -1;
					setMode("wave", 1.5);
					sayFrom("wave", 1.6);
				}
			} else st.nearSince = 0;

			// Blinking.
			st.blinkAt -= dt;
			if (st.blinkAt <= 0) {
				st.blink = 0.13;
				st.blinkAt = rnd(2, 5.5);
			}
			if (st.blink > 0) st.blink -= dt;
		}

		// ---- drawing
		function pose() {
			const t = clock;
			const q = { eyes: st.blink > 0 ? "closed" : "open", mouth: "smile", bob: 0 };
			// Eyes follow the cursor (in her own facing frame).
			if (input.x >= 0 && performance.now() - input.t < 6000) {
				q.lookX = clamp(((input.x - st.x) / 160) * st.face, -1, 1) * 1.1;
				q.lookY = clamp((input.y - (st.y - H * 0.7)) / 180, -1, 1) * 0.9;
			} else {
				q.lookX = Math.sin(t * 0.7) * 0.6;
			}
			const breathe = Math.sin(t * 2.4) * 0.35;
			const sway = Math.sin(t * 1.7) * 6;
			q.tailL = 4 + sway * 0.6;
			q.tailR = -4 + sway * 0.6;
			switch (st.mode) {
				case "walk": {
					const ph = t * 9 * (WALK / (62 * S));
					q.legL = Math.sin(ph) * 26;
					q.legR = -Math.sin(ph) * 26;
					q.armL = -Math.sin(ph) * 22;
					q.armR = Math.sin(ph) * 22;
					q.bob = -Math.abs(Math.cos(ph)) * 1.4;
					q.tailL = q.tailR = 14 + Math.sin(ph * 2) * 5;
					q.lookX = 0.9;
					break;
				}
				case "climb":
				case "hang": {
					const ph = t * 6;
					const climbing = st.mode === "climb";
					q.armL = climbing ? 128 + Math.sin(ph) * 14 : 132;
					q.armR = climbing ? -128 + Math.sin(ph) * 14 : -132;
					q.legL = climbing ? -25 + Math.sin(ph) * 25 : Math.sin(t * 2.2) * 14;
					q.legR = climbing ? -10 - Math.sin(ph) * 25 : -Math.sin(t * 2.2) * 14;
					q.rot = climbing ? 6 : Math.sin(t * 2.2) * 4;
					q.lookX = climbing ? 1 : q.lookX;
					q.lookY = climbing ? -0.8 : q.lookY;
					q.dx = 2.5;
					if (!climbing) q.mouth = "cat";
					break;
				}
				case "jump":
				case "fall": {
					const flail = Math.sin(t * 22) * 18;
					const up = st.vy > 0;
					q.armL = 130 + flail;
					q.armR = -130 - flail;
					q.legL = 18 + (up ? flail * 0.6 : 0);
					q.legR = -18 - (up ? flail * 0.6 : 0);
					q.tailL = up ? 150 : 40;
					q.tailR = up ? -150 : -40;
					q.eyes = up && st.why === "vanish" ? "wide" : st.why === "throw" ? "happy" : "open";
					q.mouth = up ? "open" : "smile";
					q.rot = st.why === "throw" ? clamp(st.vx / 40, -25, 25) : 0;
					break;
				}
				case "drag": {
					const kick = Math.sin(t * 16) * 22;
					q.armL = 135;
					q.armR = -135;
					q.legL = kick;
					q.legR = -kick;
					q.tailL = 20 + kick * 0.3;
					q.tailR = -20 + kick * 0.3;
					q.eyes = "wide";
					q.mouth = "open";
					q.rot = clamp((st.drag ? st.drag.vx : 0) / -60, -30, 30);
					break;
				}
				case "land": {
					const k = 1 - clamp(st.t / Math.max(0.01, st.dur), 0, 1);
					q.sy = 1 - 0.22 * k;
					q.sx = 1 + 0.16 * k;
					q.armL = 25 * k;
					q.armR = -25 * k;
					break;
				}
				case "ouch":
				case "sit":
				case "sleep": {
					q.bob = 12;
					const edge = st.sat === "edge";
					const kick = edge ? Math.sin(t * 3) * 18 : Math.sin(t * 1.5) * 4;
					q.legL = edge ? kick : -84 + kick;
					q.legR = edge ? -kick : -80 - kick;
					q.armL = edge ? -10 : -35;
					q.armR = edge ? 10 : -25;
					if (st.mode === "ouch") {
						q.eyes = "x";
						q.mouth = "wavy";
						q.headTilt = Math.sin(t * 5) * 7;
						q.armR = -135;
						q.legL = -84;
						q.legR = -80;
					} else if (st.mode === "sleep") {
						q.eyes = "closed";
						q.mouth = "smile";
						q.headTilt = 12 + breathe * 3;
						q.bob = 12 + breathe;
						q.tailL = q.tailR = 0;
					} else {
						q.headTilt = Math.sin(t * 0.9) * 5;
						q.bob = 12 + breathe * 0.5;
					}
					break;
				}
				case "wave": {
					q.armR = -135 + Math.sin(t * 12) * 18;
					q.armL = 8;
					q.eyes = st.fxKind === "heart" ? "happy" : q.eyes;
					q.mouth = "open";
					q.headTilt = -6;
					q.bob = breathe;
					break;
				}
				case "poke": {
					const jab = (Math.sin(t * 10) + 1) / 2;
					q.armR = -95 + jab * 10;
					q.dx = jab * 1.2;
					q.armL = 10;
					q.lookX = 1.1;
					q.mouth = "cat";
					break;
				}
				case "poked": {
					q.eyes = "happy";
					q.mouth = "open";
					q.armL = 30;
					q.armR = -30;
					q.sy = 1 - Math.max(0, 0.08 - st.t * 0.2);
					q.headTilt = Math.sin(st.t * 14) * 6;
					break;
				}
				case "watch": {
					q.bob = 12;
					q.legL = -84;
					q.legR = -80;
					q.armL = -60;
					q.armR = -55;
					q.headTilt = Math.sin(t * 6) * 2;
					q.mouth = "cat";
					break;
				}
				case "peek": {
					const k = st.t < 0.5 ? st.t / 0.5 : st.t > st.dur - 0.4 ? clamp((st.dur - st.t) / 0.4, 0, 1) : 1;
					q.bob = k * 36;
					q.lookX = Math.sin(st.t * 2.2) * 1.1;
					q.armL = 128;
					q.armR = -128;
					q.mouth = "cat";
					break;
				}
				case "look":
					q.headTilt = Math.sin(t * 1.3) * 8;
					q.lookX = Math.sin(t * 1.1) * 1.1;
					q.armL = 6;
					q.armR = -6;
					break;
				default:
					q.bob = breathe;
					q.armL = 6 + breathe * 2;
					q.armR = -6 - breathe * 2;
			}
			return q;
		}

		function draw() {
			const q = pose();
			applyPose(parts, q);
			const left = st.x - SW / 2;
			const top = st.y - H;
			sprite.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0) scaleX(${st.face})`;
			// The peeking pose sinks below the bottom edge.
			if (bubble.classList.contains("show")) {
				const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
				const bx = clamp(st.x - bw / 2, 4, vw - bw - 4);
				const sitting = ["sit", "sleep", "ouch", "watch"].includes(st.mode);
				const by = clamp(top - bh - 6 + (sitting ? H * 0.18 : 0), 4, vh - bh - 4);
				bubble.style.transform = `translate3d(${bx.toFixed(1)}px, ${by.toFixed(1)}px, 0)`;
			}
			if (st.fxKind) {
				fx.style.display = "block";
				fx.className = "ldb-fx" + (st.fxKind === "zz" ? " zz" : st.fxKind === "heart" ? " heart" : "");
				let text, fxX, fxY;
				if (st.fxKind === "stars") {
					const a = clock * 6;
					text = "\u2605 \u2726 \u2605";
					fxX = st.x - 18 + Math.cos(a) * 6;
					fxY = top + H * 0.1 + Math.sin(a) * 3;
				} else if (st.fxKind === "zz") {
					const k = (clock * 0.6) % 1;
					text = k < 0.33 ? "z" : k < 0.66 ? "z Z" : "z Z z";
					fxX = st.x + st.face * SW * 0.25;
					fxY = top + H * 0.15 - k * 10;
				} else {
					const k = (clock * 0.9) % 1;
					text = "\u2665";
					fxX = st.x + Math.sin(clock * 5) * 6;
					fxY = top - k * 20;
				}
				if (fx.textContent !== text) fx.textContent = text;
				fx.style.transform = `translate3d(${fxX.toFixed(1)}px, ${fxY.toFixed(1)}px, 0)`;
			} else fx.style.display = "none";
		}

		// ---- the loop
		let raf = 0, last = 0, scanAt = 0, alive = true;
		function frame(ts) {
			if (!alive) return;
			raf = W.requestAnimationFrame(frame);
			const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016);
			last = ts;
			vw = W.innerWidth;
			vh = W.innerHeight;
			if (ts > scanAt) {
				scanAt = ts + 400;
				scan();
			}
			try {
				update(dt);
				draw();
			} catch (err) {
				// Never take Ledger down with her: reset to a safe state.
				console.warn("desk-buddy:", err);
				fall("");
			}
		}
		scan();
		raf = W.requestAnimationFrame(frame);
		setTimeout(() => say(pick(LINES.hello), 3), 900);

		const api = {
			alive: true,
			version: VERSION,
			get state() {
				return { mode: st.mode, x: Math.round(st.x), y: Math.round(st.y), face: st.face, onFloor: st.ground === FLOOR, climbing: !!st.wall, windows: boxes.length };
			},
			configure(c) {
				const before = cfg;
				cfg = normalize(c);
				SEL = selectors();
				known = new WeakSet();
				firstScan = true;
				if (before.hair !== cfg.hair) build();
				sizes();
			},
			say(text) {
				say(text, 3, 2);
			},
			/** Testing/debug helper: run a named action now. */
			act(name) {
				if (name === "climb") {
					const o = climbOptions();
					if (o.length) {
						st.plan = o.sort((a, b) => a.dist - b.dist)[0];
						setMode("walk", 30);
					}
					return o.length > 0;
				}
				if (name === "hop") {
					const o = hopOptions();
					if (o.length) {
						st.plan = o[0];
						setMode("walk", 30);
					}
					return o.length > 0;
				}
				if (name === "sleep") {
					setMode("sleep", 1e9);
					return true;
				}
				return false;
			},
			stop() {
				if (!alive) return;
				alive = false;
				api.alive = false;
				W.cancelAnimationFrame(raf);
				for (const [t, type, fn, opts] of listeners) {
					try {
						t.removeEventListener(type, fn, opts);
					} catch {
						/* window already gone */
					}
				}
				root.remove();
				style.remove();
				if (W.__deskBuddy === api) delete W.__deskBuddy;
			},
		};
		W.__deskBuddy = api;
		return api;
	}

	function normalize(c) {
		c = c && typeof c === "object" ? c : {};
		const size = Number(c.size);
		return {
			name: typeof c.name === "string" && c.name.trim() ? c.name.trim().slice(0, 40) : "Hana",
			hair: typeof c.hair === "string" && HAIR[c.hair] ? c.hair : "pink",
			size: Number.isFinite(size) ? clamp(size, 48, 160) : 84,
			energy: ["calm", "normal", "hyper"].includes(c.energy) ? c.energy : "normal",
			speech: c.speech !== false,
			sleepAfter: Number.isFinite(Number(c.sleepAfter)) ? clamp(Number(c.sleepAfter), 15, 3600) : 120,
			extraWindows: typeof c.extraWindows === "string" ? c.extraWindows.slice(0, 500) : "",
		};
	}

	kit.start = start;
	kit.normalize = normalize;
})();
