import SurpriseExperience from "@/components/surprise-experience";
import { getAnniversaryPhotos } from "@/lib/gallery";

export default async function Home() {
  const photos = await getAnniversaryPhotos();
  return <SurpriseExperience photos={photos} />;
}
