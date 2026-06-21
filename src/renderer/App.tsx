import { Canvas } from "@react-three/fiber";
import Tank from "./components/Tank";

export default function App() {
  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      gl={{ alpha: true, premultipliedAlpha: true }}
    >
      <Tank />
    </Canvas>
  );
}
