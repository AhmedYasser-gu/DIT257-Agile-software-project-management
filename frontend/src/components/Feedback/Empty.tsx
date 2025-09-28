export default function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card p-6">
      <div className="font-medium">{title}</div>
      {hint && <div className="text-sm text-subtext mt-1">{hint}</div>}
    </div>
  );
}
