import { useEffect, useState, useRef } from "react";
import { Camera, ScanLine, StopCircle, Video, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dashboardAPI, predictAPI } from "@/lib/api";
import { toast } from "sonner";

export default function LiveCameraPage() {
  const [active, setActive] = useState(false);
  const [systemStatus, setSystemStatus] = useState<{ modelInference: string; database: string; lastSync: string } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [predictionResult, setPredictionResult] = useState<{person_name: string, score: number} | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    const loadSystemStatus = async () => {
      try {
        const response = await dashboardAPI.getSystemStatus();
        setSystemStatus(response.data);
      } catch {
        toast.error("Failed to load system status");
      }
    };
    loadSystemStatus();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setActive(true);
      setPredictionResult(null);
    } catch (err) {
      toast.error("Could not access camera. Please allow permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setActive(false);
    setRecording(false);
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, active]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startAnalysis = () => {
    if (!stream) return;
    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const file = new File([blob], "live_capture.webm", { type: "video/webm" });
        
        const formData = new FormData();
        formData.append("file", file);

        setAnalyzing(true);
        try {
          const result = await predictAPI.getPrediction(formData);
          const topMatches = result.data?.topMatches;
          if (topMatches && topMatches.length > 0) {
            setPredictionResult({
              person_name: topMatches[0].person_name,
              score: topMatches[0].score * 100
            });
            toast.success(`Match found: ${topMatches[0].person_name}`);
          } else {
            toast.info("No clear match found in database.");
          }
        } catch (err) {
          toast.error("Analysis failed.");
        } finally {
          setAnalyzing(false);
        }
      };

      mediaRecorder.start();
      setRecording(true);
      setPredictionResult(null);
      toast.info("Recording 5-second snippet for analysis...");
      
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
          setRecording(false);
        }
      }, 5000);
    } catch (err) {
      toast.error("Error starting recorder. Your browser might not support webm recording.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Live Camera Feed</h1>
        <p className="text-muted-foreground text-sm">Real-time gait recognition from connected cameras</p>
      </div>

      {systemStatus && (
        <div className="card-glow p-4 text-sm">
          <p className="text-foreground">Model Inference: <span className="text-primary">{systemStatus.modelInference}</span></p>
          <p className="text-foreground">Database: <span className="text-primary">{systemStatus.database}</span></p>
          <p className="text-muted-foreground">Last Sync: {systemStatus.lastSync}</p>
        </div>
      )}

      <div className="card-glow p-6">
        {!active ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Camera Inactive</h3>
            <p className="text-sm text-muted-foreground mb-6">Start your camera to begin live gait analysis.</p>
            <Button variant="glow" size="lg" onClick={startCamera}>
              <Camera className="w-4 h-4 mr-2" /> Turn On Camera
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-sm font-mono text-destructive">LIVE</span>
                <span className="text-sm text-muted-foreground">- Webcam Active</span>
              </div>
              <Button variant="destructive" size="sm" onClick={stopCamera}>Disconnect</Button>
            </div>
            
            <div className="aspect-video bg-black rounded-xl border border-border flex items-center justify-center relative overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              
              {recording && (
                <div className="absolute top-4 right-4 bg-destructive/80 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white" /> Recording...
                </div>
              )}

              {analyzing && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                  <p className="font-medium">Extracting Gait Vector...</p>
                  <p className="text-xs text-muted-foreground mt-1">This takes a moment via AI model.</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center bg-secondary/30 p-4 rounded-xl border border-border">
              <div>
                <h4 className="font-semibold text-foreground">Capture & Analyze</h4>
                <p className="text-xs text-muted-foreground">Record a 5-second walk to identify the subject.</p>
              </div>
              <Button 
                onClick={startAnalysis} 
                disabled={recording || analyzing}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {recording ? <StopCircle className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {recording ? "Recording..." : analyzing ? "Analyzing..." : "Analyze Live"}
              </Button>
            </div>

            {predictionResult && (
              <div className="mt-4 p-4 rounded-xl border border-success/30 bg-success/10 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Match Found</p>
                  <p className="text-xl font-bold text-foreground">{predictionResult.person_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <p className="text-xl font-bold text-success">{predictionResult.score.toFixed(1)}%</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

