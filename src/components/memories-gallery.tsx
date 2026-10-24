"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { A11y, Keyboard, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { GalleryPhoto } from "@/lib/gallery";
import HeartsBackground from "./hearts-background";
import PhotoBackdrop from "./photo-backdrop";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function MemoriesGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <main className="memories-gallery" aria-labelledby="gallery-title">
      <PhotoBackdrop />
      <HeartsBackground />
      <div className="gallery-content">
        <header className="gallery-header">
          <p className="gallery-counter" aria-hidden="true">
            {String(activeIndex + 1).padStart(2, "0")} <span>/ {String(photos.length + 1).padStart(2, "0")}</span>
          </p>
          <h1 ref={headingRef} id="gallery-title" className="sr-only" tabIndex={-1}>
            Nasze wspomnienia
          </h1>
        </header>
        <Swiper
          className="memories-swiper"
          modules={[Navigation, Pagination, Keyboard, A11y]}
          slidesPerView={1}
          spaceBetween={24}
          speed={500}
          navigation
          pagination={{ clickable: true, dynamicBullets: true, dynamicMainBullets: 3 }}
          keyboard={{ enabled: true, onlyInViewport: true }}
          a11y={{
            enabled: true,
            containerMessage: "Galeria naszych wspomnień",
            prevSlideMessage: "Poprzedni slajd",
            nextSlideMessage: "Następny slajd",
            firstSlideMessage: "To pierwszy slajd",
            lastSlideMessage: "To ostatni slajd",
            paginationBulletMessage: "Przejdź do slajdu {{index}}",
            slideLabelMessage: "Slajd {{index}} z {{slidesLength}}",
          }}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        >
          {photos.map((photo, index) => (
            <SwiperSlide key={photo.image}>
              <figure className="memory-slide">
                <div className="memory-photo">
                  <Image
                    src={photo.image}
                    alt={`Nasze wspomnienie z ${photo.date}`}
                    fill
                    sizes="(max-width: 800px) calc(100vw - 32px), 760px"
                    priority={index === 0}
                    draggable={false}
                  />
                </div>
                <figcaption className="memory-date">
                  <time className="memory-date-label" dateTime={photo.isoDate}>{photo.date}</time>
                  {photo.caption && <h2>{photo.caption}</h2>}
                </figcaption>
              </figure>
            </SwiperSlide>
          ))}
          <SwiperSlide key="love-message">
            <section className="love-slide" aria-labelledby="love-title">
              <h2 id="love-title">Kocham Cię</h2>
            </section>
          </SwiperSlide>
        </Swiper>
      </div>
    </main>
  );
}
