import NextImage, { type ImageProps } from "next/image";
import Zoom from "./Zoom";

export function Image(props: { src: string; alt: string; zoom?: boolean }) {
  const ImageComponent = props.zoom ? Zoom : NextImage;

  return (
    <div className="relative w-full h-[400px] mt-7">
      <ImageComponent
        className="object-contain"
        fill
        src={props.src}
        alt={props.alt}
      />
    </div>
  );
}
