import { useRef, useState } from "react";
import {
  Brain,
  Camera,
  ChevronDown,
  ChevronUp,
  Film,
  Image,
  Upload,
  Zap,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { predictAPI } from "@/lib/api";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Link } from "react-router-dom";
import NewGaitRegistrationDialog from "@/components/NewGaitRegistrationDialog";

// ── Types matching the fixed backend response ──────────────────────────────
type PredictionResult = {
  isVideo: boolean;
  frameCount: number | null;
  featureDimensions: number;
  meanFeatureVector: number[];   // ALWAYS a single 1D vector now
  topMatches?: {
    person_name: string;
    condition: string;
    score: number;
    profile_id: string;
  }[];
  claudeInsight?: string | null;
  message: string | null;
  error: string | null;
  forwardedTo: string;
  contentType: string;
};

type ApiErrorResponse = {
  message?: string;
  error?: string;
};

// ────────────────────────────────────────────────────────────────────────────

export default function UploadVideoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<string>("idle"); // idle | uploading | processing | done
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [showFullVector, setShowFullVector] = useState(false);
  const [liveActive, setLiveActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Registration dialog state ───────────────────────────────────────────────
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [pendingVector, setPendingVector] = useState<number[]>([]);

  // ── File selection ─────────────────────────────────────────────────────────
  const selectFile = (selected: File) => {
    setFile(selected);
    setPrediction(null);
    setShowFullVector(false);
    setProgress("idle");

    // Release old preview URL
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) selectFile(f);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) selectFile(e.target.files[0]);
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setPrediction(null);
    setShowFullVector(false);
    setProgress("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── AI Analysis ────────────────────────────────────────────────────────────
  const runAnalysis = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    const isVideo = file.type.startsWith("video/");
    const formData = new FormData();
    formData.append("file", file);

    setAnalyzing(true);
    setProgress("uploading");
    setUploadPercent(0);
    setPrediction(null);

    try {
      console.log("[Upload] Sending to /api/predict:", file.name, file.type, `${(file.size / 1024 / 1024).toFixed(2)} MB`);

      const response = await predictAPI.getPrediction(formData, (evt) => {
        if (evt.total) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          setUploadPercent(pct);
          if (pct >= 100) setProgress("processing");
        }
      });

      console.log("[Upload] Response:", response);

      const data: PredictionResult = response.data;

      if (data.error) {
        toast.error(`AI Error: ${data.error}`);
        return;
      }

      setPrediction(data);
      setProgress("done");

      if (isVideo) {
        toast.success(`Analyzed ${data.frameCount ?? "?"} frames — mean gait vector ready!`);
      } else {
        toast.success("Gait feature vector extracted!");
      }

      if (data.topMatches && data.topMatches.length > 0) {
        toast.success(`Top Match: ${data.topMatches[0].person_name} (${(data.topMatches[0].score * 100).toFixed(1)}%)`);
      } else if (data.meanFeatureVector && data.meanFeatureVector.length > 0) {
        // No matches → unknown person detected. Show registration dialog.
        setPendingVector(data.meanFeatureVector);
        setShowRegisterDialog(true);
      }
    } catch (error) {
      console.error("[Upload] Error:", error);
      const axiosErr = error instanceof AxiosError
        ? (error as AxiosError<ApiErrorResponse>)
        : null;
      const message = axiosErr
        ? axiosErr.response?.data?.message || axiosErr.response?.data?.error || axiosErr.message
        : "Analysis failed";
      toast.error(message);
      setProgress("idle");
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Derived display values ─────────────────────────────────────────────────
  const statusLabel: Record<string, string> = {
    uploading: uploadPercent < 100
      ? `Uploading... ${uploadPercent}%`
      : "Upload complete — waiting for AI model...",
    processing: "AI is extracting gait features — this may take 1–3 min if the model is waking up...",
    done: "",
  };

  const isVideo = file?.type.startsWith("video/");

  // ── Registration handlers ──────────────────────────────────────────────────
  const handleRegisterSave = async (personName: string, featureVector: number[]) => {
    try {
      await predictAPI.registerUnknownGait(personName, featureVector);
      toast.success(`"${personName}" saved to the gait database!`);
      setShowRegisterDialog(false);
      setPendingVector([]);
    } catch {
      toast.error("Failed to save — please try again.");
      // Keep dialog open so user can retry
      throw new Error("save failed"); // re-throw so dialog keeps spinner off
    }
  };

  const handleRegisterSkip = () => {
    setShowRegisterDialog(false);
    setPendingVector([]);
  };

  return (
    <div className="p-6 space-y-6">
      {/* ── New Gait Registration Dialog ── */}
      <NewGaitRegistrationDialog
        open={showRegisterDialog}
        featureVector={pendingVector}
        onSave={handleRegisterSave}
        onSkip={handleRegisterSkip}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload &amp; Analyze</h1>
        <p className="text-muted-foreground text-sm">
          Upload a gait image or video — the AI extracts a{" "}
          <span className="text-primary font-medium">mean gait feature vector</span> from the entire clip.
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-2" /> Upload File
          </TabsTrigger>
          <TabsTrigger value="live">
            <Camera className="w-4 h-4 mr-2" /> Live Camera
          </TabsTrigger>
        </TabsList>

        {/* ── Upload Tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="upload" className="space-y-4">

          {/* Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="card-glow p-10 text-center border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Preview */}
            {previewUrl && isVideo && (
              <video
                src={previewUrl}
                className="mx-auto mb-4 rounded-lg max-h-40 object-contain border border-border/40"
                muted
                playsInline
                onClick={(e) => e.stopPropagation()}
                controls
              />
            )}
            {previewUrl && !isVideo && (
              <img
                src={previewUrl}
                alt="preview"
                className="mx-auto mb-4 rounded-lg max-h-40 object-contain border border-border/40"
              />
            )}

            {!previewUrl && (
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
            )}

            <h3 className="font-semibold text-foreground mb-1">Drag &amp; drop here</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Images (JPG, PNG) or Videos (MP4, AVI, MOV)
            </p>

            {file ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm">
                {isVideo ? <Film className="w-4 h-4" /> : <Image className="w-4 h-4" />}
                <span className="max-w-xs truncate">{file.name}</span>
                <span className="text-primary/60 shrink-0">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No file selected</span>
            )}
          </div>

          {/* Video warning */}
          {isVideo && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-400">
              <Film className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Video detected — the backend will extract all frames and compute a{" "}
                <strong>mean gait vector</strong>. This may take 30–120 seconds depending on video length.
              </span>
            </div>
          )}

          {/* Progress message */}
          {analyzing && statusLabel[progress] && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-primary">
              <span className="animate-spin w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full inline-block shrink-0" />
              {statusLabel[progress]}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-center gap-3">
            {file && (
              <Button variant="outline-glow" onClick={reset} disabled={analyzing}>
                Clear
              </Button>
            )}
            <Button
              id="run-analysis-btn"
              variant="glow"
              size="lg"
              onClick={runAnalysis}
              disabled={!file || analyzing}
            >
              {analyzing ? (
                <>
                  <span className="animate-spin mr-2 w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  {progress === "uploading" ? "Uploading..." : "Analyzing..."}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Run AI Analysis
                </>
              )}
            </Button>
          </div>

          {/* ── Result Panel ─────────────────────────────────────────────────── */}
          {prediction && !prediction.error && (
            <div className="card-glow p-6 space-y-4">

              {/* ── Match Results & Claude Insights ──────────────────────────── */}
              {prediction.topMatches && prediction.topMatches.length > 0 ? (
                <div className="space-y-4">
                  {/* Claude Insight */}
                  {prediction.claudeInsight && (
                    <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-5">
                      <h4 className="text-sm font-semibold text-indigo-400 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Claude AI Insight
                      </h4>
                      <p className="text-sm text-indigo-200/90 leading-relaxed">
                        {prediction.claudeInsight}
                      </p>
                    </div>
                  )}

                  {/* Top Matches */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Brain className="w-4 h-4 text-primary" />
                      Top {prediction.topMatches.length} Matches
                    </h4>
                    <div className="grid gap-3">
                      {prediction.topMatches.map((match, idx) => (
                        <div
                          key={match.profile_id}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                            idx === 0
                              ? "bg-primary/10 border-primary/30"
                              : "bg-secondary/30 border-border/40 hover:bg-secondary/50"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                idx === 0
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              #{idx + 1}
                            </div>
                            <div>
                              <p className={`font-bold ${idx === 0 ? "text-lg text-foreground" : "text-base text-foreground/80"}`}>
                                {match.person_name}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                Condition: {match.condition}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${idx === 0 ? "text-xl text-primary" : "text-lg text-primary/70"}`}>
                              {(match.score * 100).toFixed(1)}%
                            </p>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-secondary/50 border border-border/50 rounded-lg p-5 text-center">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">No Matches Found</h4>
                  <p className="text-xs text-muted-foreground">
                    This gait signature does not match any profile in the database.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-border/50">
                <Button variant="glow" className="flex-1" onClick={runAnalysis} disabled={analyzing}>
                  <Zap className="w-4 h-4 mr-2" /> Analyze Again
                </Button>
                <Button variant="outline-glow" className="flex-1" onClick={reset}>
                  Upload New File
                </Button>
              </div>
            </div>
          )}

          {/* Error from HF model */}
          {prediction?.error && (
            <div className="card-glow p-6 border-destructive/30 text-center space-y-3">
              <p className="text-destructive font-medium">AI Model Error</p>
              <p className="text-sm text-muted-foreground">{prediction.error}</p>
              <Button variant="outline-glow" onClick={reset}>Try Again</Button>
            </div>
          )}
        </TabsContent>

        {/* ── Live Tab ───────────────────────────────────────────────────────── */}
        <TabsContent value="live">
          <div className="card-glow p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Live Camera Analyzer</h3>
            <p className="text-sm text-muted-foreground mb-6">
              The live camera analyzer is fully functional and has been moved to its own dedicated page!
            </p>
            <Button variant="glow" size="lg" asChild>
              <Link to="/dashboard/live">
                <Camera className="w-4 h-4 mr-2" /> Go to Live Camera Page
              </Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
