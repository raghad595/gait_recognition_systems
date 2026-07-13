import { useEffect, useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { ScanLine, LayoutDashboard, Upload, Users, Image, FileBarChart, Settings, LogOut, Menu, X, Camera, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authAPI, settingsAPI } from "@/lib/api";
import { toast } from "sonner";

const baseNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Upload, label: "Upload Video", path: "/dashboard/upload" },
  { icon: Camera, label: "Live Camera", path: "/dashboard/live" },
  { icon: Users, label: "Gait Profiles", path: "/dashboard/profiles" },
  { icon: Image, label: "Gallery Database", path: "/dashboard/gallery" },
  { icon: FileBarChart, label: "Reports", path: "/dashboard/reports" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

const adminNavItem = { icon: ShieldCheck, label: "Admin Panel", path: "/admin/dashboard" };

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<string>("");

  // Fetch the current user's role once on mount
  useEffect(() => {
    settingsAPI.getProfile()
      .then((res) => {
        setUserRole(res.data?.role ?? "");
      })
      .catch(() => {
        // Silently ignore – the user may just have a network blip.
      });
  }, []);

  const isAdmin = userRole === "ADMIN";

  // Build navigation items – append admin link only for admins
  const navItems = isAdmin ? [...baseNavItems, adminNavItem] : baseNavItems;

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Clear local session even if backend logout fails.
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      toast.success("Logged out successfully");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-screen border-r border-border bg-card flex flex-col transition-all duration-300 z-40",
        collapsed ? "w-16" : "w-60"
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <ScanLine className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">GaitID</span>
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="text-muted-foreground shrink-0">
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </Button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-border">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        collapsed ? "ml-16" : "ml-60"
      )}>
        <Outlet />
      </main>
    </div>
  );
}
