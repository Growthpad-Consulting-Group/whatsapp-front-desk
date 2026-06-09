export default function TodayLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-start pb-5 border-b border-border/40">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-muted rounded-xl" />
          <div className="h-4 w-40 bg-muted rounded-lg" />
        </div>
        <div className="h-8 w-36 bg-muted rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-muted rounded-2xl" />
        <div className="h-72 bg-muted rounded-2xl" />
      </div>
    </div>
  );
}
