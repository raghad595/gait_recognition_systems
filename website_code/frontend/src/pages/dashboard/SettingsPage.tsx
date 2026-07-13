import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { settingsAPI } from "@/lib/api";
import { toast } from "sonner";
import { AxiosError } from "axios";

type ProfileState = {
  fullName: string;
  email: string;
  role: string;
  institution: string;
};

type ModelState = {
  similarityThreshold: number;
  frameSamplingRate: number;
};

type ApiErrorResponse = {
  message?: string;
  error?: string;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileState>({
    fullName: "",
    email: "",
    role: "",
    institution: "",
  });
  const [modelConfig, setModelConfig] = useState<ModelState>({
    similarityThreshold: 0.75,
    frameSamplingRate: 30,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [profileRes, modelRes] = await Promise.all([
          settingsAPI.getProfile(),
          settingsAPI.getModel(),
        ]);

        setProfile(profileRes.data);
        setModelConfig(modelRes.data);
      } catch (error) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const saveProfile = async () => {
    try {
      const response = await settingsAPI.updateProfile({
        fullName: profile.fullName,
        institution: profile.institution,
      });
      setProfile(response.data);
      toast.success("Profile settings updated");
    } catch (error) {
      const axiosErr = error instanceof AxiosError ? (error as AxiosError<ApiErrorResponse>) : null;
      const message = axiosErr
        ? axiosErr.response?.data?.message || axiosErr.response?.data?.error || axiosErr.message
        : "Failed to update profile";
      toast.error(message);
    }
  };

  const saveModel = async () => {
    try {
      const response = await settingsAPI.updateModel(modelConfig);
      setModelConfig(response.data);
      toast.success("Model settings updated");
    } catch (error) {
      const axiosErr = error instanceof AxiosError ? (error as AxiosError<ApiErrorResponse>) : null;
      const message = axiosErr
        ? axiosErr.response?.data?.message || axiosErr.response?.data?.error || axiosErr.message
        : "Failed to update model settings";
      toast.error(message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account and preferences</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading settings...</p>
      ) : (
        <>
          <div className="card-glow p-6 space-y-6">
            <h3 className="font-semibold text-foreground">Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input className="bg-secondary border-border" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input className="bg-secondary border-border" value={profile.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input className="bg-secondary border-border" value={profile.role} disabled />
              </div>
              <div className="space-y-2">
                <Label>Institution</Label>
                <Input className="bg-secondary border-border" value={profile.institution || ""} onChange={(e) => setProfile({ ...profile, institution: e.target.value })} />
              </div>
            </div>
            <Button variant="glow" onClick={saveProfile}>Save Profile</Button>
          </div>

          <div className="card-glow p-6 space-y-6">
            <h3 className="font-semibold text-foreground">Model Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Similarity Threshold</Label>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  className="bg-secondary border-border"
                  value={modelConfig.similarityThreshold}
                  onChange={(e) => setModelConfig({ ...modelConfig, similarityThreshold: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Frame Sampling Rate</Label>
                <Input
                  type="number"
                  min={1}
                  className="bg-secondary border-border"
                  value={modelConfig.frameSamplingRate}
                  onChange={(e) => setModelConfig({ ...modelConfig, frameSamplingRate: Number(e.target.value) })}
                />
              </div>
            </div>
            <Button variant="glow" onClick={saveModel}>Save Model Config</Button>
          </div>

          <div className="card-glow p-6 space-y-6">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <div className="space-y-4">
              {[
                { label: "Email notifications", desc: "Receive match alerts via email", default: true },
                { label: "Processing updates", desc: "Get notified when video processing completes", default: true },
                { label: "Weekly reports", desc: "Receive weekly accuracy summaries", default: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={item.default} />
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="card-glow p-6 border-destructive/30">
            <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mb-4">Account deletion endpoint is not implemented in backend yet.</p>
            <Button variant="destructive" disabled>Delete Account</Button>
          </div>
        </>
      )}
    </div>
  );
}
