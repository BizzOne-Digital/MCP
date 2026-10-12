import { BrandLogo } from "@/components/BrandLogo";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-[38%] min-w-[280px] flex-col justify-between bg-[var(--mo-sidebar)] p-10 text-white lg:flex">
        <BrandLogo />
        <div>
          <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/20">
            <div className="flex h-full">
              <div className="w-1/3 bg-[var(--mo-yellow)]" />
              <div className="flex-1 bg-[var(--mo-teal)]" />
            </div>
          </div>
          <p className="text-xs text-white/50">© {new Date().getFullYear()} Merchant Orders</p>
        </div>
      </aside>
      <main className="flex flex-1 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandLogo />
          </div>
          <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
          <p className="mt-2 text-sm text-[var(--mo-muted)]">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
