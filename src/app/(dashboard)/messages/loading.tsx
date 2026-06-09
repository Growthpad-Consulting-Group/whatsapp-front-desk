export default function MessagesLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-32 bg-muted rounded-xl" />
      <div className="flex gap-3 mb-4">
        <div className="h-10 w-48 bg-muted rounded-xl" />
        <div className="h-10 w-32 bg-muted rounded-xl" />
      </div>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-16 bg-muted rounded-xl" />
      ))}
    </div>
  );
}
