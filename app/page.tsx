import { Tonebook } from "@/components/tonebook/tonebook";
import { presets } from "@/config/tonebook";

export default function Home() {
  return <Tonebook presets={presets} />;
}
