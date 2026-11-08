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
	const VERSION = "0.2.0";
	const NS = "http://www.w3.org/2000/svg";
	const kit = (window.__deskBuddyKit = window.__deskBuddyKit || {});
	if (kit.version === VERSION && kit.start) return;
	kit.version = VERSION;

	// ---------------------------------------------------------------- art --

	// Hair colours; black is the default. Eyes are always a warm brown.
	const HAIR = {
		black: { base: "#1f1c27", shade: "#0b0a10", sheen: "#6470b0" },
		chestnut: { base: "#583322", shade: "#331c12", sheen: "#a3725a" },
		midnight: { base: "#262c56", shade: "#121530", sheen: "#7584d6" },
		pink: { base: "#e07aa8", shade: "#a84a76", sheen: "#ffc8e0" },
		silver: { base: "#c7ccd8", shade: "#868fa3", sheen: "#ffffff" },
		honey: { base: "#d4a03f", shade: "#9a6a1e", sheen: "#ffe6a6" },
	};
	// Traditional dresses: a West African wax-print (Ankara) dress, or a yukata.
	const DRESS = {
		ankara: { ground: "#dd6229", motif: "#1d8686", ring: "#f3c443", dot: "#3b2a6e", sash: "#1d8686", sashH: 1.6, hem: 52, flare: 6, sleeve: "puff", shoe: "#5e3420" },
		yukata: { ground: "#2c3e72", motif: "#f1efe8", ring: "#f2a5b7", dot: "#7f93c9", sash: "#c4403d", sashH: 4, hem: 60, flare: 1.4, sleeve: "wide", shoe: "#b98f66", collar: true },
	};
	const LINE = "#3a2119"; // warm, thin line art
	const SKIN = "#7a4832";
	const SKIN_SHADE = "#5a321f";
	const SKIN_LIGHT = "#a26c4d";
	const EYE = "#5e3318";
	const EYE_LIGHT = "#9c5f2e";
	const LIP_TOP = "#6a3330";
	const LIP_LOW = "#8a4842";

	function node(doc, tag, attrs, parent) {
		const n = doc.createElementNS(NS, tag);
		for (const k in attrs) n.setAttribute(k, String(attrs[k]));
		if (parent) parent.appendChild(n);
		return n;
	}

	/** An elliptical outline made of little outward bumps: curly hair. */
	function curly(cx, cy, rx, ry, n, bump) {
		let d = "";
		for (let i = 0; i <= n; i++) {
			const a = (i / n) * Math.PI * 2;
			const x = (cx + rx * Math.cos(a)).toFixed(2), y = (cy + ry * Math.sin(a)).toFixed(2);
			d += i === 0 ? `M${x} ${y}` : ` A${bump} ${bump} 0 0 1 ${x} ${y}`;
		}
		return d + "Z";
	}

	/** Little curl strokes scattered over an ellipse (seeded, so she looks the same every time). */
	function curlTexture(cx, cy, rx, ry, count, seed, size) {
		let x = seed;
		const r = () => ((x = (x * 16807) % 2147483647) / 2147483647);
		let d = "";
		for (let i = 0; i < count; i++) {
			const a = r() * Math.PI * 2, k = Math.sqrt(r()) * 0.9;
			const px = cx + Math.cos(a) * rx * k, py = cy + Math.sin(a) * ry * k, s = size * (0.7 + r() * 0.6);
			d += `M${(px - s).toFixed(2)} ${py.toFixed(2)} a${s.toFixed(2)} ${s.toFixed(2)} 0 1 1 ${(s * 1.5).toFixed(2)} ${(s * 0.8).toFixed(2)} `;
		}
		return d;
	}

	/**
	 * Builds her SVG (viewBox 48x64, feet at the bottom centre, about six and a
	 * half heads tall) and returns the movable parts. Limbs have joints: legs
	 * bend at the knee, arms at the elbow.
	 */
	function createSvg(doc, hairName, dressName) {
		const h = HAIR[hairName] || HAIR.black;
		const dr = DRESS[dressName] || DRESS.ankara;
		const uid = Math.random().toString(36).slice(2, 9);
		const url = (n) => `url(#ldb-${n}-${uid})`;
		const ln = (a) => Object.assign({ stroke: LINE, "stroke-width": 0.32, "stroke-linejoin": "round", "stroke-linecap": "round" }, a);
		const strand = (d, parent, w, color, op) => node(doc, "path", { d, fill: "none", stroke: color || h.base, "stroke-width": w || 0.5, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: op == null ? 1 : op }, parent);
		const sheen = (d, parent, w) => strand(d, parent, w || 0.35, h.sheen, 0.45);
		const svg = node(doc, "svg", { viewBox: "0 0 48 64", width: "100%", height: "100%", overflow: "visible", "aria-hidden": "true" });

		// Gradients and the fabric print, with ids unique to this drawing.
		const defs = node(doc, "defs", {}, svg);
		const grad = (kind, name, attrs, stops) => {
			const g = node(doc, kind, Object.assign({ id: `ldb-${name}-${uid}` }, attrs), defs);
			for (const [o, c, op] of stops) node(doc, "stop", { offset: o, "stop-color": c, "stop-opacity": op == null ? 1 : op }, g);
		};
		grad("linearGradient", "skin", { x1: 0, y1: 0, x2: 1, y2: 0 }, [[0, SKIN_LIGHT], [0.45, SKIN], [1, SKIN_SHADE]]);
		grad("radialGradient", "face", { cx: 0.42, cy: 0.4, r: 0.68 }, [[0, SKIN_LIGHT], [0.55, SKIN], [1, SKIN_SHADE]]);
		grad("linearGradient", "fold", { x1: 0, y1: 0, x2: 1, y2: 0 }, [[0, "#ffffff", 0.12], [0.4, "#000000", 0], [1, "#000000", 0.32]]);
		grad("linearGradient", "drop", { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, "#000000", 0.3], [1, "#000000", 0]]);
		grad("radialGradient", "hair", { cx: 0.38, cy: 0.3, r: 0.75 }, [[0, h.sheen, 0.5], [0.35, h.base], [1, h.shade]]);
		grad("radialGradient", "iris", { cx: 0.5, cy: 0.62, r: 0.6 }, [[0, EYE_LIGHT], [0.7, EYE], [1, "#2a160b"]]);
		const pat = node(doc, "pattern", { id: `ldb-print-${uid}`, width: 4, height: 4, patternUnits: "userSpaceOnUse", patternTransform: "scale(0.68)" }, defs);
		node(doc, "rect", { width: 4, height: 4, fill: dr.ground }, pat);
		node(doc, "circle", { cx: 2, cy: 2, r: 1.2, fill: dr.motif, stroke: dr.ring, "stroke-width": 0.42 }, pat);
		node(doc, "circle", { cx: 2, cy: 2, r: 0.38, fill: dr.ring }, pat);
		for (const [x, y] of [[0, 0], [4, 0], [0, 4], [4, 4]]) node(doc, "circle", { cx: x, cy: y, r: 0.48, fill: dr.dot }, pat);
		const print = url("print");
		const almond = (x) => `M${x - 1.15} 9.1 Q${x - 0.2} 8.15 ${x + 1.15} 8.95 Q${x + 0.1} 9.85 ${x - 1.15} 9.1 Z`;
		for (const [n, x] of [["eyeL", 22.2], ["eyeR", 25.8]]) node(doc, "path", { d: almond(x) }, node(doc, "clipPath", { id: `ldb-${n}-${uid}` }, defs));

		const rig = node(doc, "g", {}, svg);
		const p = { svg, rig };

		// Loose curly hair: a big mass behind her shoulders (behind the body).
		p.tails = node(doc, "g", {}, rig);
		node(doc, "path", ln({ d: curly(24, 11, 9.6, 12.8, 34, 1.4), fill: url("hair") }), p.tails);
		strand(curlTexture(24, 11, 9.6, 12.8, 46, 7, 0.75), p.tails, 0.32, h.shade, 0.7);
		strand(curlTexture(24, 10, 9, 12, 30, 19, 0.6), p.tails, 0.28, h.sheen, 0.4);

		// Legs: thigh pivots at the hip, shin at the knee; bare feet in sandals.
		const leg = (x) => {
			const g = node(doc, "g", {}, rig);
			node(doc, "path", ln({ d: `M${x - 1.5} 32 Q${x - 1.75} 40 ${x - 1.1} 47.6 L${x + 1.1} 47.6 Q${x + 1.6} 40 ${x + 1.5} 32 Z`, fill: url("skin") }), g);
			const shin = node(doc, "g", {}, g);
			node(doc, "path", ln({ d: `M${x - 1.12} 46.8 Q${x - 1.45} 50.5 ${x - 0.95} 54 Q${x - 0.65} 58 ${x - 0.62} 60.6 L${x + 0.62} 60.6 Q${x + 0.75} 57 ${x + 1.2} 52.5 Q${x + 1.45} 49.5 ${x + 1.12} 46.8 Z`, fill: url("skin") }), shin);
			node(doc, "ellipse", { cx: x + 0.1, cy: 47.6, rx: 0.8, ry: 0.5, fill: SKIN_LIGHT, opacity: 0.45 }, shin);
			node(doc, "path", ln({ d: `M${x - 0.75} 60.2 L${x + 0.75} 60.2 Q${x + 1.4} 61.6 ${x + 2.7} 62.5 Q${x + 3} 63.3 ${x + 2.2} 63.4 L${x - 0.9} 63.4 Q${x - 1.3} 62.6 ${x - 0.75} 60.2 Z`, fill: url("skin") }), shin);
			node(doc, "rect", { x: x - 1.2, y: 63.2, width: 4.4, height: 0.55, rx: 0.25, fill: dr.shoe }, shin);
			strand(`M${x - 0.7} 61.3 Q${x + 0.6} 62.4 ${x + 1.8} 62.2 M${x - 0.6} 60.5 L${x + 0.7} 60.9`, shin, 0.38, dr.shoe);
			return { g, shin };
		};
		const lL = leg(22.4), lR = leg(25.6);
		p.legL = lL.g;
		p.shinL = lL.shin;
		p.legR = lR.g;
		p.shinR = lR.shin;

		// Skirt: its own group so sitting can drape it over her lap.
		p.skirt = node(doc, "g", {}, rig);
		const hem = dr.hem, fl = dr.flare;
		const skirtD = `M20.1 29.5 L27.9 29.5 Q${28.5 + fl * 0.5} ${(29.5 + hem) / 2} ${28 + fl} ${hem} Q${26 + fl * 0.3} ${hem + 1} 24 ${hem + 0.6} Q${22 - fl * 0.3} ${hem + 1} ${20 - fl} ${hem} Q${19.5 - fl * 0.5} ${(29.5 + hem) / 2} 20.1 29.5 Z`;
		node(doc, "path", ln({ d: skirtD, fill: print }), p.skirt);
		node(doc, "path", { d: skirtD, fill: url("fold") }, p.skirt);
		for (const [a, b] of [[22.2, 21 - fl * 0.55], [24.2, 24.4], [26.1, 27 + fl * 0.55]]) strand(`M${a} 31 Q${(a + b) / 2 + 0.3} ${(31 + hem) / 2} ${b} ${hem + 0.3}`, p.skirt, 0.5, "#000000", 0.16);

		// Neck and bodice with a gentle waist; sash at the waist.
		p.body = node(doc, "g", {}, rig);
		node(doc, "path", { d: "M22.75 12.4 L25.25 12.4 L25.5 17.6 L22.5 17.6 Z", fill: url("skin") }, p.body);
		node(doc, "path", { d: "M22.75 13.2 Q24 14.9 25.25 13.2 L25.3 14.6 Q24 15.6 22.7 14.6 Z", fill: SKIN_SHADE, opacity: 0.55 }, p.body);
		const bodiceD = "M19.1 17.9 Q20 17.1 22.3 16.95 Q24 19.1 25.7 16.95 Q28 17.1 28.9 17.9 Q29.2 20.6 28.3 23.1 Q27.7 26.4 27.95 30 L20.05 30 Q20.3 26.4 19.7 23.1 Q18.8 20.6 19.1 17.9 Z";
		node(doc, "path", ln({ d: bodiceD, fill: print }), p.body);
		node(doc, "path", { d: bodiceD, fill: url("fold") }, p.body);
		strand("M20.6 21.6 Q21.9 22.9 23.4 22.3 M24.6 22.3 Q26.1 22.9 27.4 21.6", p.body, 0.4, "#000000", 0.2);
		node(doc, "path", { d: "M22.3 16.95 Q24 19.1 25.7 16.95 Q24 18.3 22.3 16.95 Z", fill: url("drop") }, p.body);
		if (dr.collar) strand("M22.4 17.1 L25.5 22.6 M25.6 17.1 L23.6 20.8", p.body, 0.7, "#f1efe8");
		node(doc, "path", ln({ d: `M19.75 ${29.9 - dr.sashH} Q24 ${29.4 - dr.sashH} 28.25 ${29.9 - dr.sashH} L28.3 30 Q24 30.5 19.7 30 Z`, fill: dr.sash }), p.body);
		if (dr.collar) node(doc, "rect", { x: 19.9, y: 29.9 - dr.sashH * 0.55, width: 8.2, height: 0.45, fill: "#f0cf78", opacity: 0.8 }, p.body);
		else node(doc, "path", ln({ d: "M27.4 29.3 Q28.8 30.6 29.4 32.4 L28.4 32.2 Q28 30.8 27.2 30 Z", fill: dr.sash }), p.body);

		// Head: curly crown, ears, an oval face with a jaw.
		p.head = node(doc, "g", {}, rig);
		node(doc, "path", ln({ d: curly(24, 6.6, 6.6, 5.6, 22, 1.1), fill: url("hair") }), p.head);
		strand(curlTexture(24, 5.5, 6, 4, 14, 3, 0.6), p.head, 0.28, h.shade, 0.7);
		for (const x of [19.55, 28.45]) node(doc, "ellipse", ln({ cx: x, cy: 9.3, rx: 0.6, ry: 1, fill: SKIN }), p.head);
		const faceD = "M19.75 7.9 Q19.8 3.7 24 3.6 Q28.2 3.7 28.25 7.9 Q28.3 11.3 26.4 13.1 Q25.1 14.3 24 14.3 Q22.9 14.3 21.6 13.1 Q19.7 11.3 19.75 7.9 Z";
		node(doc, "path", ln({ d: faceD, fill: url("face") }), p.head);
		node(doc, "ellipse", { cx: 21.3, cy: 10.4, rx: 0.9, ry: 0.45, fill: SKIN_LIGHT, opacity: 0.4 }, p.head);
		node(doc, "ellipse", { cx: 26.7, cy: 10.4, rx: 0.9, ry: 0.45, fill: SKIN_LIGHT, opacity: 0.3 }, p.head);
		node(doc, "ellipse", { cx: 21.5, cy: 11, rx: 0.85, ry: 0.45, fill: "#b8544c", opacity: 0.22 }, p.head);
		node(doc, "ellipse", { cx: 26.5, cy: 11, rx: 0.85, ry: 0.45, fill: "#b8544c", opacity: 0.22 }, p.head);
		// Nose: a soft shadow down the side, a highlight and the nostrils.
		strand("M24.45 8.6 Q24.7 10.1 24.5 10.8", p.head, 0.3, SKIN_SHADE, 0.6);
		node(doc, "ellipse", { cx: 23.95, cy: 10.2, rx: 0.22, ry: 0.5, fill: SKIN_LIGHT, opacity: 0.7 }, p.head);
		strand("M23.35 11.05 Q23.6 11.35 23.85 11.15 M24.15 11.15 Q24.4 11.35 24.65 11.05", p.head, 0.25, LINE, 0.7);

		// Eyes: almond-shaped, the iris clipped by the lids; lashes and creases.
		p.eyes = {};
		p.eyes.open = node(doc, "g", {}, p.head);
		p.pupils = [];
		for (const [x, out, n] of [[22.2, -1, "eyeL"], [25.8, 1, "eyeR"]]) {
			node(doc, "path", { d: almond(x), fill: "#f4ece6" }, p.eyes.open);
			const clip = node(doc, "g", { "clip-path": url(n) }, p.eyes.open);
			const iris = node(doc, "g", {}, clip);
			node(doc, "circle", { cx: x, cy: 9.05, r: 0.62, fill: url("iris") }, iris);
			node(doc, "circle", { cx: x, cy: 9.05, r: 0.27, fill: "#140a06" }, iris);
			node(doc, "circle", { cx: x - 0.22, cy: 8.8, r: 0.15, fill: "#ffffff", opacity: 0.9 }, iris);
			node(doc, "path", { d: `M${x - 1.15} 9.1 Q${x - 0.2} 8.15 ${x + 1.15} 8.95 L${x + 1.15} 8.7 Q${x - 0.2} 7.95 ${x - 1.15} 8.85 Z`, fill: "#000000", opacity: 0.25 }, clip);
			p.pupils.push(iris);
			const outer = out > 0 ? x + 1.15 : x - 1.15, inner = out > 0 ? x - 1.15 : x + 1.15;
			strand(`M${inner} ${out > 0 ? 9.1 : 8.95} Q${x - 0.2 * out} 8.05 ${outer} ${out > 0 ? 8.95 : 9.1} l${0.42 * out} -0.32`, p.eyes.open, 0.42, LINE);
			strand(`M${x - 1} 8.15 Q${x - 0.1} 7.55 ${x + 1} 8.05`, p.eyes.open, 0.18, SKIN_SHADE, 0.8);
			strand(`M${x - 0.7} 9.75 Q${x + 0.1} 9.95 ${x + 0.9} 9.6`, p.eyes.open, 0.15, LINE, 0.5);
		}
		const eyeLines = (d) => node(doc, "path", { d, stroke: LINE, "stroke-width": 0.38, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round", display: "none" }, p.head);
		p.eyes.closed = eyeLines("M21.05 9.05 Q22.2 9.75 23.35 9.0 M24.65 9.0 Q25.8 9.75 26.95 9.05 M21.2 9.25 l-0.3 0.35 M26.8 9.25 l0.3 0.35");
		p.eyes.happy = eyeLines("M21.05 9.4 Q22.2 8.45 23.35 9.4 M24.65 9.4 Q25.8 8.45 26.95 9.4");
		p.eyes.x = eyeLines("M21.6 8.45 L22.8 9.65 M22.8 8.45 L21.6 9.65 M25.2 8.45 L26.4 9.65 M26.4 8.45 L25.2 9.65");
		p.eyes.wide = node(doc, "g", { display: "none" }, p.head);
		for (const x of [22.2, 25.8]) {
			node(doc, "ellipse", { cx: x, cy: 9, rx: 1.1, ry: 0.85, fill: "#f4ece6", stroke: LINE, "stroke-width": 0.35 }, p.eyes.wide);
			node(doc, "circle", { cx: x, cy: 9.05, r: 0.42, fill: url("iris") }, p.eyes.wide);
			node(doc, "circle", { cx: x, cy: 9.05, r: 0.18, fill: "#140a06" }, p.eyes.wide);
		}
		// Brows: full, tapered.
		node(doc, "path", { d: "M20.8 7.55 Q21.8 6.55 23.35 6.9 L23.3 7.25 Q21.9 7.0 20.95 7.75 Z", fill: LINE }, p.head);
		node(doc, "path", { d: "M27.2 7.55 Q26.2 6.55 24.65 6.9 L24.7 7.25 Q26.1 7.0 27.05 7.75 Z", fill: LINE }, p.head);

		// Lips: cupid's bow on top, a fuller lower lip with a little gloss.
		p.mouth = {};
		p.mouth.smile = node(doc, "g", {}, p.head);
		node(doc, "path", { d: "M22.85 12.15 Q23.4 11.65 23.85 11.85 L24 11.95 L24.15 11.85 Q24.6 11.65 25.15 12.15 Q24 12.3 22.85 12.15 Z", fill: LIP_TOP }, p.mouth.smile);
		node(doc, "path", { d: "M22.85 12.15 Q24 12.3 25.15 12.15 Q24.7 13.05 24 13.05 Q23.3 13.05 22.85 12.15 Z", fill: LIP_LOW }, p.mouth.smile);
		strand("M22.9 12.17 Q24 12.35 25.1 12.17", p.mouth.smile, 0.2, LINE, 0.8);
		node(doc, "ellipse", { cx: 24.3, cy: 12.62, rx: 0.32, ry: 0.13, fill: "#ffffff", opacity: 0.35 }, p.mouth.smile);
		p.mouth.open = node(doc, "g", { display: "none" }, p.head);
		node(doc, "path", { d: "M23.1 12.1 Q24 11.6 24.9 12.1 Q24.8 13.3 24 13.35 Q23.2 13.3 23.1 12.1 Z", fill: "#3e1a1c", stroke: LIP_LOW, "stroke-width": 0.35 }, p.mouth.open);
		p.mouth.wavy = node(doc, "path", { d: "M23 12.3 q0.5 -0.45 1 0 q0.5 0.45 1 0", stroke: LIP_TOP, "stroke-width": 0.42, fill: "none", "stroke-linecap": "round", display: "none" }, p.head);
		p.mouth.cat = node(doc, "g", { display: "none" }, p.head);
		node(doc, "path", { d: "M23.1 12.15 Q24 12.05 24.9 12.15 Q24.5 12.75 24 12.75 Q23.5 12.75 23.1 12.15 Z", fill: LIP_LOW }, p.mouth.cat);
		strand("M23.1 12.15 Q24 12.0 24.9 12.15", p.mouth.cat, 0.22, LIP_TOP);

		// A soft curly fringe over the forehead, a few curls falling at the temples.
		node(doc, "path", ln({ d: "M19.7 8.4 Q19.3 3.2 24 2.9 Q28.7 3.2 28.3 8.4 Q27.9 6.6 27 6.1 Q26.6 5.2 25.6 5.5 Q24.9 4.6 24 5.1 Q23.1 4.6 22.4 5.5 Q21.4 5.2 21 6.1 Q20.1 6.6 19.7 8.4 Z", fill: url("hair") }), p.head);
		strand("M21.1 5.9 a0.6 0.6 0 1 1 1 0.4 M24.1 5.1 a0.6 0.6 0 1 1 1 0.4 M26.1 5.6 a0.55 0.55 0 1 0 -0.9 0.4", p.head, 0.25, h.sheen, 0.45);
		strand("M19.9 7.4 q-0.9 0.9 -0.2 1.8 q0.8 0.8 -0.2 1.7", p.head, 0.42);
		strand("M28.1 7.4 q0.9 0.9 0.2 1.8 q-0.8 0.8 0.2 1.7", p.head, 0.42);

		// Loose ringlets falling over her shoulders; they swing as she moves.
		p.locks = node(doc, "g", {}, rig);
		const lock = (x, dir, seed) => {
			const g = node(doc, "g", {}, p.locks);
			node(doc, "path", ln({ d: curly(x + dir * 0.6, 15.6, 2.3, 8.2, 16, 0.9), fill: url("hair") }), g);
			strand(curlTexture(x + dir * 0.6, 15.6, 2, 7.6, 12, seed, 0.55), g, 0.28, h.shade, 0.75);
			strand(`M${x + dir * 1.4} 19 q${dir * 1.4} 0.8 ${dir * 0.4} 2 q${-dir * 1.2} 1 ${dir * 0.2} 2.2 q${dir * 1} 0.6 ${dir * 0.1} 1.6`, g, 0.55, h.base);
			strand(`M${x + dir * 0.2} 13 q${-dir * 0.9} 0.7 0 1.6`, g, 0.3, h.sheen, 0.45);
			return g;
		};
		p.tailL = lock(18.9, -1, 11);
		p.tailR = lock(29.1, 1, 23);

		// Arms: upper arm pivots at the shoulder, forearm at the elbow.
		const arm = (x, out) => {
			const g = node(doc, "g", {}, rig);
			node(doc, "path", ln({ d: `M${x - 1.05} 18.6 Q${x - 1.2} 22 ${x - 0.85} 25.6 L${x + 0.85} 25.6 Q${x + 1.15} 22 ${x + 1.05} 18.6 Z`, fill: url("skin") }), g);
			const fore = node(doc, "g", {}, g);
			node(doc, "path", ln({ d: `M${x - 0.85} 25.2 Q${x - 1} 27.5 ${x - 0.55} 30.6 L${x + 0.55} 30.6 Q${x + 0.95} 27.5 ${x + 0.85} 25.2 Z`, fill: url("skin") }), fore);
			node(doc, "path", ln({ d: `M${x - 0.6} 30.3 Q${x - 0.95} 31.6 ${x - 0.45} 32.7 Q${x + 0.1} 33.2 ${x + 0.55} 32.6 Q${x + 0.85} 31.5 ${x + 0.6} 30.3 Z`, fill: SKIN }), fore);
			strand(`M${x + 0.55 * out} 30.8 q${0.45 * out} 0.5 ${0.25 * out} 1.1`, fore, 0.22, LINE, 0.7);
			if (dr.sleeve === "wide") {
				node(doc, "path", ln({ d: `M${x - 1.6} 17.6 L${x + 1.6} 17.6 L${x + 2.3} 26.8 Q${x} 27.6 ${x - 2.3} 26.8 Z`, fill: print }), g);
				node(doc, "path", { d: `M${x - 1.6} 17.6 L${x + 1.6} 17.6 L${x + 2.3} 26.8 Q${x} 27.6 ${x - 2.3} 26.8 Z`, fill: url("fold") }, g);
			} else {
				node(doc, "path", ln({ d: `M${x - 1.75} 20.6 Q${x - 2.2} 18 ${x} 17.5 Q${x + 2.2} 18 ${x + 1.75} 20.6 Q${x} 21.4 ${x - 1.75} 20.6 Z`, fill: print }), g);
				node(doc, "path", { d: `M${x - 1.75} 20.6 Q${x - 2.2} 18 ${x} 17.5 Q${x + 2.2} 18 ${x + 1.75} 20.6 Q${x} 21.4 ${x - 1.75} 20.6 Z`, fill: url("fold") }, g);
			}
			return { g, fore };
		};
		const aL = arm(19.85, -1), aR = arm(28.15, 1);
		p.armL = aL.g;
		p.foreL = aL.fore;
		p.armR = aR.g;
		p.foreR = aR.fore;
		return p;
	}

	const PIVOT = {
		legL: [22.4, 32.6], legR: [25.6, 32.6], shinL: [22.4, 47.2], shinR: [25.6, 47.2],
		armL: [19.85, 18.8], armR: [28.15, 18.8], foreL: [19.85, 25.4], foreR: [28.15, 25.4],
		tailL: [19.4, 8.2], tailR: [28.6, 8.2],
	};
	const JOINTS = { legL: "legL", legR: "legR", shinL: "kneeL", shinR: "kneeR", armL: "armL", armR: "armR", foreL: "elbowL", foreR: "elbowR", tailL: "tailL", tailR: "tailR" };

	/**
	 * Poses the parts. Angles in degrees; 0 = hanging down, -90 = pointing
	 * forward (where she faces). Knees bend with positive angles, elbows with
	 * negative ones.
	 */
	function applyPose(p, q) {
		for (const part in JOINTS) {
			const [px, py] = PIVOT[part];
			p[part].setAttribute("transform", `rotate(${(q[JOINTS[part]] || 0).toFixed(1)} ${px} ${py})`);
		}
		const tilt = `rotate(${(q.headTilt || 0).toFixed(1)} 24 14)`;
		p.head.setAttribute("transform", tilt);
		p.tails.setAttribute("transform", tilt);
		p.locks.setAttribute("transform", tilt);
		const lap = q.lap || 0;
		p.skirt.setAttribute("transform", `translate(24 30.5) rotate(${(-lap * 80).toFixed(1)}) skewX(${(q.skirtSway || 0).toFixed(1)}) scale(${(1 - Math.min(1, lap) * 0.55).toFixed(3)} ${(1 - Math.min(1, lap) * 0.3).toFixed(3)}) translate(-24 -30.5)`);
		const sx = q.sx || 1, sy = q.sy || 1;
		p.rig.setAttribute("transform", `translate(${(q.dx || 0).toFixed(2)} ${(q.bob || 0).toFixed(2)}) translate(24 64) rotate(${(q.rot || 0).toFixed(1)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-24 -64)`);
		for (const k in p.eyes) p.eyes[k].setAttribute("display", k === (q.eyes || "open") ? "inline" : "none");
		for (const k in p.mouth) p.mouth[k].setAttribute("display", k === (q.mouth || "smile") ? "inline" : "none");
		const look = `translate(${((q.lookX || 0) * 0.42).toFixed(2)} ${((q.lookY || 0) * 0.18).toFixed(2)})`;
		for (const iris of p.pupils) iris.setAttribute("transform", look);
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
			parts = createSvg(doc, cfg.hair, cfg.dress);
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
			HALF = 9 * S;
			REACH = H * 1.7;
			JUMPX = H * 1.6;
			const e = cfg.energy === "calm" ? 0.75 : cfg.energy === "hyper" ? 1.4 : 1;
			WALK = 40 * S * e;
			CLIMB = 28 * S * e;
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
			if (m !== "ouch" && m !== "sleep" && m !== "wave") st.fxKind = "";
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
		// Hips sit 31 units above her feet: sitting lowers her by that much.
		const SIT = 31;
		let glance = { x: 0, y: 0, at: 0 };
		function pose() {
			const t = clock;
			const q = { eyes: st.blink > 0 ? "closed" : "open", mouth: "smile", bob: 0 };
			// Eyes follow the cursor (in her own facing frame), with small darting glances.
			if (clock > glance.at) glance = { x: rnd(-0.35, 0.35), y: rnd(-0.3, 0.3), at: clock + rnd(0.7, 2.6) };
			if (input.x >= 0 && performance.now() - input.t < 6000) {
				q.lookX = clamp(((input.x - st.x) / 160) * st.face, -1, 1) + glance.x * 0.4;
				q.lookY = clamp((input.y - (st.y - H * 0.85)) / 180, -1, 1) + glance.y * 0.4;
			} else {
				q.lookX = glance.x * 2;
				q.lookY = glance.y;
			}
			const breathe = Math.sin(t * 2.2);
			q.tailL = 3 + Math.sin(t * 1.3) * 2;
			q.tailR = -3 + Math.sin(t * 1.3 + 0.6) * 2;
			// Relaxed standing: weight shifts slowly from foot to foot.
			const shift = Math.sin(t * 0.45);
			q.legL = 2 + shift * 2;
			q.legR = -2 + shift * 2;
			q.kneeL = shift > 0 ? 0 : -shift * 6;
			q.kneeR = shift > 0 ? shift * 6 : 0;
			q.armL = 5 + breathe * 1.2;
			q.armR = -5 - breathe * 1.2;
			q.elbowL = -8;
			q.elbowR = -8;
			q.bob = breathe * 0.12 + Math.abs(shift) * 0.25;
			q.rot = shift * 1.2;
			q.headTilt = Math.sin(t * 0.6) * 2.5;
			const sitStretched = (kick) => {
				q.bob = SIT;
				q.legL = -88 + kick;
				q.legR = -84 - kick;
				q.kneeL = 4;
				q.kneeR = 6;
				q.lap = 1;
				q.rot = 0;
			};
			const sitKneesUp = () => {
				q.bob = SIT;
				q.legL = -128;
				q.legR = -122;
				q.kneeL = 74;
				q.kneeR = 70;
				q.lap = 1.4;
				q.rot = 0;
			};
			switch (st.mode) {
				case "walk": {
					const ph = t * 6.5 * (WALK / (40 * S));
					const s1 = Math.sin(ph), c1 = Math.cos(ph);
					q.legL = s1 * 24;
					q.legR = -s1 * 24;
					q.kneeL = 6 + Math.max(0, c1) * 34;
					q.kneeR = 6 + Math.max(0, -c1) * 34;
					q.armL = -s1 * 18;
					q.armR = s1 * 18;
					q.elbowL = -12 - Math.max(0, -s1) * 18;
					q.elbowR = -12 - Math.max(0, s1) * 18;
					q.bob = Math.abs(s1) * 0.7;
					q.rot = 2;
					q.headTilt = Math.sin(ph * 2) * 1.2;
					q.skirtSway = -5 + Math.sin(ph * 2) * 2.5;
					q.tailL = q.tailR = 6 + Math.sin(ph * 2) * 3;
					q.lookX = 0.8 + glance.x * 0.3;
					break;
				}
				case "climb":
				case "hang": {
					const climbing = st.mode === "climb";
					const ph = t * 5;
					const s1 = Math.sin(ph);
					q.armL = climbing ? 150 + s1 * 18 : 165;
					q.armR = climbing ? -150 + s1 * 18 : -165;
					q.elbowL = climbing ? -25 - Math.max(0, s1) * 35 : -6;
					q.elbowR = climbing ? -25 - Math.max(0, -s1) * 35 : -6;
					q.legL = climbing ? -45 + s1 * 28 : Math.sin(t * 1.8) * 10;
					q.legR = climbing ? -45 - s1 * 28 : -Math.sin(t * 1.8) * 10;
					q.kneeL = climbing ? 55 - s1 * 25 : 10 + Math.sin(t * 1.8) * 8;
					q.kneeR = climbing ? 55 + s1 * 25 : 10 - Math.sin(t * 1.8) * 8;
					q.rot = climbing ? 7 : Math.sin(t * 1.8) * 3;
					q.dx = 1.8;
					q.bob = 0;
					q.lookX = climbing ? 1 : q.lookX;
					q.lookY = climbing ? -1 : q.lookY;
					q.tailL = q.tailR = climbing ? -8 : Math.sin(t * 1.8) * -8;
					if (!climbing) q.mouth = "cat";
					break;
				}
				case "jump":
				case "fall": {
					const flail = Math.sin(t * 16) * 16;
					const down = st.vy > 0;
					q.armL = 140 + flail;
					q.armR = -140 - flail;
					q.elbowL = -20;
					q.elbowR = -20;
					q.legL = down ? 14 + flail * 0.5 : -30;
					q.legR = down ? -14 - flail * 0.5 : 10;
					q.kneeL = down ? 20 : 60;
					q.kneeR = down ? 25 : 30;
					q.tailL = down ? 120 : 20;
					q.tailR = down ? -120 : -20;
					q.skirtSway = down ? 0 : -4;
					q.eyes = st.why === "vanish" && down ? "wide" : st.why === "throw" ? "happy" : "open";
					q.mouth = down ? "open" : "smile";
					q.rot = st.why === "throw" ? clamp(st.vx / 50, -20, 20) : 0;
					q.bob = 0;
					break;
				}
				case "drag": {
					const kick = Math.sin(t * 12) * 20;
					q.armL = 160;
					q.armR = -160;
					q.elbowL = q.elbowR = -10;
					q.legL = kick - 10;
					q.legR = -kick - 10;
					q.kneeL = 30 + kick;
					q.kneeR = 30 - kick;
					q.tailL = 15;
					q.tailR = -15;
					q.eyes = "wide";
					q.mouth = "open";
					q.rot = clamp((st.drag ? st.drag.vx : 0) / -70, -25, 25);
					q.bob = 0;
					break;
				}
				case "land": {
					const k = 1 - clamp(st.t / Math.max(0.01, st.dur), 0, 1);
					q.kneeL = q.kneeR = 40 * k;
					q.legL = q.legR = -20 * k;
					q.bob = 4 * k;
					q.armL = 30 * k;
					q.armR = -30 * k;
					q.sy = 1 - 0.05 * k;
					break;
				}
				case "ouch": {
					sitStretched(0);
					q.eyes = "x";
					q.mouth = "wavy";
					q.headTilt = Math.sin(t * 4) * 6;
					q.armR = -160;
					q.elbowR = -110;
					q.armL = 20;
					q.elbowL = -40;
					break;
				}
				case "sit":
				case "sleep": {
					if (st.sat === "edge") {
						// On the edge of a window: thighs along the top, shins hanging over.
						const kick = Math.sin(t * 2.4);
						q.bob = SIT;
						q.legL = -90;
						q.legR = -86;
						q.kneeL = 88 + kick * 16;
						q.kneeR = 86 - kick * 16;
						q.lap = 1;
						q.armL = 25;
						q.armR = -25;
						q.elbowL = q.elbowR = -15;
						q.rot = -3;
					} else if (st.mode === "sleep") sitKneesUp();
					else sitStretched(Math.sin(t * 1.2) * 4);
					if (st.mode === "sleep") {
						q.eyes = "closed";
						q.headTilt = 16 + breathe * 2;
						q.bob = SIT + breathe * 0.25;
						q.armL = -110;
						q.armR = -105;
						q.elbowL = -70;
						q.elbowR = -75;
						q.tailL = q.tailR = 0;
					} else {
						q.headTilt = Math.sin(t * 0.8) * 4;
						if (st.sat !== "edge") {
							q.armL = 35;
							q.armR = -20;
							q.elbowL = -30;
							q.elbowR = -20;
						}
					}
					break;
				}
				case "watch": {
					sitKneesUp();
					q.armL = -105;
					q.armR = -100;
					q.elbowL = -80;
					q.elbowR = -85;
					q.headTilt = 4 + Math.sin(t * 5) * 1.2;
					q.mouth = "cat";
					break;
				}
				case "wave": {
					q.armR = -155;
					q.elbowR = -25 + Math.sin(t * 11) * 28;
					q.armL = 6;
					q.eyes = st.fxKind === "heart" ? "happy" : q.eyes;
					q.mouth = "open";
					q.headTilt = -5;
					break;
				}
				case "poke": {
					const jab = (Math.sin(t * 9) + 1) / 2;
					q.armR = -88;
					q.elbowR = -35 + jab * 30;
					q.armL = 8;
					q.lookX = 1;
					q.mouth = "cat";
					q.rot = 3;
					break;
				}
				case "poked": {
					q.eyes = "happy";
					q.mouth = "open";
					q.armL = 25;
					q.armR = -25;
					q.elbowL = q.elbowR = -60;
					q.headTilt = Math.sin(st.t * 12) * 5;
					q.kneeL = q.kneeR = 10 * Math.max(0, 1 - st.t * 3);
					break;
				}
				case "peek": {
					// Pops up from below the bottom edge, arms resting on it.
					const k = st.t < 0.6 ? st.t / 0.6 : st.t > st.dur - 0.5 ? clamp((st.dur - st.t) / 0.5, 0, 1) : 1;
					q.bob = 46 + (1 - k) * 18;
					q.armL = -150;
					q.armR = -145;
					q.elbowL = -70;
					q.elbowR = -75;
					q.lookX = Math.sin(st.t * 1.8) * 1.1;
					q.mouth = "cat";
					q.headTilt = Math.sin(st.t * 1.8) * 4;
					break;
				}
				case "look":
					q.headTilt = Math.sin(t * 1.1) * 7;
					q.lookX = Math.sin(t * 0.9) * 1.1;
					q.armL = 15;
					q.elbowL = -100;
					q.armR = -8;
					break;
			}
			return q;
		}

		// Poses blend into each other instead of snapping; curls and skirt lag a little more.
		const DISCRETE = { eyes: 1, mouth: 1 };
		const cur = {};
		function smooth(q, dt) {
			for (const k in q) {
				if (DISCRETE[k]) {
					cur[k] = q[k];
					continue;
				}
				const target = q[k];
				if (cur[k] == null) {
					cur[k] = target;
					continue;
				}
				const rate = k.startsWith("tail") || k === "skirtSway" ? 7 : k === "bob" || k === "lap" ? 12 : 16;
				cur[k] += (target - cur[k]) * (1 - Math.exp(-dt * rate));
			}
			for (const k in cur) {
				if (!(k in q) && !DISCRETE[k]) cur[k] += ((k === "sx" || k === "sy" ? 1 : 0) - cur[k]) * (1 - Math.exp(-dt * 16));
			}
			return cur;
		}

		function draw(dt) {
			const q = smooth(pose(), dt);
			applyPose(parts, q);
			const left = st.x - SW / 2;
			const top = st.y - H;
			sprite.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0) scaleX(${st.face})`;
			const lowered = ((q.bob || 0) / 64) * H; // sitting or peeking lowers her head
			const headTop = top + lowered;
			if (bubble.classList.contains("show")) {
				const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
				const bx = clamp(st.x - bw / 2, 4, vw - bw - 4);
				const by = clamp(headTop - bh - 6, 4, vh - bh - 4);
				bubble.style.transform = `translate3d(${bx.toFixed(1)}px, ${by.toFixed(1)}px, 0)`;
			}
			if (st.fxKind) {
				fx.style.display = "block";
				fx.className = "ldb-fx" + (st.fxKind === "zz" ? " zz" : st.fxKind === "heart" ? " heart" : "");
				let text, fxX, fxY;
				if (st.fxKind === "stars") {
					const a = clock * 6;
					text = "★ ✦ ★";
					fxX = st.x - 18 + Math.cos(a) * 6;
					fxY = headTop - 4 + Math.sin(a) * 3;
				} else if (st.fxKind === "zz") {
					const k = (clock * 0.6) % 1;
					text = k < 0.33 ? "z" : k < 0.66 ? "z Z" : "z Z z";
					fxX = st.x + st.face * SW * 0.2;
					fxY = headTop - 6 - k * 10;
				} else {
					const k = (clock * 0.9) % 1;
					text = "♥";
					fxX = st.x + Math.sin(clock * 5) * 6;
					fxY = headTop - 8 - k * 20;
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
				draw(dt);
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
				if (before.hair !== cfg.hair || before.dress !== cfg.dress) build();
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
			hair: typeof c.hair === "string" && HAIR[c.hair] ? c.hair : "black",
			size: Number.isFinite(size) ? clamp(size, 72, 220) : 120,
			dress: typeof c.dress === "string" && DRESS[c.dress] ? c.dress : "ankara",
			energy: ["calm", "normal", "hyper"].includes(c.energy) ? c.energy : "normal",
			speech: c.speech !== false,
			sleepAfter: Number.isFinite(Number(c.sleepAfter)) ? clamp(Number(c.sleepAfter), 15, 3600) : 120,
			extraWindows: typeof c.extraWindows === "string" ? c.extraWindows.slice(0, 500) : "",
		};
	}

	kit.start = start;
	kit.normalize = normalize;
})();
