import { RoundedBox } from "@react-three/drei";

interface OuterBoxProps {
  width: number;
  height: number;
  depth: number;
}

export default function OuterBox({ width, height, depth }: OuterBoxProps) {
  return (
    <RoundedBox args={[width, height, depth]} radius={0.05} bevelSegments={4}>
      <meshPhysicalMaterial
        transparent={true}
        transmission={0.95}
        opacity={1}
        ior={1.52}
        thickness={0.5}
        roughness={0.02}
        metalness={0.05}
        clearcoat={1}
        clearcoatRoughness={0.05}
        envMapIntensity={3.0}
        color="#f0f5ff"
      />
    </RoundedBox>
  );
}
