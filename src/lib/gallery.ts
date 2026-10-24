import { readdir } from "node:fs/promises";
import path from "node:path";

export type GalleryPhoto = {
  image: string;
  date: string;
  isoDate: string;
  caption?: string;
};

const captionsByDate: Record<string, string> = {
  "2021-11-06": "Tak to się zaczęło Skarbie",
  "2022-01-08": "Pierwsze Tatry razem #nieMieszajAlko",
  "2022-03-27": "Miłość pod górą Tibidabo",
  "2022-05-15": "Pierwszy spacer po Drohiczynie",
  "2022-11-05": "Teneryfa - spadające gwiazdy, wschód na wulkanie",
  "2023-04-11": "Matera #twójStary007",
  "2024-01-02": "Dawaj buziaka, niech papież zazdrości #seksBezŚlubu",
  "2024-04-30": "...na zawsze razem",
  "2024-11-04": "Ofc, że mokre buty na lewadzie to moja wina",
  "2025-03-04": "Misia w brzuchu, Nowy York za oknem",
  "2026-03-28": "Side - wakacje na zakładkę i rodzinne spacery",
  "2026-08-06": "Cisiec, chuda ręka i Mała góralka",
};

export async function getAnniversaryPhotos(): Promise<GalleryPhoto[]> {
  const directory = "gallery/5th-anniversary";
  const files = await readdir(path.join(process.cwd(), "public", directory));

  return files
    .filter((file) => /\.(jpe?g|png|webp|avif|gif)$/i.test(file))
    .map((file) => {
      const compact = file.match(/(?:^|\D)(\d{4})(\d{2})(\d{2})(?!\d)/);
      const dotted = file.match(/(?:^|\D)(\d{2})\.(\d{2})\.(\d{4}|\d{2})(?!\d)/);
      const year = compact?.[1] ?? (dotted ? dotted[3].padStart(4, "20") : undefined);
      const month = compact?.[2] ?? dotted?.[2];
      const day = compact?.[3] ?? dotted?.[1];
      if (!year || !month || !day) {
        throw new Error(`Nazwa zdjęcia musi zawierać datę RRRRMMDD, DD.MM.RR lub DD.MM.RRRR: ${file}`);
      }
      const isoDate = `${year}-${month}-${day}`;
      return {
        image: `/${directory}/${encodeURIComponent(file)}`,
        date: `${day}.${month}.${year}`,
        isoDate,
        caption: captionsByDate[isoDate],
      };
    })
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate) || a.image.localeCompare(b.image));
}
