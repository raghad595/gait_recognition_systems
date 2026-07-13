import { Navigate } from "react-router-dom";
import { PropsWithChildren, useEffect, useState } from "react";
import { settingsAPI } from "@/lib/api";

/**
 * AdminRoute — guards admin-only pages.
 *
 * It fetches the current user's profile from the backend to check the role.
 * If the user is not an ADMIN, they are redirected to /dashboard.
 * While loading it shows a subtle spinner to avoid layout flash.
 */
export default function AdminRoute({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    let cancelled = false;

    settingsAPI.getProfile().then((res) => {
      if (cancelled) return;
      const role: string = res.data?.role ?? "";
      setStatus(role === "ADMIN" ? "allowed" : "denied");
    }).catch(() => {
      if (!cancelled) setStatus("denied");
    });

    return () => { cancelled = true; };
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
