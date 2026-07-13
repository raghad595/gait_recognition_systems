import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ScanLine } from "lucide-react";
import { toast } from "sonner";
import { authAPI } from "@/lib/api";
import { AxiosError } from "axios";

export default function OTPPage() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length < 6) {
      toast.error("Please enter the full OTP code");
      return;
    }

    const email = localStorage.getItem('pendingEmail');
    if (!email) {
      toast.error("No email found. Please sign up again.");
      navigate("/signup");
      return;
    }

    setLoading(true);
    try {
      await authAPI.confirmEmail({ email, otp });
      localStorage.removeItem('pendingEmail');
      toast.success("Email verified! Redirecting to login...");
      navigate("/login");
    } catch (error) {
      const message = error instanceof AxiosError 
        ? error.response?.data?.message || error.response?.data?.error
        : "Verification failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const email = localStorage.getItem('pendingEmail');
    if (!email) {
      toast.error("No email found. Please sign up again.");
      navigate("/signup");
      return;
    }

    try {
      await authAPI.resendEmailOtp({ email });
      toast.success("OTP resent to your email");
    } catch (error) {
      const message = error instanceof AxiosError 
        ? error.response?.data?.message || error.response?.data?.error
        : "Failed to resend OTP";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grid-pattern relative">
      <div className="absolute inset-0 bg-gradient-radial" />
      <div className="relative z-10 w-full max-w-md mx-4 text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <ScanLine className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-bold text-foreground">GaitID</span>
        </Link>

        <div className="card-glow p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Verify Your Email</h1>
          <p className="text-muted-foreground text-sm mb-8">Enter the 6-digit code sent to your email</p>

          <div className="flex justify-center mb-8">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} className="bg-secondary border-border text-foreground w-12 h-14 text-lg" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button variant="glow" className="w-full" size="lg" onClick={handleVerify} disabled={loading}>
            {loading ? "Verifying..." : "Verify Code"}
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Didn't receive a code? <button className="text-primary hover:underline" onClick={handleResend} disabled={loading}>Resend</button>
          </p>
        </div>
      </div>
    </div>
  );
}
