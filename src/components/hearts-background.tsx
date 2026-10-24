"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createAmbientBackground } from "./ambient-background";

export default function HeartsBackground() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return; // The gallery remains usable without its decorative background.
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
    camera.position.set(0, 0.2, 10);
    camera.lookAt(0, 0.2, 0);
    const hearts = createAmbientBackground(scene);
    const pointer = new THREE.Vector2();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let active = false;

    function move(event: PointerEvent) {
      const bounds = host!.getBoundingClientRect();
      pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
      active = true;
    }
    function pulse(event: PointerEvent) {
      move(event);
      hearts.pulse(pointer, motion.matches);
    }
    function leave() { active = false; }
    function out(event: PointerEvent) { if (!event.relatedTarget) leave(); }
    function release(event: PointerEvent) { if (event.pointerType === "touch") leave(); }
    // Passive listeners let Swiper keep full control of swiping and navigation.
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", pulse, { passive: true });
    window.addEventListener("pointerout", out, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("pointercancel", leave);
    window.addEventListener("blur", leave);

    function resize() {
      const { width, height } = host!.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.position.z = Math.max(9.5, 8.5 / camera.aspect);
      camera.updateProjectionMatrix();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    let frame = 0;
    let last = performance.now();
    function animate(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      hearts.update(camera, pointer, active, dt, motion.matches);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", pulse);
      window.removeEventListener("pointerout", out);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", leave);
      window.removeEventListener("blur", leave);
      hearts.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className="gallery-hearts" aria-hidden="true" />;
}
