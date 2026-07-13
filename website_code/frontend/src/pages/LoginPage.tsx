import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScanLine, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { authAPI } from "@/lib/api";
import { AxiosError } from "axios";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      // Persist user info (including role) so the UI can adapt without extra API calls
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      toast.success("Login successful!");

      // Redirect based on role: admin → /admin/dashboard, user → /dashboard
      const userRole = response.data.user?.role;
      if (userRole === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      const message = error instanceof AxiosError
        ? error.response?.data?.message || error.response?.data?.error || error.message
        : "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grid-pattern relative">
      <div className="absolute inset-0 bg-gradient-radial" />
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">GaitID</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to access the platform</p>
        </div>

        <form onSubmit={handleLogin} className="card-glow p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="name@example.com" className="pl-10 bg-secondary border-border" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="password" type="password" placeholder="********" className="pl-10 bg-secondary border-border" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="remember" />
              <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">Remember me</label>
            </div>
            <Link to="#" className="text-sm text-primary hover:underline">Forgot password?</Link>
          </div>
          <Button type="submit" variant="glow" className="w-full" size="lg" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
