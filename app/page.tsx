import { LoopsRadarApp } from "./loops-radar-app";
import { loops } from "@/lib/loops";

export default function Home() {
  return <LoopsRadarApp loops={loops} />;
}
