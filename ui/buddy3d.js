/*
 * Desk Buddy in 3D: renders a rigged glTF model (ui/model/buddy.glb by
 * default) with three.js, driven by the same behaviour engine as the drawn
 * version (ui/buddy.js). The engine hands over each frame's pose (joint
 * angles in degrees, see applyPose in buddy.js) and this file aims the
 * model's bones accordingly, or plays the model's own animation clips when it
 * has one for what she's doing (e.g. a "Walking" clip from Mixamo).
 *
 * Works with common humanoid skeletons, detected by bone name: Mixamo,
 * MakeHuman, VRoid/VRM, Character Creator, Blender Rigify-style names.
 */
import * as THREE from "./vendor/three.module.min.js";
import { GLTFLoader } from "./vendor/GLTFLoader.js";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

const DEG = Math.PI / 180;
// 64 units = her height (the drawn version's viewBox), so pose offsets carry over.
const UNIT = 64;
// The canvas reaches past her body: arms up, legs dangling below a ledge.
const CANVAS_W = 1.4, CANVAS_H = 1.6, BELOW = 0.3;

/** Splits a bone name into lower-case words: "mixamorigLeftForeArm" -> ["mixamorig","left","fore","arm"]. */
function words(name) {
	return name
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter(Boolean);
}

/** Which body part a bone is, or null. Returns e.g. { slot: "upperArm", side: "L" }. */
export function classify(name) {
	const w = words(name.replace(/^mixamorig\d*:?/i, "").replace(/^(CC_Base_|J_Bip_|DEF-|ORG-)/i, ""));
	if (!w.length) return null;
	const s = w.join(" ");
	const flat = w.join("");
	if (/(twist|roll|ik|pole|target|end|nub|tip|share|bend|helper|socket|top)/.test(s)) return null;
	if (/(thumb|index|middle|ring|pinky|little|toe|finger|eye|jaw|tongue|teeth|breast|hair|skirt|bust)/.test(s)) return null;
	const side = w.includes("left") || w.includes("l") ? "L" : w.includes("right") || w.includes("r") ? "R" : "";
	let slot = null;
	if (/forearm|lowerarm|elbow/.test(flat)) slot = "foreArm";
	else if (/upperarm/.test(flat) || (w.includes("arm") && !/shoulder|clavicle/.test(s))) slot = "upperArm";
	else if (/hand|wrist/.test(flat)) slot = "hand";
	else if (/upleg|upperleg|thigh/.test(flat)) slot = "thigh";
	else if (/lowerleg|calf|shin|knee/.test(flat) || w.includes("leg")) slot = "shin";
	else if (/foot|ankle/.test(flat)) slot = "foot";
	else if (w.includes("head")) slot = "head";
	else if (w.includes("neck")) slot = "neck";
	else if (/hips|pelvis/.test(flat)) slot = "hips";
	if (!slot) return null;
	const sided = !["head", "neck", "hips"].includes(slot);
	if (sided && !side) return null;
	return { slot, side: sided ? side : "" };
}

// Animation clips she can use, by what she's doing (names matched loosely).
const CLIPS = {
	idle: /idle|stand|breath/i,
	look: /look|idle/i,
	walk: /walk/i,
	climb: /climb/i,
	hang: /hang/i,
	jump: /jump/i,
	fall: /fall(?!.*(down|flat))|falling/i,
	drag: /dangl|struggl|hang/i,
	land: /land/i,
	ouch: /hurt|knock|fall.?(down|flat)|stunned/i,
	sit: /sit/i,
	watch: /sit|look/i,
	sleep: /sleep|lying|lay/i,
	wave: /wave|greet|hello/i,
	poke: /point|poke|press/i,
	poked: /laugh|giggl|happy/i,
};
const MORPH = {
	blink: /blink|eye.?close|eyesclosed|fcl_eye_close/i,
	smile: /smile|joy|happy|fcl_all_joy/i,
	open: /mouth.?open|jawopen|viseme_aa|fcl_mth_a\b|^a$/i,
};

/**
 * Loads the model and returns a renderer with a canvas to put in her sprite.
 * Rejects if WebGL or the model isn't available (the caller keeps the drawn version).
 */
export async function create3d({ doc, modelUrl, yawOffset = 0 }) {
	const canvas = doc.createElement("canvas");
	canvas.style.cssText = "position:absolute;pointer-events:none;display:block";
	const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.05;
	renderer.setClearColor(0x000000, 0);

	const scene = new THREE.Scene();
	const pmrem = new THREE.PMREMGenerator(renderer);
	const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
	scene.environment = envTex;
	scene.add(new THREE.HemisphereLight(0xfff4ea, 0x3a3440, 0.9));
	const key = new THREE.DirectionalLight(0xfff1e2, 2.2);
	key.position.set(30, 90, 70);
	const rim = new THREE.DirectionalLight(0x9fb6ff, 1.6);
	rim.position.set(-70, 50, -60);
	const fill = new THREE.DirectionalLight(0xffd9bd, 0.45);
	fill.position.set(60, 10, 40);
	scene.add(key, rim, fill);

	const camera = new THREE.OrthographicCamera(-CANVAS_W / 2 * UNIT, CANVAS_W / 2 * UNIT, (CANVAS_H - BELOW) * UNIT, -BELOW * UNIT, 1, 1000);
	camera.position.set(0, 0, 400);
	camera.lookAt(0, 0, 0);

	const gltf = await new GLTFLoader().loadAsync(modelUrl);
	const model = gltf.scene || gltf.scenes[0];
	if (!model) throw new Error("the model file has no scene");

	// rigRoot: her pose transform (turn, lean, bob). holder: normalises the model
	// so she's UNIT tall, feet at y = 0, facing +z.
	const rigRoot = new THREE.Group();
	const holder = new THREE.Group();
	holder.rotation.y = yawOffset * DEG;
	holder.add(model);
	rigRoot.add(holder);
	scene.add(rigRoot);
	model.traverse((o) => {
		if (o.isMesh) {
			o.frustumCulled = false;
			if (o.material && "envMapIntensity" in o.material) o.material.envMapIntensity = 0.8;
		}
	});
	scene.updateMatrixWorld(true);
	const box = new THREE.Box3().setFromObject(model, true);
	const size = box.getSize(new THREE.Vector3());
	if (!(size.y > 0)) throw new Error("the model has no size");
	const k = UNIT / size.y;
	holder.scale.setScalar(k);
	scene.updateMatrixWorld(true);
	box.setFromObject(model, true);
	const c = box.getCenter(new THREE.Vector3());
	holder.position.set(-c.x, -box.min.y, -c.z);
	scene.updateMatrixWorld(true);

	// A soft contact shadow under her feet.
	const sc = doc.createElement("canvas");
	sc.width = sc.height = 64;
	const g2 = sc.getContext("2d");
	const grad = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
	grad.addColorStop(0, "rgba(0,0,0,0.35)");
	grad.addColorStop(1, "rgba(0,0,0,0)");
	g2.fillStyle = grad;
	g2.fillRect(0, 0, 64, 64);
	const shadow = new THREE.Mesh(new THREE.PlaneGeometry(UNIT * 0.42, UNIT * 0.12), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
	shadow.position.set(0, 0.2, 0);
	shadow.renderOrder = -1;
	scene.add(shadow);

	// Find the skeleton's limbs.
	const bones = {};
	model.traverse((o) => {
		if (!o.isBone && !(o.type === "Object3D" && /arm|leg|head|neck|hips/i.test(o.name))) return;
		const cl = classify(o.name || "");
		if (!cl) return;
		const id = cl.slot + cl.side;
		if (!bones[id]) bones[id] = o; // first in hierarchy order = closest to the body
	});
	const NEXT = { upperArm: "foreArm", foreArm: "hand", thigh: "shin", shin: "foot" };
	const rest = new Map();
	const tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3();
	for (const id in bones) {
		const b = bones[id];
		const slot = id.replace(/[LR]$/, ""), side = id.slice(slot.length);
		const childId = NEXT[slot] ? NEXT[slot] + side : null;
		let child = childId && bones[childId];
		if (!child) child = b.children.find((ch) => ch.isBone || ch.children.length) || null;
		const info = { local: b.quaternion.clone(), world: b.getWorldQuaternion(new THREE.Quaternion()), dir: null };
		if (child) {
			b.getWorldPosition(tmpV);
			child.getWorldPosition(tmpV2);
			const d = tmpV2.sub(tmpV);
			if (d.lengthSq() > 1e-8) info.dir = d.normalize().clone();
		}
		rest.set(b, info);
	}
	const limbsOk = ["upperArmL", "upperArmR", "thighL", "thighR"].every((id) => bones[id] && rest.get(bones[id]).dir);

	// Animation clips and face morphs, if the model has them.
	const mixer = gltf.animations.length ? new THREE.AnimationMixer(model) : null;
	const actions = {};
	for (const mode in CLIPS) {
		const clip = gltf.animations.find((a) => CLIPS[mode].test(a.name));
		if (clip) actions[mode] = mixer.clipAction(clip);
	}
	let current = null;
	const morphs = [];
	model.traverse((o) => {
		if (!o.morphTargetDictionary) return;
		for (const name in o.morphTargetDictionary) {
			for (const kind in MORPH) if (MORPH[kind].test(name)) morphs.push({ mesh: o, i: o.morphTargetDictionary[name], kind });
		}
	});

	const q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), pq = new THREE.Quaternion();
	const eul = new THREE.Euler();
	const dir = new THREE.Vector3();

	/** Rotates bone b (in rigRoot space) so it points along d, starting from its rest pose. */
	function aim(b, d) {
		const r = b && rest.get(b);
		if (!r || !r.dir) return;
		q1.setFromUnitVectors(r.dir, d);
		q2.copy(q1).multiply(r.world); // new world rotation
		b.parent.getWorldQuaternion(pq);
		b.quaternion.copy(pq.invert().multiply(q2));
		b.updateMatrixWorld(true);
	}
	/** Direction for a limb angle (0 = down, -90 = forward, 180 = up), splayed out to its side a little. */
	function limbDir(angle, sideSign, spread) {
		const a = angle * DEG;
		return dir.set(sideSign * spread, -Math.cos(a), -Math.sin(a)).normalize();
	}

	let px = 0, cw = 0, ch = 0;
	function resize(H) {
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		cw = Math.round(H * CANVAS_W);
		ch = Math.round(H * CANVAS_H);
		px = dpr;
		renderer.setPixelRatio(dpr);
		renderer.setSize(cw, ch, false);
		canvas.style.width = cw + "px";
		canvas.style.height = ch + "px";
	}

	/**
	 * Draws one frame. q: the pose from buddy.js. info: { face, mode, dt, H, SW, grounded }.
	 */
	function render(q, info) {
		const { face, mode, dt, H, SW } = info;
		if (!cw || Math.round(H * CANVAS_W) !== cw) resize(H);
		canvas.style.left = ((SW - cw) / 2).toFixed(1) + "px";
		canvas.style.top = (H + H * BELOW - ch).toFixed(1) + "px";

		rigRoot.position.set(0, 0, 0);
		rigRoot.quaternion.identity();
		rigRoot.scale.set(1, 1, 1);
		rigRoot.updateMatrixWorld(true);

		// Her own animation clip for this, or posed from the engine's angles.
		const act = actions[mode] || null;
		if (act !== current) {
			if (act) {
				act.reset().play();
				if (current) current.crossFadeTo(act, 0.25, false);
			} else if (current) current.fadeOut(0.2);
			current = act;
		}
		if (mixer) mixer.update(dt);
		const clipDriven = !!current && current.getEffectiveWeight() > 0.5;
		if (!clipDriven) {
			for (const [b, r] of rest) b.quaternion.copy(r.local);
			model.updateMatrixWorld(true);
			if (limbsOk) {
				// The engine's "R" limbs are the ones on the side she faces.
				const frontSide = face > 0 ? "R" : "L", backSide = frontSide === "R" ? "L" : "R";
				const sign = (s) => (s === "L" ? 1 : -1); // her left is +x when she faces +z
				const limb = (upper, lower, side, a1, a2, spread) => {
					aim(bones[upper + side], limbDir(a1, sign(side), spread));
					aim(bones[lower + side], limbDir(a1 + a2, sign(side), spread * 0.6));
				};
				limb("upperArm", "foreArm", frontSide, q.armR || 0, q.elbowR || 0, 0.22);
				limb("upperArm", "foreArm", backSide, q.armL || 0, q.elbowL || 0, 0.22);
				limb("thigh", "shin", frontSide, q.legR || 0, q.kneeR || 0, 0.07);
				limb("thigh", "shin", backSide, q.legL || 0, q.kneeL || 0, 0.07);
			}
		}
		// Head: tilt, and turn towards what she's looking at.
		const head = bones.head;
		if (head) {
			head.getWorldQuaternion(q2);
			eul.set((q.lookY || 0) * 0.25, face * (q.lookX || 0) * 0.35, -(q.headTilt || 0) * face * DEG, "YXZ");
			q1.setFromEuler(eul).multiply(q2);
			head.parent.getWorldQuaternion(pq);
			head.quaternion.copy(pq.invert().multiply(q1));
		}
		// Blinking and expressions, when the model has face morphs.
		for (const m of morphs) {
			let v = 0;
			if (m.kind === "blink") v = q.eyes === "closed" || q.eyes === "happy" || q.eyes === "x" ? 1 : 0;
			else if (m.kind === "smile") v = q.eyes === "happy" ? 1 : q.mouth === "smile" ? 0.25 : 0;
			else if (m.kind === "open") v = q.mouth === "open" ? 0.7 : 0;
			const inf = m.mesh.morphTargetInfluences;
			inf[m.i] += (v - inf[m.i]) * Math.min(1, dt * 18);
		}

		// Whole-body transform: turn towards where she faces, lean, bob, squash.
		const turn = mode === "climb" || mode === "hang" ? 1.15 : 0.62;
		const bob = clipDriven && mode !== "peek" ? 0 : q.bob || 0;
		rigRoot.rotation.set(0, face * turn, -(q.rot || 0) * face * DEG, "ZYX");
		rigRoot.position.set((q.dx || 0) * face, -bob, 0);
		rigRoot.scale.set(q.sx || 1, q.sy || 1, q.sx || 1);
		shadow.visible = info.grounded && bob < 4;
		renderer.render(scene, camera);
	}

	function dispose() {
		mixer && mixer.stopAllAction();
		renderer.dispose();
		envTex.dispose();
		pmrem.dispose();
		scene.traverse((o) => {
			if (o.geometry) o.geometry.dispose();
			if (o.material) for (const m of [].concat(o.material)) m.dispose();
		});
	}

	return {
		canvas,
		render,
		dispose,
		info: { bones: Object.keys(bones), clips: Object.keys(actions), morphs: morphs.length, posable: limbsOk },
	};
}
