(() => {
	document.documentElement.dataset.motion = "1";
	const nav = document.querySelector(".nav");
	const progress = document.querySelector(".progress");
	const burger = document.querySelector(".burger");
	const links = document.querySelector(".nav-links");

	const onScroll = () => {
		if (nav) nav.classList.toggle("scrolled", window.scrollY > 8);
		if (progress) {
			const height = document.documentElement.scrollHeight - window.innerHeight;
			progress.style.transform = `scaleX(${height > 0 ? window.scrollY / height : 0})`;
		}
	};
	document.addEventListener("scroll", onScroll, { passive: true });
	onScroll();

	if (burger && links) {
		burger.addEventListener("click", () => {
			const open = links.classList.toggle("open");
			burger.setAttribute("aria-expanded", open ? "true" : "false");
		});
		links.addEventListener("click", (event) => {
			if (event.target.closest("a")) {
				links.classList.remove("open");
				burger.setAttribute("aria-expanded", "false");
			}
		});
		document.addEventListener("click", (event) => {
			if (!links.classList.contains("open")) return;
			if (event.target.closest(".nav")) return;
			links.classList.remove("open");
			burger.setAttribute("aria-expanded", "false");
		});
		document.addEventListener("keydown", (event) => {
			if (event.key !== "Escape" || !links.classList.contains("open")) return;
			links.classList.remove("open");
			burger.setAttribute("aria-expanded", "false");
		});
	}

	const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const reveals = document.querySelectorAll(".reveal");
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
		reveals.forEach((el) => observer.observe(el));
	}

	document.querySelectorAll(".filters").forEach((bar) => {
		bar.addEventListener("click", (event) => {
			const button = event.target.closest(".chip");
			if (!button) return;
			bar.querySelectorAll(".chip").forEach((chip) => chip.classList.remove("on"));
			button.classList.add("on");
			const filter = button.dataset.filter;
			document.querySelectorAll(".service").forEach((card) => {
				card.hidden = filter !== "all" && card.dataset.category !== filter;
			});
		});
	});

	document.querySelectorAll(".faq-item button").forEach((button) => {
		button.addEventListener("click", () => {
			const item = button.closest(".faq-item");
			const open = item.classList.toggle("open");
			button.setAttribute("aria-expanded", open ? "true" : "false");
		});
	});

	const form = document.querySelector("#booking-form");
	if (!form) return;
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		const error = form.querySelector(".form-error");
		const button = form.querySelector("button[type=submit]");
		const success = document.querySelector("#booking-success");
		if (error) error.hidden = true;
		if (button) button.disabled = true;
		const data = Object.fromEntries(new FormData(form).entries());
		try {
			const response = await fetch("/api/bookings", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(data),
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.error || "Envoi impossible.");
			form.hidden = true;
			if (success) success.hidden = false;
		} catch (errorValue) {
			if (error) {
				error.textContent = errorValue.message || "Envoi impossible.";
				error.hidden = false;
			}
			if (button) button.disabled = false;
		}
	});
})();
