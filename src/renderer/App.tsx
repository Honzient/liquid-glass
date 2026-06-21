import { Canvas } from "@react-three/fiber";
import LiquidTank from "./components/LiquidTank";
import ControlPanel from "./components/ControlPanel";

/**
 * Liquid Glass — Desktop Lyrics App
 *
 * Architecture:
 *   ┌──────────────────────────────────────────┐
 *   │          Electron transparent window       │
 *   │  ┌────────────────────────────────────┐   │
 *   │  │   ControlPanel (HTML overlay)       │   │
 *   │  │   — Audio meters placeholder        │   │
 *   │  │   — Lyrics info placeholder         │   │
 *   │  ├────────────────────────────────────┤   │
 *   │  │   R3F Canvas (alpha: true)          │   │
 *   │  │   ┌──────────────────────────────┐ │   │
 *   │  │   │  GlassSurface (SDF + Fresnel) │ │   │
 *   │  │   │  ┌────────────────────────┐  │ │   │
 *   │  │   │  │  FBO (2048²)            │  │ │   │
 *   │  │   │  │  FluidBody + LyricsText │  │ │   │
 *   │  │   │  └────────────────────────┘  │ │   │
 *   │  │   └──────────────────────────────┘ │   │
 *   │  └────────────────────────────────────┘   │
 *   └──────────────────────────────────────────┘
 */
export default function App() {
  return (
    <>
      <Canvas
        style={{ width: "100%", height: "100%" }}
        gl={{ alpha: true, premultipliedAlpha: true }}
        camera={{ position: [0, 0, 20], fov: 12, near: 0.1, far: 100 }}
      >
        <LiquidTank />
      </Canvas>
      <ControlPanel />
    </>
  );
}
