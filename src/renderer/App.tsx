import { Canvas } from "@react-three/fiber";

export default function App() {
  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      gl={{ alpha: true, premultipliedAlpha: true }}
    >
      <ambientLight intensity={0.5} />
    </Canvas>
  );
}
