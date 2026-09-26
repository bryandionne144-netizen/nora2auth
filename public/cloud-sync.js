(() => {
	const BROKER = "wss://broker.hivemq.com:8884/mqtt";
	const TOPIC = "lacoche/esthetique/site/7f3a9c2e1b84d056";

	const listeners = new Set();
	let lastPack = null;
	let socket = null;
	let subscribed = false;
	let readyPromise = null;
	let buffer = new Uint8Array(0);
	let pingTimer = 0;
	let packetId = 1;
	let firstLook = null;

	function inFrame() {
		try {
			return window.parent && window.parent !== window;
		} catch {
			return true;
		}
	}

	function clone(pack) {
		return pack ? JSON.parse(JSON.stringify(pack)) : null;
	}

	function asPack(text) {
		try {
			const data = JSON.parse(text);
			if (!data || typeof data.content !== "object" || !data.content || !Array.isArray(data.content.services)) return null;
			return {
				updatedAt: Number(data.updatedAt) || 0,
				content: data.content,
				bookings: Array.isArray(data.bookings) ? data.bookings : [],
			};
		} catch {
			return null;
		}
	}

	function encodeRem(n) {
		const out = [];
		do {
			let byte = n % 128;
			n = Math.floor(n / 128);
			if (n > 0) byte |= 0x80;
			out.push(byte);
		} while (n > 0);
		return out;
	}

	function withLen(str) {
		const bytes = new TextEncoder().encode(str);
		const out = new Uint8Array(2 + bytes.length);
		out[0] = (bytes.length >> 8) & 255;
		out[1] = bytes.length & 255;
		out.set(bytes, 2);
		return out;
	}

	function packet(type, body) {
		const rem = encodeRem(body.length);
		const out = new Uint8Array(1 + rem.length + body.length);
		out[0] = type;
		out.set(rem, 1);
		out.set(body, 1 + rem.length);
		return out;
	}

	function connectPacket() {
		const id = withLen("lc" + Math.random().toString(36).slice(2, 12));
		const body = new Uint8Array(10 + id.length);
		body.set([0x00, 0x04, 0x4d, 0x51, 0x54, 0x54, 0x04, 0x02, 0x00, 0x3c]);
		body.set(id, 10);
		return packet(0x10, body);
	}

	function subscribePacket() {
		const topic = withLen(TOPIC);
		const id = (packetId++ & 65535) || 1;
		const body = new Uint8Array(2 + topic.length + 1);
		body[0] = (id >> 8) & 255;
		body[1] = id & 255;
		body.set(topic, 2);
		return packet(0x82, body);
	}

	function publishPacket(text) {
		const topic = withLen(TOPIC);
		const msg = new TextEncoder().encode(text);
		const body = new Uint8Array(topic.length + msg.length);
		body.set(topic, 0);
		body.set(msg, topic.length);
		return packet(0x31, body);
	}

	function parseRem(buf, index) {
		let multiplier = 1;
		let value = 0;
		let byte = 0;
		do {
			if (index >= buf.length) return null;
			byte = buf[index++];
			value += (byte & 127) * multiplier;
			multiplier *= 128;
			if (multiplier > 268435456) return null;
		} while (byte & 128);
		return [value, index];
	}

	function emit(pack) {
		lastPack = pack;
		listeners.forEach((fn) => {
			try {
				fn(pack);
			} catch {
				/* un affichage raté ne coupe pas le partage */
			}
		});
	}

	function append(data) {
		const chunk = new Uint8Array(data);
		const next = new Uint8Array(buffer.length + chunk.length);
		next.set(buffer, 0);
		next.set(chunk, buffer.length);
		buffer = next;
	}

	function drain(onReady, onFail) {
		while (buffer.length > 1) {
			const parsed = parseRem(buffer, 1);
			if (!parsed) return;
			const [len, start] = parsed;
			if (buffer.length < start + len) return;
			const type = buffer[0] >> 4;
			const flags = buffer[0] & 15;
			const body = buffer.slice(start, start + len);
			buffer = buffer.slice(start + len);
			if (type === 2) {
				if (body[1] !== 0) onFail(new Error("lecture"));
				else if (socket && socket.readyState === 1) socket.send(subscribePacket());
			} else if (type === 9) {
				onReady();
			} else if (type === 3) {
				const topicLen = (body[0] << 8) | body[1];
				let offset = 2 + topicLen;
				const qos = (flags >> 1) & 3;
				if (qos > 0) offset += 2;
				const pack = asPack(new TextDecoder().decode(body.slice(offset)));
				if (pack) emit(pack);
			}
		}
	}

	function startPing() {
		if (pingTimer) return;
		pingTimer = setInterval(() => {
			try {
				if (socket && socket.readyState === 1) socket.send(new Uint8Array([0xc0, 0x00]));
			} catch {
				/* la reprise se fait à la fermeture */
			}
		}, 20000);
	}

	function ensure() {
		if (socket && socket.readyState === 1 && subscribed) return Promise.resolve();
		if (!readyPromise) readyPromise = openSocket();
		return readyPromise;
	}

	function openSocket() {
		return new Promise((resolve, reject) => {
			let done = false;
			const ws = new WebSocket(BROKER, ["mqtt"]);
			socket = ws;
			subscribed = false;
			buffer = new Uint8Array(0);
			ws.binaryType = "arraybuffer";
			const timer = setTimeout(() => fail(new Error("lecture")), 2500);

			function fail(error) {
				if (done) return;
				done = true;
				clearTimeout(timer);
				readyPromise = null;
				subscribed = false;
				try {
					ws.close();
				} catch {
					/* déjà fermé */
				}
				reject(error);
			}

			function succeed() {
				if (done) return;
				done = true;
				clearTimeout(timer);
				subscribed = true;
				startPing();
				resolve();
			}

			ws.onopen = () => {
				try {
					ws.send(connectPacket());
				} catch (error) {
					fail(error);
				}
			};
			ws.onerror = () => {};
			ws.onclose = () => {
				clearInterval(pingTimer);
				pingTimer = 0;
				if (socket === ws) socket = null;
				subscribed = false;
				if (!done) fail(new Error("lecture"));
				else {
					readyPromise = null;
					setTimeout(() => {
						ensure().catch(() => {});
					}, 400);
				}
			};
			ws.onmessage = (event) => {
				try {
					append(event.data);
					drain(succeed, fail);
				} catch (error) {
					fail(error);
				}
			};
		});
	}

	function waitForPack(ms) {
		if (lastPack) return Promise.resolve(lastPack);
		return new Promise((resolve) => {
			const timer = setTimeout(() => {
				listeners.delete(onPack);
				resolve(null);
			}, ms);
			function onPack(pack) {
				clearTimeout(timer);
				listeners.delete(onPack);
				resolve(pack);
			}
			listeners.add(onPack);
		});
	}

	async function pullShared() {
		await ensure();
		if (lastPack) return clone(lastPack);
		if (!firstLook) firstLook = waitForPack(3500).then((pack) => (pack ? clone(pack) : null));
		return firstLook;
	}

	async function pushShared(pack) {
		if (!pack || typeof pack.content !== "object" || !pack.content) throw new Error("écriture");
		await ensure();
		const body = JSON.stringify({
			updatedAt: Number(pack.updatedAt) || Date.now(),
			content: pack.content,
			bookings: Array.isArray(pack.bookings) ? pack.bookings : [],
		});
		lastPack = JSON.parse(body);
		if (!socket || socket.readyState !== 1) throw new Error("écriture");
		socket.send(publishPacket(body));
	}

	function onShared(fn) {
		listeners.add(fn);
		ensure().catch(() => {});
	}

	function ask(type, extra) {
		return new Promise((resolve, reject) => {
			const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
			const timer = setTimeout(() => {
				window.removeEventListener("message", onMsg);
				reject(new Error("lecture"));
			}, 10000);
			function onMsg(event) {
				const data = event.data;
				if (!data || data.id !== id || data.type !== `${type}-result`) return;
				clearTimeout(timer);
				window.removeEventListener("message", onMsg);
				if (!data.ok) reject(new Error("écriture"));
				else resolve(data.pack || null);
			}
			window.addEventListener("message", onMsg);
			window.parent.postMessage(Object.assign({ type, id }, extra || {}), "*");
		});
	}

	if (inFrame()) {
		globalThis.laCocheCloud = {
			pullShared: () => ask("lc-pull"),
			pushShared: (pack) => ask("lc-push", { pack }).then(() => undefined),
			onShared(fn) {
				listeners.add(fn);
			},
		};
		window.addEventListener("message", (event) => {
			if (event.data && event.data.type === "lc-shared" && event.data.pack) {
				listeners.forEach((fn) => {
					try {
						fn(event.data.pack);
					} catch {
						/* ignore */
					}
				});
			}
		});
		return;
	}

	window.addEventListener("message", (event) => {
		const data = event.data;
		if (!data || typeof data !== "object" || !event.source || event.source === window) return;
		if (data.type === "lc-pull") {
			pullShared().then(
				(pack) => event.source.postMessage({ type: "lc-pull-result", id: data.id, ok: true, pack }, "*"),
				() => event.source.postMessage({ type: "lc-pull-result", id: data.id, ok: false }, "*"),
			);
		} else if (data.type === "lc-push") {
			pushShared(data.pack).then(
				() => event.source.postMessage({ type: "lc-push-result", id: data.id, ok: true }, "*"),
				() => event.source.postMessage({ type: "lc-push-result", id: data.id, ok: false }, "*"),
			);
		}
	});

	globalThis.laCocheCloud = { pullShared, pushShared, onShared };
})();
