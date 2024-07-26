import React from "react";
import { Zoom } from "./Zoom";

export function Step(props: {
  children: React.ReactNode;
  image?: { src: string; alt: string };
}) {
  if (!props.image) {
    return props.children;
  }

  return (
    <div className="nx-mt-6 block lg:flex lg:flex-row">
      <div className="lg:flex-1">{props.children}</div>
      <div className="lg:flex-1 relative h-[320px]">
        <Zoom
          className="object-contain"
          src={props.image.src}
          alt={props.image.alt}
          fill
        />
      </div>
    </div>
  );
}
