export default function GalerieLoading() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#26160B] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
        {/* En-tête Skeleton */}
        <div className="space-y-3">
          <div className="h-6 w-36 bg-[#E8DDD0] rounded-full" />
          <div className="h-10 w-3/4 max-w-md bg-[#DFD1C0] rounded-lg" />
          <div className="h-4 w-full max-w-xl bg-[#E8DDD0] rounded-md" />
        </div>

        {/* Barre de filtres Skeleton */}
        <div className="bg-white rounded-2xl border border-[#E8DDD0] p-4 sm:p-5 shadow-xs space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-11 bg-[#F2EBE1] rounded-xl" />
            <div className="h-11 bg-[#F2EBE1] rounded-xl" />
            <div className="h-11 bg-[#F2EBE1] rounded-xl" />
            <div className="h-11 bg-[#F2EBE1] rounded-xl" />
          </div>
        </div>

        {/* Grille de 6 cartes fiches Skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#E8DDD0] p-5 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-24 bg-[#E8DDD0] rounded-full" />
                  <div className="h-5 w-16 bg-[#DFD1C0] rounded-full" />
                </div>
                <div className="h-6 w-5/6 bg-[#DFD1C0] rounded-md" />
                <div className="h-4 w-full bg-[#EFE7DD] rounded-md" />
                <div className="h-4 w-4/5 bg-[#EFE7DD] rounded-md" />
              </div>
              <div className="pt-4 border-t border-[#F2EBE1] flex items-center justify-between">
                <div className="h-4 w-28 bg-[#E8DDD0] rounded-md" />
                <div className="h-8 w-20 bg-[#D4AA70]/30 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
