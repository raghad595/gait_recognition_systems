import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScanLine, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { authAPI, testAPI } from "@/lib/api";
import { AxiosError } from "axios";

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", gender: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const testAPIConnection = async () => {
    try {
      console.log("🧪 Testing API connection...");
      const response = await testAPI.healthCheck();
      console.log("✅ API connection successful:", response);
      toast.success("API connection works!");
    } catch (error) {
      console.error("❌ API connection failed:", error);
      toast.error("API connection failed");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 Signup form submitted");
    console.log("📝 Form data:", form);
    
    if (!form.name || !form.email || !form.password || !form.confirm || !form.gender) {
      console.log("❌ Validation failed: missing required fields");
      toast.error("Please fill in all required fields");
      return;
    }
    if (form.password !== form.confirm) {
      console.log("❌ Validation failed: passwords don't match");
      toast.error("Passwords do not match");
      return;
    }

    console.log("✅ Validation passed, making API call...");
    setLoading(true);
    console.log("Sending signup data:", {
      fullName: form.name,
      email: form.email,
      password: form.password,
      confirmPassword: form.confirm,
      gender: form.gender,
      phone: form.phone,
    });
    try {
      await authAPI.signup({
        fullName: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirm,
        gender: form.gender,
        phone: form.phone,
      });
      localStorage.setItem('pendingEmail', form.email);
      toast.success("Account created! Please verify OTP.");
      navigate("/otp");
    } catch (error) {
      console.error("Signup error:", error);
      const message = error instanceof AxiosError 
        ? error.response?.data?.message || error.response?.data?.error || error.message
        : "Signup failed";
      toast.error(`Signup failed: ${message}`);
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
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground text-sm mt-1">Join the gait recognition platform</p>
        </div>

        <form onSubmit={handleSignup} className="card-glow p-8 space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="John Doe" className="pl-10 bg-secondary border-border" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="email" placeholder="name@example.com" className="pl-10 bg-secondary border-border" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="password" placeholder="••••••••" className="pl-10 bg-secondary border-border" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="password" placeholder="••••••••" className="pl-10 bg-secondary border-border" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select your gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input type="tel" placeholder="+1234567890" className="bg-secondary border-border" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={testAPIConnection}>Test API Connection</Button>
          <Button type="submit" variant="glow" className="w-full" size="lg" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
