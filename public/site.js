(() => {
	let mountAbort = null;

	function todayToronto() {
		return new Intl.DateTimeFormat("en-CA", {
			timeZone: "America/Toronto",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(new Date());
	}

	function storeLocalBooking(data) {
		if (typeof data.company === "string" && data.company.trim()) return "";
		const name = String(data.name || "").trim();
		const phone = String(data.phone || "").trim();
		const email = String(data.email || "").trim();
		const service = String(data.service || "").trim();
		const zone = String(data.zone || "").trim();
		const date = String(data.date || "").trim();
		const message = String(data.message || "").trim().slice(0, 1000);
		if (name.length < 2) return "Indiquez votre nom.";
		if (phone.replace(/\D/g, "").length < 7) return "Indiquez un téléphone valide.";
		if (email && (email.length > 120 || !email.includes("@"))) return "Courriel invalide.";
		if (!service) return "Choisissez un soin disponible.";
		if (!zone) return "Choisissez un secteur disponible.";
		if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Date invalide.";
		if (date && date < todayToronto()) return "Choisissez une date à venir.";
		let list = [];
		try {
			list = JSON.parse(localStorage.getItem("lc_offline_bookings") || "[]");
			if (!Array.isArray(list)) list = [];
		} catch {
			list = [];
		}
		list.unshift({
			id: Date.now(),
			name,
			phone,
			email,
			service,
			zone,
			preferred_date: date,
			message,
			status: "nouveau",
			created_at: new Date().toISOString(),
		});
		localStorage.setItem("lc_offline_bookings", JSON.stringify(list.slice(0, 200)));
		window.dispatchEvent(new CustomEvent("lc-bookings-saved"));
		return "";
	}

	function mountLaCocheSite(root) {
		if (mountAbort) mountAbort.abort();
		const abort = new AbortController();
		mountAbort = abort;
		const signal = abort.signal;
		const scope = root && root.querySelector ? root : document;
		const listen = (node, type, fn, options) => {
			if (!node) return;
			node.addEventListener(type, fn, options ? { ...options, signal } : { signal });
		};

		document.documentElement.dataset.motion = "1";
		const nav = scope.querySelector(".nav");
		const progress = scope.querySelector(".progress");
		const burger = scope.querySelector(".burger");
		const links = scope.querySelector(".nav-links");

		const onScroll = () => {
			if (nav) nav.classList.toggle("scrolled", window.scrollY > 8);
			if (progress) {
				const height = document.documentElement.scrollHeight - window.innerHeight;
				progress.style.transform = `scaleX(${height > 0 ? window.scrollY / height : 0})`;
			}
		};
		listen(document, "scroll", onScroll, { passive: true });
		onScroll();

		if (burger && links) {
			listen(burger, "click", () => {
				const open = links.classList.toggle("open");
				burger.setAttribute("aria-expanded", open ? "true" : "false");
			});
			listen(links, "click", (event) => {
				if (event.target.closest("a")) {
					links.classList.remove("open");
					burger.setAttribute("aria-expanded", "false");
				}
			});
			listen(document, "click", (event) => {
				if (!links.classList.contains("open")) return;
				if (event.target.closest(".nav")) return;
				links.classList.remove("open");
				burger.setAttribute("aria-expanded", "false");
			});
			listen(document, "keydown", (event) => {
				if (event.key !== "Escape" || !links.classList.contains("open")) return;
				links.classList.remove("open");
				burger.setAttribute("aria-expanded", "false");
			});
		}

		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const reveals = scope.querySelectorAll(".reveal");
		if (reduce || !("IntersectionObserver" in window)) {
			reveals.forEach((el) => el.classList.add("in"));
		} else {
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (!entry.isIntersecting) return;
						entry.target.classList.add("in");
						observer.unobserve(entry.target);
					});
				},
				{ threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
			);
			signal.addEventListener("abort", () => observer.disconnect());
			reveals.forEach((el) => observer.observe(el));
		}

		scope.querySelectorAll(".filters").forEach((bar) => {
			listen(bar, "click", (event) => {
				const button = event.target.closest(".chip");
				if (!button) return;
				bar.querySelectorAll(".chip").forEach((chip) => chip.classList.remove("on"));
				button.classList.add("on");
				const filter = button.dataset.filter;
				scope.querySelectorAll(".service").forEach((card) => {
					card.hidden = filter !== "all" && card.dataset.category !== filter;
				});
			});
		});

		scope.querySelectorAll(".faq-item button").forEach((button) => {
			listen(button, "click", () => {
				const item = button.closest(".faq-item");
				const open = item.classList.toggle("open");
				button.setAttribute("aria-expanded", open ? "true" : "false");
			});
		});

		const form = scope.querySelector("#booking-form");
		if (!form) return;
		listen(form, "submit", async (event) => {
			event.preventDefault();
			const error = form.querySelector(".form-error");
			const button = form.querySelector("button[type=submit]");
			const success = scope.querySelector("#booking-success");
			if (error) error.hidden = true;
			if (button) button.disabled = true;
			const data = Object.fromEntries(new FormData(form).entries());
			const showError = (message) => {
				if (error) {
					error.textContent = message;
					error.hidden = false;
				}
				if (button) button.disabled = false;
			};
			const showSuccess = () => {
				form.hidden = true;
				if (success) success.hidden = false;
			};
			const local = location.protocol === "file:" || document.documentElement.dataset.studio === "1";
			if (local) {
				try {
					const problem = storeLocalBooking(data);
					if (problem) {
						showError(problem);
						return;
					}
					showSuccess();
				} catch {
					showError("La demande n'a pas pu être gardée dans ce navigateur.");
				}
				return;
			}
			try {
				const response = await fetch("/api/bookings", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(data),
				});
				const payload = await response.json().catch(() => ({}));
				if (!response.ok) throw new Error(payload.error || "Envoi impossible.");
				showSuccess();
			} catch (errorValue) {
				showError(errorValue.message || "Envoi impossible.");
			}
		});
	}

	globalThis.mountLaCocheSite = mountLaCocheSite;
	if (!document.getElementById("site-root")) mountLaCocheSite(document);

	if (!document.getElementById("site-root") && "BroadcastChannel" in window) {
		const channel = new BroadcastChannel("la-coche");
		channel.addEventListener("message", (event) => {
			if (event.data && event.data.type === "reload") location.reload();
		});
	}
})();
