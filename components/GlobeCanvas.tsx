"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Globe2 } from "lucide-react";

export default function GlobeCanvas() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = host.current;
    if (!element) return;

    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !coarsePointer,
        powerPreference: "low-power",
      });
    } catch {
      const timer = window.setTimeout(() => setFailed(true), 0);
      return () => window.clearTimeout(timer);
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarsePointer ? 1.25 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    element.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 20);
    camera.position.set(0, 0, 3.7);
    const geometry = new THREE.SphereGeometry(1, 64, 48);
    const material = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 6, specular: 0x19384c });
    const globe = new THREE.Mesh(geometry, material);
    globe.rotation.y = -0.4;
    globe.rotation.x = 0.12;
    scene.add(globe);
    scene.add(new THREE.AmbientLight(0xffffff, 1.35));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(4, 2, 5);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x63c9ee, 0.6);
    rim.position.set(-4, 1, -3);
    scene.add(rim);

    const controls = new OrbitControls(camera, renderer.domElement);
    // Let vertical swipes scroll the page; horizontal drags still rotate Earth.
    // OrbitControls defaults to touch-action:none, which traps mobile scrolling.
    renderer.domElement.style.touchAction = "pan-y";
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.75;
    controls.minPolarAngle = Math.PI * 0.18;
    controls.maxPolarAngle = Math.PI * 0.82;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = true;
    let frame = 0;
    let lastFrameTime = 0;
    let contextLost = false;
    let disposed = false;
    let texture: THREE.Texture | undefined;

    const render = () => { if (!contextLost) renderer.render(scene, camera); };
    const resize = () => {
      const size = element.clientWidth;
      if (!size) return;
      camera.aspect = 1;
      camera.updateProjectionMatrix();
      renderer.setSize(size, size, false);
      render();
    };
    const tick = (now: number) => {
      frame = 0;
      if (!inView || document.hidden || motion.matches || contextLost) return;
      // A 30fps mobile cap avoids continuously saturating iOS WebGL on scroll.
      if (!coarsePointer || now - lastFrameTime >= 1000 / 30) {
        controls.update(lastFrameTime ? (now - lastFrameTime) / 1000 : 1 / 60);
        render();
        lastFrameTime = now;
      }
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!frame && inView && !document.hidden && !motion.matches && !contextLost)
        frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      lastFrameTime = 0;
    };
    const onContextLost = (event: Event) => {
      event.preventDefault(); // Allow WebKit to restore its WebGL context.
      contextLost = true;
      stop();
      setFailed(true);
    };
    const onContextRestored = () => {
      contextLost = false;
      setFailed(false);
      resize();
      start();
    };
    const updateMotion = () => {
      controls.autoRotate = !motion.matches;
      controls.enableDamping = !motion.matches;
      if (motion.matches) { stop(); render(); } else start();
    };
    const onControlChange = () => { if (motion.matches) render(); };
    const onVisibility = () => { if (document.hidden) stop(); else start(); };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
      if (event.key === "ArrowUp" || event.key === "ArrowDown") globe.rotation.x += direction * 0.16;
      else globe.rotation.y += direction * 0.2;
      render();
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) start(); else stop();
    });
    observer.observe(element);
    const resizer = new ResizeObserver(resize);
    resizer.observe(element);
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);
    controls.addEventListener("change", onControlChange);
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", onVisibility);
    element.addEventListener("keydown", onKeyDown);

    new THREE.TextureLoader().load(
      "/images/blue-marble.webp",
      (loaded) => {
        if (disposed) { loaded.dispose(); return; }
        texture = loaded;
        texture.colorSpace = THREE.SRGBColorSpace;
        material.map = texture;
        material.needsUpdate = true;
        render();
        setReady(true);
      },
      undefined,
      () => { if (!disposed) setFailed(true); },
    );
    resize();
    updateMotion();

    return () => {
      disposed = true;
      stop();
      observer.disconnect();
      resizer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
      controls.removeEventListener("change", onControlChange);
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", onVisibility);
      element.removeEventListener("keydown", onKeyDown);
      controls.dispose();
      texture?.dispose();
      material.dispose();
      geometry.dispose();
      renderer.dispose();
      renderer.forceContextLoss(); // Release the GPU context when navigating away.
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={host}
      className="globe-canvas"
      role="img"
      aria-label="Interactive three-dimensional Earth. Drag to rotate the globe, or use the arrow keys when focused."
      tabIndex={0}
    >
      {(!ready || failed) && <Globe2 className="globe-fallback" strokeWidth={0.6} aria-hidden="true" />}
      <span className="sr-only">NASA Blue Marble Earth imagery.</span>
    </div>
  );
}
