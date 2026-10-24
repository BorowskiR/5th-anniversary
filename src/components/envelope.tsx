"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import * as THREE from "three";
import Image from "next/image";
import { createAmbientBackground } from "./ambient-background";

const LETTER_PARAGRAPHS = [
  "Od pięciu lat jesteś moja, wiem, że zawsze już będziesz ❤️",
  "Życzę Nam, aby kolejne lata mijały tak cudownie, jak te które są już za nami",
  "Kocham Cię każdego dnia coraz mocniej",
];
const SIGNATURE = "Twój Rafał 🐻";
const GREETING = "Karola";
const RECIPIENT = "Karolina Borowska";
const MESSAGE = [GREETING, ...LETTER_PARAGRAPHS, SIGNATURE].join("\n\n");
const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

function drawPaper(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff5dd";
  ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 18000; i++) {
    ctx.fillStyle = `rgba(125, 90, 45, ${Math.random() * 0.045})`;
    ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
  }
  ctx.strokeStyle = "#c6a575";
  ctx.lineWidth = 2;
  ctx.strokeRect(65, 65, 894, 894);
  ctx.strokeRect(78, 78, 868, 868);
  ctx.textAlign = "center";
  ctx.fillStyle = "#000000";
  ctx.font = '80px "Great Vibes", cursive';
  ctx.fillText(GREETING, 512, 150);
  ctx.fillStyle = "#000000";
  ctx.font = "500 54px Lora, Georgia, 'Apple Color Emoji', 'Segoe UI Emoji', serif";
  let y = 250;
  LETTER_PARAGRAPHS.forEach((paragraph) => {
    let line = "";
    for (const word of paragraph.split(" ")) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(candidate).width > 810) {
        ctx.fillText(line, 512, y);
        y += 64;
        line = word;
      } else {
        line = candidate;
      }
    }
    ctx.fillText(line, 512, y);
    y += 112;
  });
  ctx.textAlign = "right";
  ctx.font =
    "italic 500 56px Lora, Georgia, 'Apple Color Emoji', 'Segoe UI Emoji', serif";
  ctx.fillText(SIGNATURE, 875, 920);
}

function paperTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  drawPaper(canvas);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function Envelope({ onDismiss }: { onDismiss: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const openedRef = useRef(false);
  const [opened, setOpened] = useState(false);
  const [fallback, setFallback] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [dateError, setDateError] = useState("");

  const requestOpen = useCallback(() => {
    setSelectedDate("");
    setDateError("");
    setQuestionOpen(true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (questionOpen) {
      if (!dialog.open) dialog.showModal();
      dateRef.current?.focus();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [questionOpen]);

  function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Date inputs return an ISO date, independent of the displayed locale.
    if (selectedDate !== "2021-10-26") {
      setDateError("To chyba nie ten dzień. Spróbuj jeszcze raz.");
      dateRef.current?.focus();
      return;
    }
    setQuestionOpen(false);
    openedRef.current = true;
    setOpened(true);
  }

  useEffect(() => {
    const host = mountRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      const fallbackFrame = requestAnimationFrame(() => setFallback(true));
      return () => cancelAnimationFrame(fallbackFrame);
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    renderer.localClippingEnabled = true;
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute("role", "region");
    renderer.domElement.setAttribute(
      "aria-label",
      "Koperta 3D. Przeciągnij, aby obrócić. Strzałki obracają, Home przywraca widok z przodu. Kliknij kłódkę lub naciśnij Enter, aby odpowiedzieć na pytanie i otworzyć kopertę. Escape zamyka kopertę.",
    );
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
    camera.position.set(0, 0.2, 10);
    camera.lookAt(0, 0.2, 0);
    scene.add(new THREE.AmbientLight(0xfff4e5, 2.3));
    const light = new THREE.DirectionalLight(0xffe8cc, 4.5);
    light.position.set(-3, 5, 7);
    scene.add(light);
    const rim = new THREE.DirectionalLight(0xffffff, 2);
    rim.position.set(4, 1, 3);
    scene.add(rim);

    const root = new THREE.Group();
    root.position.y = 0;
    scene.add(root);
    const background = createAmbientBackground(scene, root);
    const wine = new THREE.MeshStandardMaterial({
      color: "#722d40",
      roughness: 0.78,
      side: THREE.DoubleSide,
    });
    const side = new THREE.MeshStandardMaterial({
      color: "#86394d",
      roughness: 0.85,
      side: THREE.DoubleSide,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: "#481d2b",
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    const gold = new THREE.MeshStandardMaterial({
      color: "#d9aa5c",
      metalness: 0.72,
      roughness: 0.28,
    });
    const goldDark = new THREE.MeshStandardMaterial({
      color: "#b38237",
      metalness: 0.6,
      roughness: 0.35,
    });

    // A procedural fibre texture catches the light as the real mesh rotates.
    const grainCanvas = document.createElement("canvas");
    grainCanvas.width = grainCanvas.height = 256;
    const grainContext = grainCanvas.getContext("2d")!;
    const grain = grainContext.createImageData(256, 256);
    for (let i = 0; i < grain.data.length; i += 4) {
      const value = 110 + Math.floor(Math.random() * 45);
      grain.data[i] = grain.data[i + 1] = grain.data[i + 2] = value;
      grain.data[i + 3] = 255;
    }
    grainContext.putImageData(grain, 0, 0);
    const fibres = new THREE.CanvasTexture(grainCanvas);
    fibres.wrapS = fibres.wrapT = THREE.RepeatWrapping;
    fibres.repeat.set(3, 3);
    for (const material of [wine, side, dark]) {
      material.bumpMap = fibres;
      material.bumpScale = 0.018;
    }

    function polygon(
      points: number[][],
      material: THREE.Material,
      z: number,
      parent = root,
    ) {
      const shape = new THREE.Shape();
      points.forEach(([x, y], i) =>
        i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y),
      );
      shape.closePath();
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
      mesh.position.z = z;
      parent.add(mesh);
      return mesh;
    }
    function foldedPaper(
      shape: THREE.Shape,
      material: THREE.Material,
      z: number,
      parent = root,
    ) {
      const mesh = new THREE.Mesh(
        new THREE.ExtrudeGeometry(shape, {
          depth: 0.025,
          bevelEnabled: true,
          bevelSize: 0.018,
          bevelThickness: 0.012,
          bevelSegments: 3,
          steps: 1,
          curveSegments: 20,
        }),
        material,
      );
      mesh.position.z = z;
      parent.add(mesh);
      return mesh;
    }
    function foldedTriangle(
      points: number[][],
      material: THREE.Material,
      z: number,
    ) {
      const shape = new THREE.Shape();
      points.forEach(([x, y], i) =>
        i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y),
      );
      shape.closePath();
      return foldedPaper(shape, material, z);
    }
    const backShape = new THREE.Shape();
    backShape.moveTo(-2.17, -1.35);
    backShape.lineTo(2.17, -1.35);
    backShape.quadraticCurveTo(2.25, -1.35, 2.25, -1.27);
    backShape.lineTo(2.25, 1.27);
    backShape.quadraticCurveTo(2.25, 1.35, 2.17, 1.35);
    backShape.lineTo(-2.17, 1.35);
    backShape.quadraticCurveTo(-2.25, 1.35, -2.25, 1.27);
    backShape.lineTo(-2.25, -1.27);
    backShape.quadraticCurveTo(-2.25, -1.35, -2.17, -1.35);
    foldedPaper(backShape, wine, -0.14);
    // Side gussets and the bottom fold give the pouch an actual open cavity.
    for (const x of [-2.23, 2.23]) {
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 2.53, 0.25),
        wine,
      );
      edge.position.set(x, 0, 0.015);
      root.add(edge);
    }
    const bottomFold = new THREE.Mesh(
      new THREE.BoxGeometry(4.39, 0.04, 0.28),
      wine,
    );
    bottomFold.position.set(0, -1.32, 0.02);
    root.add(bottomFold);
    foldedTriangle(
      [
        [-2.23, 1.32],
        [-2.23, -1.32],
        [0.38, -0.2],
      ],
      side,
      0.12,
    );
    foldedTriangle(
      [
        [2.23, 1.32],
        [2.23, -1.32],
        [-0.38, -0.2],
      ],
      wine,
      0.15,
    );
    foldedTriangle(
      [
        [-2.23, -1.32],
        [2.23, -1.32],
        [0.1, 0.26],
        [0, 0.29],
        [-0.1, 0.26],
      ],
      side,
      0.2,
    );
    const flap = new THREE.Group();
    flap.position.set(0, 1.35, -0.09);
    root.add(flap);
    const flapShape = new THREE.Shape();
    flapShape.moveTo(-2.23, 0);
    flapShape.lineTo(-0.12, -1.58);
    flapShape.quadraticCurveTo(0, -1.68, 0.12, -1.58);
    flapShape.lineTo(2.23, 0);
    flapShape.closePath();
    const flapMesh = foldedPaper(flapShape, wine, 0, flap);
    const flapVertices = flapMesh.geometry.attributes.position;
    for (let i = 0; i < flapVertices.count; i++) {
      // The hinge sits on the back wall; the closed tip rests over the front.
      // Opening then folds the flap behind the emerging sheet, never over it.
      flapVertices.setZ(
        i,
        flapVertices.getZ(i) +
          (Math.max(0, -flapVertices.getY(i)) / 1.65) * 0.43,
      );
    }
    flapVertices.needsUpdate = true;
    flapMesh.geometry.computeVertexNormals();
    // A fine gold line follows the folded edge of the envelope.
    const seam = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-2.2, -1.3, 0.24),
      new THREE.Vector3(0, 0.27, 0.24),
      new THREE.Vector3(2.2, -1.3, 0.24),
    ]);
    root.add(
      new THREE.Line(
        seam,
        new THREE.LineBasicMaterial({
          color: "#a35c67",
          transparent: true,
          opacity: 0.45,
        }),
      ),
    );

    const recipientCanvas = document.createElement("canvas");
    recipientCanvas.width = 1024;
    recipientCanvas.height = 256;
    const recipientTexture = new THREE.CanvasTexture(recipientCanvas);
    recipientTexture.colorSpace = THREE.SRGBColorSpace;
    function drawRecipient() {
      const ctx = recipientCanvas.getContext("2d")!;
      ctx.clearRect(0, 0, 1024, 256);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#000000";
      ctx.font = '130px "Great Vibes", cursive';
      ctx.fillText(RECIPIENT, 512, 136, 950);
      recipientTexture.needsUpdate = true;
    }
    drawRecipient();
    const recipient = new THREE.Mesh(
      new THREE.PlaneGeometry(3.55, 0.72),
      new THREE.MeshBasicMaterial({
        map: recipientTexture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    recipient.position.set(0, -0.91, 0.255);
    root.add(recipient);

    const letter = new THREE.Group();
    const texture = paperTexture();
    let fontActive = true;
    void Promise.allSettled([
      document.fonts.load('80px "Great Vibes"', `${GREETING} ${RECIPIENT}`),
      document.fonts.load("500 54px Lora", LETTER_PARAGRAPHS.join(" ")),
      document.fonts.load("italic 500 56px Lora", SIGNATURE),
    ])
      .then(() => {
        if (!fontActive) return;
        drawPaper(texture.image as HTMLCanvasElement);
        texture.needsUpdate = true;
        drawRecipient();
      })
      .catch(() => {
        // Keep the initial font fallbacks if the texture cannot be refreshed.
      });
    // Hide everything still inside the pouch, including the two rolled edges.
    // The plane follows the envelope's rotation rather than the camera.
    const mouthPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.36);
    const worldMouthPlane = mouthPlane.clone();
    const paperClipping = [worldMouthPlane];
    const paper = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.95,
      side: THREE.DoubleSide,
      clippingPlanes: paperClipping,
    });
    const sheetGeometry = new THREE.PlaneGeometry(3.25, 3.1, 24, 32);
    const positions = sheetGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      positions.setZ(i, 0.055 * Math.cos(y * 2.1));
    }
    sheetGeometry.computeVertexNormals();
    letter.add(new THREE.Mesh(sheetGeometry, paper));
    const rollMaterial = new THREE.MeshStandardMaterial({
      color: "#f2dfb8",
      roughness: 0.85,
      clippingPlanes: paperClipping,
    });
    for (const y of [-1.55, 1.55]) {
      const roll = new THREE.Mesh(
        new THREE.CylinderGeometry(0.085, 0.085, 3.39, 24),
        rollMaterial,
      );
      roll.rotation.z = Math.PI / 2;
      roll.position.set(0, y, 0.04);
      letter.add(roll);
    }
    root.add(letter);
    letter.visible = false;

    const lock = new THREE.Group();
    lock.position.set(0, -0.25, 0.38);
    root.add(lock);
    const lockShape = new THREE.Shape();
    lockShape.moveTo(-0.24, -0.23);
    lockShape.lineTo(0.24, -0.23);
    lockShape.quadraticCurveTo(0.32, -0.23, 0.32, -0.15);
    lockShape.lineTo(0.32, 0.2);
    lockShape.quadraticCurveTo(0.32, 0.28, 0.24, 0.28);
    lockShape.lineTo(-0.24, 0.28);
    lockShape.quadraticCurveTo(-0.32, 0.28, -0.32, 0.2);
    lockShape.lineTo(-0.32, -0.15);
    lockShape.quadraticCurveTo(-0.32, -0.23, -0.24, -0.23);
    const body = new THREE.Mesh(
      new THREE.ExtrudeGeometry(lockShape, {
        depth: 0.12,
        bevelEnabled: true,
        bevelSize: 0.035,
        bevelThickness: 0.035,
        bevelSegments: 3,
        steps: 1,
      }),
      gold,
    );
    lock.add(body);
    const shackle = new THREE.Group();
    shackle.position.y = 0.24;
    lock.add(shackle);
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(0.205, 0.043, 12, 32, Math.PI),
      gold,
    );
    arch.position.y = 0.19;
    shackle.add(arch);
    for (const x of [-0.205, 0.205]) {
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.043, 0.043, 0.23, 12),
        goldDark,
      );
      stem.position.set(x, 0.075, 0);
      shackle.add(stem);
    }
    const keyholeMaterial = new THREE.MeshBasicMaterial({ color: "#50331d" });
    const keyhole = new THREE.Mesh(
      new THREE.CircleGeometry(0.055, 24),
      keyholeMaterial,
    );
    keyhole.position.set(0, 0.055, 0.16);
    lock.add(keyhole);
    polygon(
      [
        [-0.025, 0.04],
        [-0.043, -0.08],
        [0.043, -0.08],
        [0.025, 0.04],
      ],
      keyholeMaterial,
      0.161,
      lock,
    );
    // Invisible generous hit area makes the small lock comfortable on touch screens.
    const hit = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 1.25),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hit.position.z = 0.2;
    lock.add(hit);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerActive = false;
    let hover = false;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const rotationTarget = new THREE.Vector2(0.18, -0.12);
    const velocity = new THREE.Vector2();
    const drag = {
      pointerId: -1,
      x: 0,
      y: 0,
      startX: 0,
      startY: 0,
      moved: false,
    };
    let returningToFront = false;
    const canvas = renderer.domElement;
    canvas.style.cursor = "grab";

    function resetView() {
      // Take the shortest route back, even after several complete turns.
      root.rotation.y =
        THREE.MathUtils.euclideanModulo(
          root.rotation.y + Math.PI,
          Math.PI * 2,
        ) - Math.PI;
      rotationTarget.set(0, 0);
      velocity.set(0, 0);
      returningToFront = true;
    }

    function updatePointer(event: PointerEvent) {
      const bounds = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      pointerActive = true;
    }
    function updateHover(event: PointerEvent) {
      updatePointer(event);
      scene.updateMatrixWorld(true);
      raycaster.setFromCamera(pointer, camera);
      // The first visible surface must belong to the lock: no clicking through the back.
      const intersection = raycaster
        .intersectObject(root, true)
        .find(({ object }) => {
          let current: THREE.Object3D | null = object;
          while (current) {
            if (!current.visible) return false;
            current = current.parent;
          }
          return true;
        });
      let object: THREE.Object3D | null = intersection?.object ?? null;
      hover = false;
      while (object) {
        if (object === lock && !openedRef.current) hover = true;
        object = object.parent;
      }
      canvas.style.cursor =
        drag.pointerId !== -1 ? "grabbing" : hover ? "pointer" : "grab";
    }
    function onDown(event: PointerEvent) {
      if (!event.isPrimary || event.button !== 0) return;
      canvas.focus({ preventScroll: true });
      canvas.setPointerCapture(event.pointerId);
      drag.pointerId = event.pointerId;
      drag.x = drag.startX = event.clientX;
      drag.y = drag.startY = event.clientY;
      drag.moved = false;
      returningToFront = false;
      velocity.set(0, 0);
      rotationTarget.set(root.rotation.y, root.rotation.x);
      updateHover(event);
      background.pulse(pointer, motion.matches);
    }
    function onMove(event: PointerEvent) {
      updatePointer(event);
      if (drag.pointerId === event.pointerId) {
        if (
          Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >
          6
        )
          drag.moved = true;
        if (drag.moved) {
          const sensitivity = (Math.PI * 2) / Math.max(canvas.clientWidth, 320);
          velocity.set(
            (event.clientX - drag.x) * sensitivity,
            (event.clientY - drag.y) * sensitivity,
          );
          rotationTarget.x += velocity.x;
          rotationTarget.y = THREE.MathUtils.clamp(
            rotationTarget.y + velocity.y,
            -1.15,
            1.15,
          );
          hover = false;
        }
        drag.x = event.clientX;
        drag.y = event.clientY;
        canvas.style.cursor = "grabbing";
      } else {
        updateHover(event);
      }
    }
    function onUp(event: PointerEvent) {
      if (drag.pointerId !== event.pointerId) return;
      const clicked = !drag.moved;
      drag.pointerId = -1;
      if (canvas.hasPointerCapture(event.pointerId))
        canvas.releasePointerCapture(event.pointerId);
      if (clicked) {
        updateHover(event);
        if (hover) {
          resetView();
          requestOpen();
        }
      } else {
        // Pointer rotation is deliberately independent of opening the letter.
        hover = false;
        canvas.style.cursor = "grab";
      }
    }
    function onCancel() {
      pointerActive = false;
      if (drag.pointerId === -1) return;
      drag.pointerId = -1;
      velocity.set(0, 0);
      hover = false;
      canvas.style.cursor = "grab";
    }
    function onLeave() {
      pointerActive = false;
      if (drag.pointerId === -1) {
        hover = false;
        canvas.style.cursor = "grab";
      }
    }
    function onKey(event: KeyboardEvent) {
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "Escape"
      ) {
        event.preventDefault();
        resetView();
        if (openedRef.current) {
          onDismiss();
        } else if (event.key === "Escape") {
          openedRef.current = false;
          setOpened(false);
        } else {
          requestOpen();
        }
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        resetView();
        return;
      }
      if (
        !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
      )
        return;
      event.preventDefault();
      returningToFront = false;
      velocity.set(0, 0);
      if (event.key === "ArrowLeft") rotationTarget.x -= 0.2;
      if (event.key === "ArrowRight") rotationTarget.x += 0.2;
      if (event.key === "ArrowUp")
        rotationTarget.y = Math.max(-1.15, rotationTarget.y - 0.15);
      if (event.key === "ArrowDown")
        rotationTarget.y = Math.min(1.15, rotationTarget.y + 0.15);
    }
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onCancel);
    canvas.addEventListener("lostpointercapture", onCancel);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("keydown", onKey);
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
    let progress = 0;
    let last = performance.now();
    let frame = 0;
    function animate(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      progress = motion.matches
        ? Number(openedRef.current)
        : THREE.MathUtils.clamp(
            progress + (openedRef.current ? dt : -dt) / 3.2,
            0,
            1,
          );
      const unlock = smooth(progress / 0.22);
      const unfold = smooth((progress - 0.12) / 0.4);
      const lift = smooth((progress - 0.52) / 0.3);
      const forward = smooth((progress - 0.82) / 0.08);
      const settle = smooth((progress - 0.9) / 0.1);
      lock.position.y = -0.25 - unlock * 0.7;
      lock.position.z = 0.38 + unlock * 0.5;
      lock.rotation.z = -unlock * 0.35;
      lock.scale.setScalar(
        (1 - smooth((progress - 0.15) / 0.2)) * (hover ? 1.06 : 1),
      );
      lock.visible = progress < 0.36;
      shackle.rotation.y = unlock * 0.9;
      shackle.position.y = 0.24 + unlock * 0.12;
      flap.rotation.x = unfold * Math.PI;
      // A full-size sheet slides out first. Once its bottom edge clears the
      // pouch, it moves towards the viewer and gently settles into place.
      // Never scale the sheet: that exposed the rolls before the paper surface.
      letter.visible = progress > 0.52;
      letter.position.set(
        0,
        -0.35 + lift * 3.4 - settle,
        0.04 + forward * 0.685,
      );
      const clipping = progress < 0.82 ? paperClipping : null;
      paper.clippingPlanes = clipping;
      rollMaterial.clippingPlanes = clipping;
      root.position.y =
        -lift * 1.65 +
        settle * 0.5 +
        (motion.matches ? 0 : Math.sin(now * 0.0008) * 0.045);
      if (drag.pointerId === -1 && !returningToFront && !motion.matches) {
        rotationTarget.x += velocity.x * dt * 20;
        rotationTarget.y = THREE.MathUtils.clamp(
          rotationTarget.y + velocity.y * dt * 20,
          -1.15,
          1.15,
        );
        velocity.multiplyScalar(Math.exp(-dt * 8));
      }
      const damping = motion.matches ? 1 : 1 - Math.exp(-dt * 12);
      root.rotation.y = THREE.MathUtils.lerp(
        root.rotation.y,
        rotationTarget.x,
        damping,
      );
      root.rotation.x = THREE.MathUtils.lerp(
        root.rotation.x,
        rotationTarget.y,
        damping,
      );
      root.rotation.z = -0.025 * (1 - lift);
      root.updateMatrixWorld(true);
      worldMouthPlane.copy(mouthPlane).applyMatrix4(root.matrixWorld);
      background.update(camera, pointer, pointerActive, dt, motion.matches);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      fontActive = false;
      observer.disconnect();
      background.dispose();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
      canvas.removeEventListener("lostpointercapture", onCancel);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("keydown", onKey);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          geometries.add(object.geometry);
          (Array.isArray(object.material)
            ? object.material
            : [object.material]
          ).forEach((material) => materials.add(material));
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      texture.dispose();
      recipientTexture.dispose();
      fibres.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [requestOpen, onDismiss]);

  return (
    <main>
      <section
        className="surprise"
        aria-label="Interaktywna koperta z niespodzianką"
      >
        <div ref={mountRef} className="envelope-canvas" />
        {opened && (
          <button
            type="button"
            className="letter-close"
            aria-label="Idź do galerii zdjęć"
            onClick={onDismiss}
          >
            IDŹ DO GALERII <span aria-hidden="true">→</span>
          </button>
        )}
        {fallback && (
          <button
            className="fallback-envelope"
            aria-label={opened ? "ZAMKNIJ" : "OTWÓRZ"}
            aria-expanded={opened}
            onClick={() => {
              if (openedRef.current) {
                onDismiss();
              } else {
                requestOpen();
              }
            }}
          >
            <span aria-hidden="true">✉</span>
            {opened && <span className="fallback-message">{MESSAGE}</span>}
          </button>
        )}
        <p className="sr-only" aria-live="polite">
          {opened ? MESSAGE : ""}
        </p>
        <dialog
          ref={dialogRef}
          className="date-dialog"
          aria-labelledby="date-question"
          onCancel={() => setQuestionOpen(false)}
          onClose={() => setQuestionOpen(false)}
        >
          <form onSubmit={submitAnswer}>
            <button
              type="button"
              className="dialog-close"
              aria-label="Zamknij pytanie"
              onClick={() => setQuestionOpen(false)}
            >
              ×
            </button>
            <div className="date-dialog-photo">
              <Image
                src="/gallery/5th-anniversary/20211101_201735.jpg"
                alt="Nasze wspomnienie z 1 listopada 2021 roku"
                fill
                sizes="(max-width: 440px) calc(100vw - 80px), 374px"
              />
            </div>
            <h2 id="date-question">Którego dnia rozpoczął się nasz związek?</h2>
            <input
              ref={dateRef}
              id="anniversary-date"
              type="date"
              aria-label="Data początku związku"
              required
              value={selectedDate}
              aria-invalid={Boolean(dateError)}
              aria-describedby={dateError ? "date-error" : undefined}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setDateError("");
              }}
            />
            <p id="date-error" className="date-error" role="alert">
              {dateError}
            </p>
            <button type="submit" className="date-submit">
              OTWÓRZ KOPERTĘ
            </button>
          </form>
        </dialog>
      </section>
    </main>
  );
}
