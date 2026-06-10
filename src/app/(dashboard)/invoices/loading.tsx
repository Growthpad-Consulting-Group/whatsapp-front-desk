export default function InvoicesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 bg-muted rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-2xl" />
        ))}
      </div>
      <div className="h-24 bg-muted rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-52 bg-muted rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
