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
      {/* City HDR for reflections only (not scene background) */}
      <Environment preset="city" background={false} />

      {/* Sharp edge highlight on the glass */}
      <directionalLight position={[5, 5, 5]} intensity={1.5} />

      {/* Semi-transparent glass outer box */}
      <OuterBox
        width={tankWidth}
        height={tankHeight}
        depth={TANK_DEPTH}
      />
    </>
  );
}

export default function Tank() {
  return <Scene />;
}
