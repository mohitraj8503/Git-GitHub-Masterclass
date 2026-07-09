import Image, { type ImageProps } from "next/image";
import { imageDimensions } from "@/lib/imageDimensions";

type AssetImageProps = Omit<ImageProps, "width" | "height"> & {
  width?: number;
  height?: number;
  srcSet?: string;
};

export default function AssetImage({
  width,
  height,
  unoptimized = true,
  ...props
}: AssetImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  const dimensions = imageDimensions[src] ?? { width: 1, height: 1 };

  return (
    <Image
      {...props}
      width={width ?? dimensions.width}
      height={height ?? dimensions.height}
      unoptimized={unoptimized}
    />
  );
}
