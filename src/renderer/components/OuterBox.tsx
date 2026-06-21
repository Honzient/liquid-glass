import { RoundedBox, MeshTransmissionMaterial } from "@react-three/drei";

interface OuterBoxProps {
  width: number;
  height: number;
  depth: number;
  chromaticAberration: number;
}

export default function OuterBox({
  width,
  height,
  depth,
  chromaticAberration,
}: OuterBoxProps) {
  return (
    <RoundedBox
      args={[width, height, depth]}
      radius={0.05}
      bevelSegments={4}
    >
      <MeshTransmissionMaterial
        transmission={1}
        ior={1.5}
        thickness={0.3}
        roughness={0}
        chromaticAberration={chromaticAberration}
        samples={8}
        resolution={1024}
      />
    </RoundedBox>
  );
}
