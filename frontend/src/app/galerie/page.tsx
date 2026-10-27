import type { Metadata } from "next";
import GalerieProjets from "./GalerieProjets";

export const metadata: Metadata = {
  title: "Galerie des innovations | CIAT",
  description:
    "Découvrez les projets, prototypes et innovations accompagnés par le CIAT.",
};

export default function GaleriePage() {
  return <GalerieProjets />;
}
