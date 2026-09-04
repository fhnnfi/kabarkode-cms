import type { Metadata } from "next";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AuthGuard } from "@/components/layout/auth-guard";
import { NavigationGuard } from "@/components/layout/navigation-guard";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · KabarKode CMS" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {/* TooltipProvider wajib: sidebar.tsx memakai Tooltip saat collapsed
          dan versi shadcn terbaru tidak menyertakannya di SidebarProvider. */}
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="min-h-svh">
            <AppHeader />
            <main className="flex-1 p-4 md:p-6">{children}</main>
            <NavigationGuard />
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </AuthGuard>
  );
}
