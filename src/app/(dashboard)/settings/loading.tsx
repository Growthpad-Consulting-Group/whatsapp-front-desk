export default function SettingsLoading() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-pulse">
      <div className="xl:col-span-2 space-y-6">
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
      <div className="h-96 bg-muted rounded-2xl" />
    </div>
  );
}
