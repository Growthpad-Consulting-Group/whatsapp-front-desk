export default function CustomersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 bg-muted rounded-2xl" />
      <div className="h-16 bg-muted rounded-2xl" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}
