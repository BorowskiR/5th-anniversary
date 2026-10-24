"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Envelope from "./envelope";
import type { GalleryPhoto } from "@/lib/gallery";

const MemoriesGallery = dynamic(() => import("./memories-gallery"), {
  loading: () => <main className="gallery-loading" role="status">Otwieram nasze wspomnienia…</main>,
});

export default function SurpriseExperience({ photos }: { photos: GalleryPhoto[] }) {
  const [showGallery, setShowGallery] = useState(false);
  const dismissLetter = useCallback(() => setShowGallery(true), []);

  return showGallery ? <MemoriesGallery photos={photos} /> : <Envelope onDismiss={dismissLetter} />;
}
