export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-6xl animate-pulse">
      {/* Page header skeleton */}
      <div className="h-28 bg-muted rounded-2xl" />

      <div className="flex gap-8 items-start">
        {/* Nav skeleton */}
        <aside className="hidden lg:flex flex-col w-52 shrink-0 gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded-xl" />
          ))}
        </aside>

        {/* Content skeleton */}
        <div className="flex-1 space-y-4">
          <div className="h-64 bg-muted rounded-2xl" />
          <div className="h-40 bg-muted rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
