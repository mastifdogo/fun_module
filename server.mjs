// Desk Buddy runs almost entirely in the browser (ui/buddy.js). The server
// only hands her settings to the page, cleaned up so the browser never has to
// trust stored values.

const HAIR = ["pink", "midnight", "silver", "chestnut", "mint", "honey"];
const ENERGY = ["calm", "normal", "hyper"];

/** @param {unknown} v @param {number} min @param {number} max @param {number} dflt */
function num(v, min, max, dflt) {
	const n = typeof v === "number" ? v : Number(v);
	return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : dflt;
}

/** @param {Record<string, unknown>} s */
export function cleanConfig(s) {
	const name = typeof s.buddy_name === "string" ? s.buddy_name.trim().slice(0, 40) : "";
	const extra = typeof s.extra_windows === "string" ? s.extra_windows.trim().slice(0, 500) : "";
	return {
		name: name || "Hana",
		autoSummon: s.auto_summon !== false,
		hair: HAIR.includes(/** @type {string} */ (s.hair)) ? s.hair : "pink",
		size: num(s.size, 48, 160, 84),
		energy: ENERGY.includes(/** @type {string} */ (s.energy)) ? s.energy : "normal",
		speech: s.speech !== false,
		sleepAfter: num(s.sleep_after, 15, 3600, 120),
		extraWindows: extra,
	};
}

/** @param {any} ctx */
export default async function register(ctx) {
	// GET /api/v1/m/desk-buddy/config
	ctx.route("GET", "/config", async () => cleanConfig((await ctx.settings.get()) ?? {}));

	ctx.log.info("desk-buddy ready");
}
