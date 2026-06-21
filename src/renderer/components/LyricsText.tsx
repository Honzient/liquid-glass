import { Text } from "@react-three/drei";

interface LyricsTextProps {
  fontSize: number;
}

export default function LyricsText({ fontSize }: LyricsTextProps) {
  return (
    <Text
      position={[0, 0, -0.5]}
      fontSize={fontSize}
      color="#ffffff"
      anchorX="center"
      anchorY="middle"
    >
      Liquid Glass
    </Text>
  );
}
