import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Brain,
  Upload,
  Film,
  X,
  Trash2,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Database,
  Cpu,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { gaitAPI } from "@/lib/api";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────
type GaitProfile = {
  _id: string;
  file_name: string;
  condition: string;
  status: string;
  vector_status?: string;
  description?: string;
  video_url?: string;
  file_size?: number;
  person_name?: string;
  feature_vector?: number[];
  feature_dimensions?: number;
  createdAt: string;
};

type Condition = "normal" | "bag" | "coat";

const CONDITION_LABELS: Record<Condition, string> = {
  normal: "Normal Walk",
  bag:    "Carrying Bag",
  coat:   "Wearing Coat",
};

const CONDITION_COLORS: Record<Condition, string> = {
  normal: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  bag:    "bg-violet-500/20 text-violet-300 border-violet-500/30",
  coat:   "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtSize = (bytes?: number) => {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const VectorBadge = ({ status }: { status?: string }) => {
  const map: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    pending:    { icon: <Clock className="w-3 h-3" />,             label: "Pending",    cls: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
    processing: { icon: <Loader2 className="w-3 h-3 animate-spin" />, label: "Extracting", cls: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
    completed:  { icon: <CheckCircle2 className="w-3 h-3" />,      label: "Ready",      cls: "text-green-400 bg-green-400/10 border-green-400/30" },
    failed:     { icon: <AlertCircle className="w-3 h-3" />,       label: "Failed",     cls: "text-red-400 bg-red-400/10 border-red-400/30" },
  };
  const s = map[status || "pending"] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function GaitProfilePage() {
  // List
  const [loadingList, setLoadingList] = useState(true);
  const [profiles, setProfiles] = useState<GaitProfile[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Upload panel
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [condition, setCondition] = useState<Condition>("normal");
  const [description, setDescription] = useState("");
  const [personName, setPersonName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load profiles ────────────────────────────────────────────────────────
  const loadProfiles = useCallback(async () => {
    try {
      const res = await gaitAPI.listProfiles({ page: 1, limit: 50 });
      setProfiles(res?.data?.profiles ?? []);
    } catch {
      /* silently ignore — token expiry is handled by axios interceptor */
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  // ── File helpers ─────────────────────────────────────────────────────────
  const selectFile = (f: File) => {
    if (!f.type.startsWith("video/")) { toast.error("Please select a video file"); return; }
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const clearFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Upload ───────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) { toast.error("Please select a video file first"); return; }
    if (!personName.trim()) { toast.error("Please enter a person name"); return; }

    const formData = new FormData();
    formData.append("video", file);
    formData.append("condition", condition);
    formData.append("person_name", personName.trim());
    if (description.trim()) formData.append("description", description.trim());

    setUploading(true);
    setUploadPercent(0);

    try {
      const res = await gaitAPI.uploadVideo(formData, (e) => {
        if (e.total) setUploadPercent(Math.round((e.loaded / e.total) * 100));
      });
      const msg = res?.message ?? "Profile created!";
      const success = res?.data?.vector_status === "completed";
      if (success) {
        toast.success(msg);
      } else {
        toast.warning("Profile saved, but AI feature extraction failed. Check the table.");
      }
      setShowUpload(false);
      clearFile();
      setDescription("");
      setPersonName("");
      setCondition("normal");
      await loadProfiles();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
               ?? (err as Error)?.message
               ?? "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
      setUploadPercent(0);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await gaitAPI.deleteProfile(id);
      toast.success("Profile deleted");
      setProfiles(prev => prev.filter(p => p._id !== id));
    } catch {
      toast.error("Failed to delete profile");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Drag & drop ──────────────────────────────────────────────────────────
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) selectFile(f);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 min-h-screen">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gait Profiles</h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload a walking video to extract a gait feature vector and store it in the database.
          </p>
        </div>
        <Button
          onClick={() => setShowUpload(v => !v)}
          className="gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold shadow-lg shadow-cyan-500/25"
        >
          {showUpload ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showUpload ? "Cancel" : "+ Add Video"}
        </Button>
      </div>

      {/* ── Upload Panel ── */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-slate-700/60 bg-slate-800/60 backdrop-blur-sm p-6 space-y-5"
          >
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Upload className="w-4 h-4 text-cyan-400" />
              Upload Gait Video
            </div>

            {/* Person name */}
            <div className="space-y-1.5">
              <label className="text-sm text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Person Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={personName}
                onChange={e => setPersonName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => !file && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer
                ${dragging ? "border-cyan-400 bg-cyan-400/5" : "border-slate-600 hover:border-slate-500"}
                ${file ? "cursor-default" : ""} p-6`}
            >
              <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) selectFile(f); }} />

              {file ? (
                <div className="flex items-start gap-4">
                  {previewUrl && (
                    <video src={previewUrl} className="w-32 h-20 rounded-lg object-cover border border-slate-700" muted />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{fmtSize(file.size)}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); clearFile(); }}
                    className="text-slate-400 hover:text-red-400 transition mt-0.5">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <Film className="w-10 h-10 text-slate-500 mx-auto" />
                  <p className="text-sm text-slate-300 font-medium">Drag & drop your video here</p>
                  <p className="text-xs text-slate-500">MP4, AVI, MOV, WebM supported</p>
                  <button className="text-xs text-cyan-400 hover:underline" onClick={() => fileInputRef.current?.click()}>
                    browse file
                  </button>
                </div>
              )}
            </div>

            {/* Condition selector */}
            <div className="grid grid-cols-3 gap-3">
              {(["normal", "bag", "coat"] as Condition[]).map(c => (
                <button key={c} onClick={() => setCondition(c)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all
                    ${condition === c
                      ? "bg-cyan-500 text-black border-cyan-500 shadow-lg shadow-cyan-500/20"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"}`}>
                  {CONDITION_LABELS[c]}
                </button>
              ))}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm text-slate-400">Description <span className="text-slate-600">(optional)</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="e.g. Morning walk session, normal pace..."
                className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-cyan-500 transition"
              />
              <p className="text-xs text-slate-600 text-right">{description.length}/500</p>
            </div>

            {/* Upload progress */}
            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    {uploadPercent >= 100
                      ? <><Loader2 className="w-3 h-3 animate-spin text-violet-400" /> Sending to AI model — this may take 1-3 minutes…</>
                      : <><Upload className="w-3 h-3" /> Uploading…</>}
                  </span>
                  <span>{uploadPercent}%</span>
                </div>
                <Progress value={uploadPercent} className="h-2" />
                {uploadPercent >= 100 && (
                  <p className="text-xs text-violet-400 text-center animate-pulse">
                    ⚙️ AI model is extracting feature vector… please wait
                  </p>
                )}
              </div>
            )}

            {/* Submit */}
            <Button
              onClick={handleUpload}
              disabled={uploading || !file || !personName.trim()}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold disabled:opacity-40"
            >
              {uploading
                ? uploadPercent < 100
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading… {uploadPercent}%</>
                  : <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Extracting feature vector…</>
                : <><Upload className="w-4 h-4 mr-2" />Upload & Extract Feature Vector</>}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Feature Vector Table ── */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700/60">
          <Database className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-200">Gait Feature Vector Database</h2>
          <span className="ml-auto text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">
            {profiles.length} {profiles.length === 1 ? "record" : "records"}
          </span>
        </div>

        {loadingList ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
            <Film className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium">No Gait Profiles Yet</p>
            <p className="text-xs">Upload a walking video above to create your first profile.</p>
            <Button onClick={() => setShowUpload(true)} size="sm"
              className="mt-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Upload First Video
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-medium">Person</th>
                  <th className="px-5 py-3 text-left font-medium">Condition</th>
                  <th className="px-5 py-3 text-left font-medium">File</th>
                  <th className="px-5 py-3 text-left font-medium">Vector Status</th>
                  <th className="px-5 py-3 text-left font-medium">Dimensions</th>
                  <th className="px-5 py-3 text-left font-medium">Uploaded</th>
                  <th className="px-5 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {profiles.map(profile => {
                  return (
                    <motion.tr
                      key={profile._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-700/20 transition-colors"
                    >
                      {/* Person */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 text-cyan-400" />
                          </div>
                          <span className="font-medium text-white truncate max-w-[120px]">
                            {profile.person_name || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Condition */}
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${CONDITION_COLORS[profile.condition as Condition] ?? ""}`}>
                          {CONDITION_LABELS[profile.condition as Condition] ?? profile.condition}
                        </span>
                      </td>

                      {/* File */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Film className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span className="truncate max-w-[140px] text-xs" title={profile.file_name}>
                            {profile.file_name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{fmtSize(profile.file_size)}</p>
                      </td>

                      {/* Vector status */}
                      <td className="px-5 py-4">
                        <VectorBadge status={profile.vector_status} />
                      </td>

                      {/* Dimensions */}
                      <td className="px-5 py-4">
                        {profile.feature_dimensions ? (
                          <div className="flex items-center gap-1.5 text-violet-300">
                            <Cpu className="w-3.5 h-3.5" />
                            <span className="font-mono text-xs font-semibold">{profile.feature_dimensions}D</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(profile.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric"
                        })}
                      </td>

                      {/* Delete */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleDelete(profile._id)}
                          disabled={deletingId === profile._id}
                          className="text-slate-600 hover:text-red-400 transition disabled:opacity-40"
                          title="Delete profile"
                        >
                          {deletingId === profile._id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Info card ── */}
      <div className="rounded-xl border border-slate-700/40 bg-slate-800/30 p-4 flex items-start gap-3">
        <Brain className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 space-y-1">
          <p className="font-medium text-slate-300">How it works</p>
          <p>After upload, your video is sent to the AI gait model (HuggingFace). The model extracts a <span className="text-cyan-400 font-mono">3840-dimensional</span> feature vector and stores the mean across all frames directly in the database. The table updates automatically when extraction completes.</p>
        </div>
      </div>
    </div>
  );
}
