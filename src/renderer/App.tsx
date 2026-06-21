import { Canvas } from "@react-three/fiber";
import LiquidTank from "./components/LiquidTank";
import ControlPanel from "./components/ControlPanel";
import { useAudioData } from "./hooks/useAudioData";

/**
 * Audio bridge: since the R3F Canvas creates its own React root,
 * we call useAudioData() here (for the HTML overlay) and again
 * inside LiquidTank (for shader uniforms). The singleton AudioEngine
 * is idempotent — only the first call starts it.
 */
function AudioBridge() {
  const audio = useAudioData();
  return (
    <ControlPanel
      bass={audio.bass}
      energy={audio.energy}
      treble={audio.treble}
      volume={audio.volume}
      beat={audio.beat}
    />
  );
}

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
      <AudioBridge />
    </>
  );
}
