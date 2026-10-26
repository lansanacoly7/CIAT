export default function PortailLoading() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#26160B] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
        {/* Hero / Header Skeleton */}
        <div className="space-y-3">
          <div className="h-6 w-32 bg-[#E8DDD0] rounded-full" />
          <div className="h-10 w-2/3 max-w-lg bg-[#DFD1C0] rounded-lg" />
          <div className="h-4 w-full max-w-xl bg-[#E8DDD0] rounded-md" />
        </div>

        {/* Section 1 : Actualités Skeleton */}
        <div className="space-y-4">
          <div className="h-7 w-48 bg-[#DFD1C0] rounded-md" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#E8DDD0] overflow-hidden shadow-xs flex flex-col"
              >
                <div className="h-44 w-full bg-[#E5D9CB]" />
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-[#E8DDD0] rounded-full" />
                    <div className="h-5 w-4/5 bg-[#DFD1C0] rounded-md" />
                    <div className="h-4 w-full bg-[#EFE7DD] rounded-md" />
                  </div>
                  <div className="h-4 w-24 bg-[#E8DDD0] rounded-md pt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2 : Appels & Événements Skeleton */}
        <div className="grid gap-6 lg:grid-cols-2 pt-4">
          <div className="bg-white rounded-2xl border border-[#E8DDD0] p-6 space-y-4">
            <div className="h-6 w-40 bg-[#DFD1C0] rounded-md" />
            <div className="space-y-3">
              <div className="h-14 bg-[#F2EBE1] rounded-xl" />
              <div className="h-14 bg-[#F2EBE1] rounded-xl" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#E8DDD0] p-6 space-y-4">
            <div className="h-6 w-40 bg-[#DFD1C0] rounded-md" />
            <div className="space-y-3">
              <div className="h-14 bg-[#F2EBE1] rounded-xl" />
              <div className="h-14 bg-[#F2EBE1] rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
