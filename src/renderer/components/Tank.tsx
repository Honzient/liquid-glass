import { Environment } from "@react-three/drei";
import OuterBox from "./OuterBox";
import { useViewport } from "../hooks/useViewport";

const TANK_DEPTH = 3.5;
const VIEWPORT_MARGIN = 0.88;

function Scene() {
  const { worldWidth, worldHeight } = useViewport();

  const tankWidth = worldWidth * VIEWPORT_MARGIN;
  const tankHeight = worldHeight * VIEWPORT_MARGIN;

  return (
    <>
      {/* Perspective camera: FOV 12°, far on Z for near-orthographic side-view */}
      <perspectiveCamera
        position={[0, 0, 20]}
        fov={12}
        near={0.1}
        far={100}
      />

      {/* City HDR for reflections only (not scene background — desktop shows through) */}
      <Environment preset="city" background={false} />

      {/* Sharp edge highlight on the glass */}
      <directionalLight position={[5, 5, 5]} intensity={1.5} />

      {/* Static glass outer box */}
      <OuterBox
        width={tankWidth}
        height={tankHeight}
        depth={TANK_DEPTH}
        chromaticAberration={0.04}
      />
    </>
  );
}

export default function Tank() {
  return (
    <Scene />
  );
}
