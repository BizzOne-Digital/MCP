export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center rounded-md bg-white px-3 py-2 shadow-sm ${className}`}
    >
      <span className="mr-2 h-2 w-2 rounded-full bg-[var(--mo-yellow)]" />
      <span className="text-sm font-semibold tracking-tight text-gray-900">
        merchant orders
      </span>
    </div>
  );
}
