import { useThree } from "@react-three/fiber";

export function useViewport() {
  const { viewport, size } = useThree();
  return {
    pixelWidth: size.width,
    pixelHeight: size.height,
    worldWidth: viewport.width,
    worldHeight: viewport.height,
    aspect: size.width / size.height,
  };
}
