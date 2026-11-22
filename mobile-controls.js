(() => {
  "use strict";

  const keyMap = {
    left:  { key: "ArrowLeft",  code: "ArrowLeft",  keyCode: 37 },
    down:  { key: "ArrowDown",  code: "ArrowDown",  keyCode: 40 },
    up:    { key: "ArrowUp",    code: "ArrowUp",    keyCode: 38 },
    right: { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
    enter: { key: "Enter", code: "Enter", keyCode: 13 }
  };

  const pressedPointers = new Map();
  const pressedCounts = new Map();

  function dispatchKey(type, keyInfo) {
    const event = new KeyboardEvent(type, {
      key: keyInfo.key,
      code: keyInfo.code,
      bubbles: true,
      cancelable: true,
      composed: true
    });

    // Older Kade builds read keyCode/which instead of KeyboardEvent.key.
    for (const property of ["keyCode", "which"]) {
      try {
        Object.defineProperty(event, property, {
          get: () => keyInfo.keyCode
        });
      } catch (_) {}
    }

    document.dispatchEvent(event);
  }

  function press(pointerId, name, button) {
    const keyInfo = keyMap[name];
    if (!keyInfo || pressedPointers.has(pointerId)) return;

    pressedPointers.set(pointerId, { name, button });
    const count = (pressedCounts.get(name) || 0) + 1;
    pressedCounts.set(name, count);

    if (count === 1) dispatchKey("keydown", keyInfo);
    button.classList.add("is-pressed");
  }

  function release(pointerId) {
    const active = pressedPointers.get(pointerId);
    if (!active) return;

    pressedPointers.delete(pointerId);
    const count = Math.max(0, (pressedCounts.get(active.name) || 1) - 1);
    pressedCounts.set(active.name, count);

    if (count === 0) {
      dispatchKey("keyup", keyMap[active.name]);
      active.button.classList.remove("is-pressed");
    }
  }

  document.querySelectorAll(".touch-btn[data-key]").forEach((button) => {
    const name = button.dataset.key;

    button.addEventListener("contextmenu", (event) => event.preventDefault());
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      try { button.setPointerCapture(event.pointerId); } catch (_) {}
      press(event.pointerId, name, button);
    });
    button.addEventListener("pointerup", (event) => {
      event.preventDefault();
      release(event.pointerId);
    });
    button.addEventListener("pointercancel", (event) => release(event.pointerId));
    button.addEventListener("lostpointercapture", (event) => release(event.pointerId));
  });

  function releaseAll() {
    for (const [pointerId] of pressedPointers) release(pointerId);
  }

  window.addEventListener("blur", releaseAll);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseAll();
  });

  const fullscreenButton = document.getElementById("mobile-fullscreen");
  if (fullscreenButton) {
    fullscreenButton.addEventListener("click", async () => {
      const target = document.documentElement;
      try {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
          const request = target.requestFullscreen || target.webkitRequestFullscreen;
          if (request) await request.call(target);
        } else {
          const exit = document.exitFullscreen || document.webkitExitFullscreen;
          if (exit) await exit.call(document);
        }
      } catch (error) {
        console.warn("Fullscreen is unavailable in this browser:", error);
      }
    });
  }
})();
