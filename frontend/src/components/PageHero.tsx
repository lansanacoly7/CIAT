import Image from "next/image";
import type { ReactNode } from "react";

/** Classes d'un bouton secondaire lisible sur l'image du héros. */
export const HERO_GHOST = "!text-white !border-white/50 !bg-transparent hover:!bg-white/10";

/**
 * Héros commun à toutes les pages publiques.
 * Hauteur fixe et identique partout : 420 px sur mobile, 480 px à partir de la tablette.
 */
export default function PageHero({
  image,
  title,
  subtitle,
  children,
  imagePosition = "object-center",
}: {
  image: string;
  title: ReactNode;
  subtitle?: string;
  children?: ReactNode;
  imagePosition?: string;
}) {
  return (
    <section className="relative flex h-[420px] items-center overflow-hidden bg-[#140A06] md:h-[480px]">
      <Image src={image} alt="" fill priority sizes="100vw" className={`object-cover ${imagePosition}`} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 via-50% to-black/10"
      />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold leading-tight !text-white md:text-5xl">{title}</h1>
          {subtitle && <p className="mt-5 text-lg leading-relaxed text-white/90">{subtitle}</p>}
          {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
        </div>
      </div>
    </section>
  );
}
