export default function AppLoading() {
  return (
    <div className="container py-8">
      <div className="card">
        <div className="animate-pulse grid gap-3">
          <div className="h-6 w-40 bg-border rounded" />
          <div className="h-4 w-3/4 bg-border rounded" />
          <div className="h-4 w-2/3 bg-border rounded" />
        </div>
      </div>
    </div>
  );
}
