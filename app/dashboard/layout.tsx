import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#030606] text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,221,235,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(24,24,27,0.65),transparent_28%)] transform-gpu will-change-transform" />

        <Sidebar />

        <section className="relative z-10 pl-[280px]">
          <Topbar />

          <div className="mx-auto max-w-[1520px] px-8 py-8">
            {children}
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}