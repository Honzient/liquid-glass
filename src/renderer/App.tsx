import { Canvas } from "@react-three/fiber";
import Tank from "./components/Tank";

export default function App() {
  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      gl={{ alpha: true, premultipliedAlpha: true }}
      camera={{ position: [0, 0, 20], fov: 12, near: 0.1, far: 100 }}
    >
      <Tank />
    </Canvas>
  );
}
