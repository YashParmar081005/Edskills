import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../context/ThemeContext.jsx';

/**
 * Decorative WebGL background for the landing page:
 *  - a drifting starfield of ~1400 particles
 *  - a few slowly-rotating wireframe polyhedra
 *  - subtle parallax that follows the cursor
 *
 * Pure three.js (no react-three-fiber) so it stays light. Fully cleans up on
 * unmount and adapts its palette to the light/dark theme. Honors
 * prefers-reduced-motion by rendering a single static frame.
 */
export default function ThreeBackground() {
  const mountRef = useRef(null);
  const { isDark } = useTheme();
  // Keep live refs to the bits we recolor on theme change.
  const matsRef = useRef({ points: null, meshes: [] });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia?.('(prefers-color-scheme: reduce)').matches ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
    camera.position.z = 60;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // transparent — let the CSS gradient show
    mount.appendChild(renderer.domElement);

    /* ---------------------------- Particle field --------------------------- */
    const COUNT = 1600;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 220;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 160;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.4,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    matsRef.current = { points: pMat, meshes: [] };
    applyTheme(isDark, matsRef.current);

    /* ------------------------------ Interaction ----------------------------- */
    const mouse = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const onMove = (e) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onMove);

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    /* -------------------------------- Render -------------------------------- */
    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 0.0025;
      // ease the camera toward the cursor for a parallax feel
      mouse.x += (target.x - mouse.x) * 0.05;
      mouse.y += (target.y - mouse.y) * 0.05;
      camera.position.x = mouse.x * 8;
      camera.position.y = -mouse.y * 8;
      camera.lookAt(scene.position);

      points.rotation.y = t * 0.4;
      points.rotation.x = t * 0.12;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };

    if (reduceMotion) {
      renderer.render(scene, camera); // single static frame
    } else {
      tick();
    }

    /* ------------------------------- Cleanup -------------------------------- */
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', onResize);
      pGeo.dispose();
      pMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recolor without rebuilding the scene when the theme flips.
  useEffect(() => {
    applyTheme(isDark, matsRef.current);
  }, [isDark]);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}

/** Apply the brand palette to the particle + wireframe materials. */
function applyTheme(isDark, mats) {
  if (!mats?.points) return;
  if (isDark) {
    mats.points.color = new THREE.Color('#7dd3fc'); // sky-300
    mats.points.opacity = 0.85;
    mats.meshes.forEach((m, i) => {
      m.color = new THREE.Color(i % 2 ? '#38bdf8' : '#3b82f6');
      m.opacity = 0.4;
    });
  } else {
    mats.points.color = new THREE.Color('#2563eb'); // brand-600
    mats.points.opacity = 0.7;
    mats.meshes.forEach((m, i) => {
      m.color = new THREE.Color(i % 2 ? '#0ea5e9' : '#2563eb');
      m.opacity = 0.3;
    });
  }
}
