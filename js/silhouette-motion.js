const SETTLE_MS = 480;
const STAGGER_MS = 110;
const SILHOUETTE_MS = 1000;

/** @type {Map<Element, AbortController>} */
const motionControllers = new Map();

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function supportsScrollTimeline() {
  return (
    CSS.supports("animation-timeline", "view()") ||
    CSS.supports("animation-timeline", "--panel-in")
  );
}

function panelDelayMs(panel) {
  const raw = getComputedStyle(panel).getPropertyValue("--delay").trim();
  if (!raw) return 0;
  if (raw.endsWith("ms")) return parseFloat(raw);
  if (raw.endsWith("s")) return parseFloat(raw) * 1000;
  return parseFloat(raw) || 0;
}

function viewCenter(scrollerEl) {
  const r = scrollerEl.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function isPastCenter(panel, scrollerEl, mode) {
  const pr = panel.getBoundingClientRect();
  const vc = viewCenter(scrollerEl);
  if (mode === "rows") {
    return pr.top + pr.height / 2 <= vc.y;
  }
  return pr.left + pr.width / 2 <= vc.x;
}

function isTrailingEdgeInView(panel, scrollerEl, mode) {
  const pr = panel.getBoundingClientRect();
  const sr = scrollerEl.getBoundingClientRect();
  if (mode === "rows") {
    return pr.bottom <= sr.bottom + 4 && pr.top < sr.bottom;
  }
  return pr.right <= sr.right + 4 && pr.left < sr.right;
}

function isSilhouetteMotionAnim(animation) {
  return (
    animation.animationName === "silhouette-arrive-rows" ||
    animation.animationName === "silhouette-arrive-cols"
  );
}

function timedMotionFinished(silhouette) {
  const motionAnims = silhouette.getAnimations().filter(isSilhouetteMotionAnim);
  if (motionAnims.length === 0) return false;
  return motionAnims.every((a) => a.playState === "finished");
}

function latchSilhouette(silhouette) {
  if (silhouette.classList.contains("arrived")) return;
  silhouette.classList.remove("scroll-driven", "timed-arrival");
  silhouette.classList.add("arrived");
}

function shouldUseTimedArrival(panel, scrollerEl, mode) {
  if (mode === "rows") {
    return isTrailingEdgeInView(panel, scrollerEl, mode);
  }
  return isPastCenter(panel, scrollerEl, mode);
}

function latchIfTrailingEdge(panel, silhouette, scroller, mode) {
  if (silhouette.classList.contains("arrived")) return;
  if (!isTrailingEdgeInView(panel, scroller, mode)) return;
  latchSilhouette(silhouette);
}

function shouldLatchScrollDriven(panel, silhouette, scroller, mode) {
  if (!silhouette.classList.contains("scroll-driven")) return false;
  return isTrailingEdgeInView(panel, scroller, mode);
}

/**
 * One-shot silhouette arrivals after wall rebuild.
 * @param {HTMLElement} scroller — `#view-poster` scroll root
 * @param {HTMLElement} wall — `#poster-wall`
 * @param {"rows" | "columns"} mode
 */
export function initSilhouetteMotion(scroller, wall, mode) {
  const prev = motionControllers.get(scroller);
  if (prev) prev.abort();
  const controller = new AbortController();
  motionControllers.set(scroller, controller);
  const { signal } = controller;

  const silhouettes = [...wall.querySelectorAll(".plane-silhouette")];
  const panels = [...wall.querySelectorAll(".flight-panel")];

  if (!panels.length || prefersReducedMotion() || !supportsScrollTimeline()) {
    silhouettes.forEach(latchSilhouette);
    return;
  }

  let staggerIndex = 0;
  let maxTimedEndMs = 0;

  panels.forEach((panel) => {
    const silhouette = panel.querySelector(".plane-silhouette");
    if (!silhouette) return;

    silhouette.classList.remove("arrived", "scroll-driven", "timed-arrival");

    if (shouldUseTimedArrival(panel, scroller, mode)) {
      const settleEnd = SETTLE_MS + panelDelayMs(panel);
      const delay = settleEnd + staggerIndex * STAGGER_MS;
      staggerIndex += 1;
      maxTimedEndMs = Math.max(maxTimedEndMs, delay + SILHOUETTE_MS);
      silhouette.style.setProperty("--silhouette-delay", `${delay}ms`);
      silhouette.classList.add("timed-arrival");

      const onEnd = (ev) => {
        if (ev.target !== silhouette || !isSilhouetteMotionAnim(ev)) return;
        latchSilhouette(silhouette);
      };
      silhouette.addEventListener("animationend", onEnd, { signal });

      setTimeout(() => {
        if (signal.aborted) return;
        latchIfTrailingEdge(panel, silhouette, scroller, mode);
      }, delay + SILHOUETTE_MS + 80);
    } else {
      silhouette.classList.add("scroll-driven");
    }
  });

  const checkScrollLatch = () => {
    panels.forEach((panel) => {
      const silhouette = panel.querySelector(".plane-silhouette");
      if (!silhouette || silhouette.classList.contains("arrived")) return;

      if (shouldLatchScrollDriven(panel, silhouette, scroller, mode)) {
        latchSilhouette(silhouette);
        return;
      }

      if (
        silhouette.classList.contains("timed-arrival") &&
        isTrailingEdgeInView(panel, scroller, mode) &&
        timedMotionFinished(silhouette)
      ) {
        latchSilhouette(silhouette);
      }
    });
  };

  const scheduleLatchChecks = () => {
    checkScrollLatch();
    requestAnimationFrame(checkScrollLatch);
    requestAnimationFrame(() => requestAnimationFrame(checkScrollLatch));
  };

  scroller.addEventListener("scroll", checkScrollLatch, { passive: true, signal });
  window.addEventListener("resize", checkScrollLatch, { signal });

  const observer = new IntersectionObserver(() => checkScrollLatch(), {
    root: scroller,
    threshold: [0, 0.01, 0.1, 0.25, 0.5, 0.75, 1],
  });
  panels.forEach((panel) => observer.observe(panel));
  signal.addEventListener("abort", () => observer.disconnect(), { once: true });

  scheduleLatchChecks();
  setTimeout(checkScrollLatch, SETTLE_MS + 50);
  if (maxTimedEndMs > 0) {
    setTimeout(checkScrollLatch, maxTimedEndMs + 80);
  }
}
