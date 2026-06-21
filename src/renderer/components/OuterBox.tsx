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
        opacity={0.15}
        roughness={0.05}
        metalness={0.2}
        clearcoat={1}
        clearcoatRoughness={0.1}
        envMapIntensity={2.5}
      />
    </RoundedBox>
  );
}
