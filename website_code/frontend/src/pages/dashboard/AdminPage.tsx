import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { adminAPI, settingsAPI } from "@/lib/api";
import { toast } from "sonner";
import { AxiosError } from "axios";
import {
  Users,
  Search,
  ShieldCheck,
  Snowflake,
  Trash2,
  Settings2,
  RefreshCw,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────
type User = {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  phone?: string;
  gender?: string;
  confirmEmail?: boolean;
  freezedAt?: string | null;
  createdAt?: string;
};

type ModelConfig = {
  similarityThreshold: number;
  frameSamplingRate: number;
};

type ApiErrorResponse = {
  message?: string;
  error?: string;
};

const ROLE_OPTIONS = ["USER", "ADMIN", "RESEARCHER", "SECURITY_OFFICER"];

// ─── Component ──────────────────────────────────────────────────────
export default function AdminPage({ view = "dashboard" }: { view?: "dashboard" | "users" | "settings" }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Model config
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    similarityThreshold: 0.75,
    frameSamplingRate: 30,
  });

  // ── Fetch all users + model config ────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, modelRes] = await Promise.all([
        adminAPI.getAllUsers(),
        settingsAPI.getModel(),
      ]);
      setUsers(usersRes.data || []);
      setModelConfig(modelRes.data);
    } catch (err) {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────
  const errMsg = (error: unknown): string => {
    const axiosErr = error instanceof AxiosError ? (error as AxiosError<ApiErrorResponse>) : null;
    return axiosErr
      ? axiosErr.response?.data?.message || axiosErr.response?.data?.error || axiosErr.message
      : "An unexpected error occurred";
  };

  // ── Role change ───────────────────────────────────────────────────
  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      toast.success("Role updated");
    } catch (error) {
      toast.error(errMsg(error));
    } finally {
      setActionLoading(null);
    }
  };

  // ── Freeze / Unfreeze ─────────────────────────────────────────────
  const handleToggleFreeze = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await adminAPI.toggleFreezeUser(userId);
      const updated = res.data;
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, freezedAt: updated.freezedAt } : u
        )
      );
      toast.success(updated.freezedAt ? "User frozen" : "User unfrozen");
    } catch (error) {
      toast.error(errMsg(error));
    } finally {
      setActionLoading(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────
  const handleDeleteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminAPI.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success("User deleted");
    } catch (error) {
      toast.error(errMsg(error));
    } finally {
      setActionLoading(null);
    }
  };

  // ── Save model config ─────────────────────────────────────────────
  const saveModel = async () => {
    try {
      const response = await settingsAPI.updateModel(modelConfig);
      setModelConfig(response.data);
      toast.success("Model settings saved");
    } catch (error) {
      toast.error(errMsg(error));
    }
  };

  // ── Filtering ─────────────────────────────────────────────────────
  const filtered = users.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Render ────────────────────────────────────────────────────────
  const getHeaderInfo = () => {
    switch (view) {
      case "users":
        return {
          title: "User Management",
          description: "Search, update roles, freeze, or delete user accounts",
        };
      case "settings":
        return {
          title: "System Configuration",
          description: "Configure global machine learning similarity threshold and frame rates",
        };
      case "dashboard":
      default:
        return {
          title: "Admin Dashboard",
          description: "System-wide overview, statistics and metrics",
        };
    }
  };
  const header = getHeaderInfo();

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{header.title}</h1>
            <p className="text-muted-foreground text-sm">
              {header.description}
            </p>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Dashboard View ─────────────────────────────────── */}
          {view === "dashboard" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Users */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-glow p-6 space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm font-medium">Total Users</span>
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-3xl font-bold text-foreground">{users.length}</h4>
                    <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
                  </div>
                </motion.div>

                {/* Active Users */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="card-glow p-6 space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm font-medium">Active Users</span>
                    <ShieldCheck className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h4 className="text-3xl font-bold text-foreground">
                      {users.filter((u) => !u.freezedAt).length}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">Allowed login access</p>
                  </div>
                </motion.div>

                {/* Frozen Users */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="card-glow p-6 space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm font-medium">Frozen Users</span>
                    <Snowflake className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h4 className="text-3xl font-bold text-foreground">
                      {users.filter((u) => !!u.freezedAt).length}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">Suspended accounts</p>
                  </div>
                </motion.div>

                {/* Model Threshold */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="card-glow p-6 space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm font-medium">Model Settings</span>
                    <Settings2 className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground">
                      Threshold: {modelConfig.similarityThreshold}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sampling: {modelConfig.frameSamplingRate} fps
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Recent Signups */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card-glow p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Recent Registrations</h3>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/admin/users")}>
                    View User Directory
                  </Button>
                </div>
                <div className="space-y-3">
                  {users.slice(0, 5).map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/30">
                      <div>
                        <p className="font-medium text-sm text-foreground">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                          {user.role}
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* ── System Configuration View ──────────────────────── */}
          {view === "settings" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-glow p-6 space-y-5"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">
                  System Configuration
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Similarity Threshold</Label>
                  <Input
                    id="admin-similarity-threshold"
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    className="bg-secondary border-border"
                    value={modelConfig.similarityThreshold}
                    onChange={(e) =>
                      setModelConfig({
                        ...modelConfig,
                        similarityThreshold: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frame Sampling Rate</Label>
                  <Input
                    id="admin-frame-sampling-rate"
                    type="number"
                    min={1}
                    className="bg-secondary border-border"
                    value={modelConfig.frameSamplingRate}
                    onChange={(e) =>
                      setModelConfig({
                        ...modelConfig,
                        frameSamplingRate: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <Button variant="glow" onClick={saveModel}>
                Save Configuration
              </Button>
            </motion.div>
          )}

          {/* ── User Directory View ────────────────────────────── */}
          {view === "users" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-glow p-6 space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">
                    User Directory
                  </h3>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({users.length} total)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="admin-user-search"
                      placeholder="Search by name or email…"
                      className="pl-10 w-64 bg-secondary border-border"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchData}
                    title="Refresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Users table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-3 font-medium">Name</th>
                      <th className="text-left py-3 font-medium">Email</th>
                      <th className="text-left py-3 font-medium">Role</th>
                      <th className="text-left py-3 font-medium">Joined</th>
                      <th className="text-left py-3 font-medium">Status</th>
                      <th className="text-right py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-muted-foreground"
                        >
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((u) => {
                        const isFrozen = !!u.freezedAt;
                        const isBusy = actionLoading === u._id;
                        return (
                          <tr
                            key={u._id}
                            className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                          >
                            {/* Name */}
                            <td className="py-3 text-foreground font-medium">
                              {u.fullName}
                            </td>

                            {/* Email */}
                            <td className="py-3 text-muted-foreground">
                              {u.email}
                            </td>

                            {/* Role dropdown */}
                            <td className="py-3">
                              <Select
                                value={u.role}
                                onValueChange={(val) =>
                                  handleRoleChange(u._id, val)
                                }
                                disabled={isBusy}
                              >
                                <SelectTrigger className="w-[160px] h-8 bg-secondary border-border text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROLE_OPTIONS.map((r) => (
                                    <SelectItem key={r} value={r}>
                                      {r}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>

                            {/* Joined */}
                            <td className="py-3 text-muted-foreground text-xs">
                              {u.createdAt
                                ? new Date(u.createdAt).toLocaleDateString()
                                : "—"}
                            </td>

                            {/* Status */}
                            <td className="py-3">
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  isFrozen
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-success/10 text-success"
                                }`}
                              >
                                {isFrozen ? "Frozen" : "Active"}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {/* Freeze / Unfreeze */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isBusy}
                                  onClick={() => handleToggleFreeze(u._id)}
                                  title={
                                    isFrozen ? "Unfreeze user" : "Freeze user"
                                  }
                                  className={
                                    isFrozen
                                      ? "text-primary hover:text-primary"
                                      : "text-warning hover:text-warning"
                                  }
                                >
                                  <Snowflake className="w-4 h-4" />
                                </Button>

                                {/* Delete */}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={isBusy}
                                      className="text-destructive hover:text-destructive"
                                      title="Delete user"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete User
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to permanently
                                        delete{" "}
                                        <strong>{u.fullName}</strong> (
                                        {u.email})? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteUser(u._id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
