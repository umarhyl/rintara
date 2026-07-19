"use client";

import { useEffect, useRef } from "react";

type ParticleFieldVariant = "hero" | "auth";

type Particle = {
  angle: number;
  colorIndex: number;
  depth: number;
  isDash: boolean;
  orbit: number;
  phase: number;
  size: number;
  speed: number;
};

type PointerPosition = {
  clientX: number;
  clientY: number;
  currentX: number;
  currentY: number;
  inside: boolean;
  strength: number;
  targetX: number;
  targetY: number;
};

type PerformanceNavigator = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

const TAU = Math.PI * 2;

function createRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function createParticles(count: number, variant: ParticleFieldVariant): Particle[] {
  const random = createRandom(variant === "hero" ? 7_191 : 11_827);
  const orbitCount = 4;

  return Array.from({ length: count }, (_, index) => {
    const orbit = index % orbitCount;
    const evenAngle = (Math.floor(index / orbitCount) / Math.ceil(count / orbitCount)) * TAU;
    const colorRoll = random();

    return {
      angle: evenAngle + (random() - 0.5) * 0.28,
      colorIndex: colorRoll > 0.91 ? 3 : colorRoll > 0.78 ? 2 : colorRoll > 0.62 ? 1 : 0,
      depth: 0.65 + random() * 0.7,
      isDash: random() > 0.48,
      orbit,
      phase: random() * TAU,
      size: 0.95 + random() * 1.35,
      speed: (orbit % 2 === 1 ? -1 : 1) * (0.82 + random() * 0.5),
    };
  });
}

function readRgb(style: CSSStyleDeclaration, property: string, fallback: [number, number, number]) {
  const values = style
    .getPropertyValue(property)
    .trim()
    .split(/\s+/)
    .map(Number);

  return values.length === 3 && values.every(Number.isFinite) ? values : fallback;
}

function rgba(color: number[], alpha: number) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

export function PointerParticleField({ variant }: { variant: ParticleFieldVariant }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const drawingContext = canvasElement.getContext("2d");
    if (!drawingContext) return;

    const canvas = canvasElement;
    const context = drawingContext;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const performanceNavigator = navigator as PerformanceNavigator;
    const connection = performanceNavigator.connection;
    const saveData = connection?.saveData === true;
    const memory = performanceNavigator.deviceMemory;
    const processors = performanceNavigator.hardwareConcurrency || 8;
    const reducedQuality = processors <= 4 || (memory !== undefined && memory <= 4);
    const veryLowPower = processors <= 2 || (memory !== undefined && memory <= 2);
    const targetFrameInterval = 1_000 / (reducedQuality ? 24 : 30);
    const pointer: PointerPosition = {
      clientX: 0,
      clientY: 0,
      currentX: 0,
      currentY: 0,
      inside: false,
      strength: 0,
      targetX: 0,
      targetY: 0,
    };

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let palette: number[][] = [];
    let visible = true;
    let pageVisible = !document.hidden;
    let pointerListening = false;
    let animationFrame = 0;
    let boundsFrame = 0;
    let lastPaint = 0;
    let canvasBounds = canvas.getBoundingClientRect();
    let darkTheme = document.documentElement.classList.contains("dark");

    const isStatic = () =>
      motionQuery.matches ||
      !finePointerQuery.matches ||
      saveData ||
      veryLowPower;
    const shouldAnimate = () => visible && pageVisible && !isStatic() && width > 0 && height > 0;

    function readPalette() {
      const style = getComputedStyle(document.documentElement);
      darkTheme = document.documentElement.classList.contains("dark");
      palette = [
        readRgb(style, "--particle-primary-rgb", [37, 68, 220]),
        readRgb(style, "--particle-accent-rgb", [147, 51, 234]),
        readRgb(style, "--particle-opportunity-rgb", [234, 88, 12]),
        readRgb(style, "--particle-success-rgb", [5, 150, 105]),
      ];
    }

    function updatePointerPosition() {
      if (!pointerListening) return;

      const inside =
        pointer.clientX >= canvasBounds.left &&
        pointer.clientX <= canvasBounds.right &&
        pointer.clientY >= canvasBounds.top &&
        pointer.clientY <= canvasBounds.bottom;

      pointer.inside = inside;
      if (inside) {
        pointer.targetX = pointer.clientX - canvasBounds.left;
        pointer.targetY = pointer.clientY - canvasBounds.top;
      }

    }

    function draw(timestamp: number) {
      const seconds = isStatic() ? 0 : timestamp / 1_000;
      const restingCenterX = width * (variant === "hero" ? 0.56 : 0.61);
      const restingCenterY = height * (variant === "hero" ? 0.49 : 0.46);
      const baseRadiusX = Math.min(width * (variant === "hero" ? 0.58 : 0.54), height * (variant === "hero" ? 0.8 : 0.5));
      const baseRadiusY = Math.min(height * 0.48, width * (variant === "hero" ? 0.43 : 0.55));
      const pointerRadius = Math.min(250, Math.max(180, width * 0.16));
      const targetStrength = pointer.inside ? 1 : 0;

      pointer.currentX += (pointer.targetX - pointer.currentX) * 0.16;
      pointer.currentY += (pointer.targetY - pointer.currentY) * 0.16;
      pointer.strength += (targetStrength - pointer.strength) * 0.14;

      const centerX =
        restingCenterX +
        Math.max(-52, Math.min(52, (pointer.currentX - width * 0.5) * 0.08)) * pointer.strength;
      const centerY =
        restingCenterY +
        Math.max(-36, Math.min(36, (pointer.currentY - height * 0.5) * 0.075)) * pointer.strength;

      context.clearRect(0, 0, width, height);

      if (pointer.strength > 0.015) {
        const halo = context.createRadialGradient(
          pointer.currentX,
          pointer.currentY,
          0,
          pointer.currentX,
          pointer.currentY,
          pointerRadius * 1.12,
        );
        halo.addColorStop(0, rgba(palette[0] ?? [37, 68, 220], darkTheme ? 0.12 * pointer.strength : 0.13 * pointer.strength));
        halo.addColorStop(0.56, rgba(palette[1] ?? [147, 51, 234], darkTheme ? 0.045 * pointer.strength : 0.035 * pointer.strength));
        halo.addColorStop(1, "rgba(0, 0, 0, 0)");
        context.fillStyle = halo;
        context.fillRect(0, 0, width, height);
      }

      context.lineCap = "round";

      for (const particle of particles) {
        const orbitScale = 0.48 + particle.orbit * 0.17;
        const orbitAngle = particle.angle + seconds * (TAU / (40 + particle.orbit * 7)) * particle.speed;
        const breathing = 1 + Math.sin(seconds * 0.16 + particle.phase) * 0.04;
        const wobble = Math.sin(orbitAngle * 3 + particle.phase + seconds * 0.13) * (7 + particle.orbit * 2.4);
        let x = centerX + Math.cos(orbitAngle) * baseRadiusX * orbitScale * breathing;
        let y = centerY + Math.sin(orbitAngle) * baseRadiusY * orbitScale + wobble;
        const deltaX = x - pointer.currentX;
        const deltaY = y - pointer.currentY;
        const distance = Math.hypot(deltaX, deltaY) || 1;
        const influence = Math.max(0, 1 - distance / pointerRadius) ** 2 * pointer.strength;

        if (influence > 0) {
          const push = influence * (65 + particle.depth * 35);
          x += (deltaX / distance) * push - (deltaY / distance) * influence * 14;
          y += (deltaY / distance) * push + (deltaX / distance) * influence * 14;
        }

        const color = palette[particle.colorIndex] ?? palette[0] ?? [37, 68, 220];
        const edgeFade = Math.min(1, x / 90, (width - x) / 90, y / 80, (height - y) / 80);
        const alpha = Math.min(0.94, Math.max(0, edgeFade) * (darkTheme ? 0.62 : 0.68) * particle.depth * (1 + influence * 0.7));
        const size = particle.size * particle.depth * (1 + influence * 0.95);

        if (particle.isDash) {
          const tangentX = -Math.sin(orbitAngle);
          const tangentY = Math.cos(orbitAngle);
          const dashLength = (4.2 + size * 2.35) * (1 + influence * 0.45);
          context.beginPath();
          context.moveTo(x - tangentX * dashLength * 0.5, y - tangentY * dashLength * 0.5);
          context.lineTo(x + tangentX * dashLength * 0.5, y + tangentY * dashLength * 0.5);
          context.lineWidth = Math.max(1.1, size * 0.82);
          context.strokeStyle = rgba(color, alpha);
          context.stroke();
        } else {
          context.beginPath();
          context.arc(x, y, Math.max(1.4, size * 1.25), 0, TAU);
          context.fillStyle = rgba(color, alpha * (0.18 + influence * 0.14));
          context.fill();
          context.beginPath();
          context.arc(x, y, Math.max(0.9, size * 0.68), 0, TAU);
          context.fillStyle = rgba(color, alpha);
          context.fill();
        }
      }

    }

    function tick(timestamp: number) {
      animationFrame = 0;
      if (!shouldAnimate()) return;

      if (timestamp - lastPaint >= targetFrameInterval) {
        draw(timestamp);
        lastPaint = timestamp;
      }

      animationFrame = window.requestAnimationFrame(tick);
    }

    function stopAnimation() {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }

    function startAnimation() {
      if (!shouldAnimate() || animationFrame) return;
      animationFrame = window.requestAnimationFrame(tick);
    }

    function paintStaticFrame() {
      stopAnimation();
      pointer.inside = false;
      pointer.strength = 0;
      draw(0);
    }

    function handlePointerMove(event: PointerEvent) {
      pointer.clientX = event.clientX;
      pointer.clientY = event.clientY;
      updatePointerPosition();
    }

    function handlePointerExit(event: PointerEvent) {
      if (event.relatedTarget) return;
      pointer.inside = false;
    }

    function handleWindowBlur() {
      pointer.inside = false;
    }

    function refreshCanvasBounds() {
      boundsFrame = 0;
      canvasBounds = canvas.getBoundingClientRect();
      updatePointerPosition();
    }

    function scheduleCanvasBoundsRefresh() {
      if (boundsFrame) return;
      boundsFrame = window.requestAnimationFrame(refreshCanvasBounds);
    }

    function removePointerListeners() {
      if (!pointerListening) return;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerout", handlePointerExit);
      window.removeEventListener("scroll", scheduleCanvasBoundsRefresh);
      window.removeEventListener("blur", handleWindowBlur);
      if (boundsFrame) window.cancelAnimationFrame(boundsFrame);
      boundsFrame = 0;
      pointerListening = false;
      pointer.inside = false;
    }

    function syncPointerListeners() {
      const canTrackPointer =
        visible &&
        pageVisible &&
        finePointerQuery.matches &&
        !motionQuery.matches &&
        !saveData &&
        !veryLowPower;

      if (canTrackPointer && !pointerListening) {
        pointerListening = true;
        window.addEventListener("pointermove", handlePointerMove, { passive: true });
        window.addEventListener("pointerout", handlePointerExit, { passive: true });
        window.addEventListener("scroll", scheduleCanvasBoundsRefresh, { passive: true });
        window.addEventListener("blur", handleWindowBlur);
      } else if (!canTrackPointer) {
        removePointerListeners();
      }
    }

    function syncMotionMode() {
      syncPointerListeners();
      if (isStatic()) paintStaticFrame();
      else startAnimation();
    }

    function handleVisibilityChange() {
      pageVisible = !document.hidden;
      if (pageVisible) syncMotionMode();
      else {
        removePointerListeners();
        stopAnimation();
      }
    }

    function resizeCanvas() {
      const bounds = canvas.getBoundingClientRect();
      canvasBounds = bounds;
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const compactViewport = width < 768;
      const dprCap = compactViewport || veryLowPower ? 1 : reducedQuality ? 1.15 : 1.25;
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const maxParticles = compactViewport
        ? variant === "hero"
          ? 80
          : 64
        : reducedQuality
          ? variant === "hero"
            ? 112
            : 88
          : variant === "hero"
            ? 160
            : 120;
      const minParticles = compactViewport
        ? variant === "hero"
          ? 48
          : 40
        : variant === "hero"
          ? 64
          : 52;
      const areaPerParticle = reducedQuality ? 8_000 : 6_800;
      const count = Math.min(
        maxParticles,
        Math.max(minParticles, Math.round((width * height) / areaPerParticle)),
      );
      particles = createParticles(count, variant);
      pointer.targetX = pointer.currentX = width * 0.5;
      pointer.targetY = pointer.currentY = height * 0.5;

      if (!visible || !pageVisible) {
        stopAnimation();
      } else if (isStatic()) paintStaticFrame();
      else {
        draw(performance.now());
        startAnimation();
      }
    }

    const resizeObserver = new ResizeObserver(resizeCanvas);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? false;
        if (visible) syncMotionMode();
        else {
          removePointerListeners();
          stopAnimation();
        }
      },
      { rootMargin: "80px" },
    );
    const themeObserver = new MutationObserver(() => {
      readPalette();
      if (visible && pageVisible && width > 0 && height > 0) {
        draw(isStatic() ? 0 : performance.now());
      }
    });

    readPalette();
    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    motionQuery.addEventListener("change", syncMotionMode);
    finePointerQuery.addEventListener("change", syncMotionMode);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    syncMotionMode();

    return () => {
      stopAnimation();
      removePointerListeners();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      motionQuery.removeEventListener("change", syncMotionMode);
      finePointerQuery.removeEventListener("change", syncMotionMode);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      className="ambient-pointer-field absolute inset-0 size-full"
      aria-hidden="true"
      data-pointer-field={variant}
    />
  );
}
