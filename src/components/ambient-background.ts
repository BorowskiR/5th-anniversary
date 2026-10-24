import * as THREE from "three";
import { createEnvelopeHalo } from "./envelope-halo";

type DriftingHeart = {
  object: THREE.LineLoop<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  anchor: THREE.Vector2;
  phase: number;
  speed: number;
  depth: number;
};

function heartGeometry(radius: number) {
  const vertices = Array.from({ length: 96 }, (_, i) => {
    const t = i / 96 * Math.PI * 2;
    return new THREE.Vector3(
      Math.pow(Math.sin(t), 3) * radius,
      (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16 * radius,
      0,
    );
  });
  return new THREE.BufferGeometry().setFromPoints(vertices);
}

function createEnvelopeLighting(group: THREE.Group, envelope: THREE.Group) {
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 256;
  const ctx = glowCanvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,255,255,.7)");
  gradient.addColorStop(0.2, "rgba(255,255,255,.46)");
  gradient.addColorStop(0.5, "rgba(255,255,255,.12)");
  gradient.addColorStop(0.8, "rgba(255,255,255,.015)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  const glowGeometry = new THREE.PlaneGeometry(1, 1);
  const poolMaterial = new THREE.MeshBasicMaterial({
    map: glowTexture,
    color: "#d9d0c9",
    transparent: true,
    opacity: 0.025,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const lightPool = new THREE.Mesh(glowGeometry, poolMaterial);
  lightPool.scale.set(7.2, 1.8, 1);
  group.add(lightPool);
  const halo = createEnvelopeHalo();
  group.add(halo.mesh);
  // A very weak real light also gives the bottom folds a warm reflected tint.
  const bounceLight = new THREE.PointLight("#e5d3c5", 0.4, 6, 2);
  group.add(bounceLight);
  const lightOffset = new THREE.Vector2();

  return {
    update(camera: THREE.PerspectiveCamera, elapsed: number, dt: number, reducedMotion: boolean) {
      const lightDamping = reducedMotion ? 1 : 1 - Math.exp(-dt * 4);
      const targetX = reducedMotion ? 0 : Math.sin(envelope.rotation.y) * 0.38 + Math.sin(envelope.rotation.z) * 0.12;
      const targetY = reducedMotion ? 0 : Math.sin(envelope.rotation.x) * 0.18;
      lightOffset.x = THREE.MathUtils.lerp(lightOffset.x, targetX, lightDamping);
      lightOffset.y = THREE.MathUtils.lerp(lightOffset.y, targetY, lightDamping);
      const breath = reducedMotion ? 0 : Math.sin(elapsed * 0.8) * 0.002;
      lightPool.position.set(envelope.position.x + lightOffset.x, envelope.position.y - 1.72 + lightOffset.y, -1.4);
      lightPool.rotation.z = lightOffset.x * 0.08;
      lightPool.scale.x = 7.2 - Math.abs(lightOffset.x) * 0.6;
      poolMaterial.opacity = 0.025 + breath;
      halo.update(camera, envelope, 0.18 + breath * 3);
      bounceLight.position.set(envelope.position.x + lightOffset.x, envelope.position.y - 1.9 + lightOffset.y, 1);
    },
    dispose() {
      glowTexture.dispose();
      bounceLight.dispose();
    },
  };
}

/** Shared interactive hearts, with backlighting when an envelope is provided. */
export function createAmbientBackground(scene: THREE.Scene, envelope?: THREE.Group) {
  const group = new THREE.Group();
  scene.add(group);
  const cursor = new THREE.Vector2();
  let influence = 0;
  let elapsed = 0;

  const lighting = envelope ? createEnvelopeLighting(group, envelope) : null;

  const hearts: DriftingHeart[] = [];
  for (let i = 0; i < 26; i++) {
    const radius = 0.16 + Math.random() * 0.29;
    const material = new THREE.LineBasicMaterial({
      color: "#c7374c",
      transparent: true,
      opacity: 0.18 + Math.random() * 0.18,
      depthWrite: false,
    });
    const object = new THREE.LineLoop(heartGeometry(radius), material);
    group.add(object);
    hearts.push({
      object,
      // Most hearts frame the letter; a few smaller ones fill the distant layer.
      anchor: new THREE.Vector2(
        i < 18 ? (i % 2 ? -1 : 1) * (0.48 + Math.random() * 0.48) : Math.random() * 1.9 - 0.95,
        Math.random() * 1.9 - 0.95,
      ),
      phase: Math.random() * Math.PI * 2,
      speed: 0.08 + Math.random() * 0.08,
      depth: -4 - Math.random() * 4,
    });
  }

  const pulseGeometry = heartGeometry(1);
  const pulses = Array.from({ length: 4 }, () => {
    const material = new THREE.LineBasicMaterial({ color: "#d64054", transparent: true, opacity: 0, depthWrite: false });
    const object = new THREE.LineLoop(pulseGeometry, material);
    object.visible = false;
    group.add(object);
    return { object, age: 2, anchor: new THREE.Vector2() };
  });
  let nextPulse = 0;

  function repel(x: number, y: number) {
    const dx = x - cursor.x;
    const dy = y - cursor.y;
    const distance = Math.hypot(dx, dy);
    const strength = Math.pow(Math.max(0, 1 - distance / 0.38), 2) * influence * 0.14;
    return [dx / Math.max(distance, 0.015) * strength, dy / Math.max(distance, 0.015) * strength];
  }

  return {
    pulse(pointer: THREE.Vector2, reducedMotion: boolean) {
      if (reducedMotion) return;
      const pulse = pulses[nextPulse++ % pulses.length];
      pulse.anchor.copy(pointer);
      pulse.age = 0;
      pulse.object.visible = true;
    },
    update(camera: THREE.PerspectiveCamera, pointer: THREE.Vector2, active: boolean, dt: number, reducedMotion: boolean) {
      if (!reducedMotion) elapsed += dt;
      const damping = 1 - Math.exp(-dt * 5);
      cursor.lerp(pointer, damping);
      influence = THREE.MathUtils.lerp(influence, active && !reducedMotion ? 1 : 0, damping);
      const halfHeightAt = (z: number) => Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - z);
      hearts.forEach(({ object, anchor, phase, speed, depth }) => {
        const x = anchor.x + Math.sin(elapsed * speed + phase) * 0.035;
        const y = anchor.y + Math.cos(elapsed * speed * 0.7 + phase) * 0.045;
        const [pushX, pushY] = repel(x, y);
        const halfHeight = halfHeightAt(depth);
        object.position.set((x + pushX - cursor.x * influence * 0.02) * halfHeight * camera.aspect, (y + pushY - cursor.y * influence * 0.02) * halfHeight + camera.position.y, depth);
        // A small sway keeps the heart silhouette upright and recognizable.
        object.rotation.set(Math.sin(elapsed * speed + phase) * 0.18, Math.cos(elapsed * speed + phase) * 0.2, Math.sin(elapsed * speed * 0.6 + phase) * 0.22);
      });
      pulses.forEach((pulse) => {
        pulse.age = reducedMotion ? 2 : pulse.age + dt;
        pulse.object.visible = pulse.age < 1.6;
        if (!pulse.object.visible) return;
        const halfHeight = halfHeightAt(-3.5);
        pulse.object.position.set(pulse.anchor.x * halfHeight * camera.aspect, pulse.anchor.y * halfHeight + camera.position.y, -3.5);
        pulse.object.scale.setScalar(0.08 + pulse.age * 1.1);
        pulse.object.material.opacity = Math.pow(1 - pulse.age / 1.6, 2) * 0.25;
      });
      lighting?.update(camera, elapsed, dt, reducedMotion);
    },
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      group.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineLoop) {
          geometries.add(object.geometry);
          materials.add(object.material as THREE.Material);
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      lighting?.dispose();
      group.removeFromParent();
    },
  };
}
