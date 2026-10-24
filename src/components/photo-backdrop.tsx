import Image from "next/image";

export default function PhotoBackdrop({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className={`photo-backdrop${hidden ? " is-hidden" : ""}`} aria-hidden="true">
      <Image
        src="/gallery/5th-anniversary/background.jpeg"
        alt=""
        fill
        sizes="100vw"
        quality={75}
      />
    </div>
  );
}
