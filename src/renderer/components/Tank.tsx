import { Environment } from "@react-three/drei";
import OuterBox from "./OuterBox";
import InnerBox from "./InnerBox";
import LyricsText from "./LyricsText";
import { useViewport } from "../hooks/useViewport";

const TANK_DEPTH = 3.5;
const VIEWPORT_MARGIN = 0.88;
const GLASS_THICKNESS = 0.2;
const WATER_HEIGHT_RATIO = 0.6;

function Scene() {
  const { worldWidth, worldHeight } = useViewport();

  const outerWidth = worldWidth * VIEWPORT_MARGIN;
  const outerHeight = worldHeight * VIEWPORT_MARGIN;

  // Inner water body: X/Z reduced by glass thickness gap, Y = 60% of outer
  const innerWidth = outerWidth - GLASS_THICKNESS * 2;
  const innerDepth = TANK_DEPTH - GLASS_THICKNESS * 2;
  const innerHeight = outerHeight * WATER_HEIGHT_RATIO;

  // Position water body at bottom of tank
  const waterY = -outerHeight * 0.2;

  // Font size ~1/5 of tank (outer) height
  const fontSize = outerHeight / 5;

  return (
    <>
      <Environment preset="city" background={false} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />

      {/* Outer glass shell */}
      <OuterBox width={outerWidth} height={outerHeight} depth={TANK_DEPTH} />

      {/* Inner water body + suspended lyrics */}
      <group position={[0, waterY, 0]}>
        <InnerBox width={innerWidth} height={innerHeight} depth={innerDepth} />
        <LyricsText fontSize={fontSize} />
      </group>
    </>
  );
}

export default function Tank() {
  return <Scene />;
}
