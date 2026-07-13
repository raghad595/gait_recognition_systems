import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Fingerprint, Loader2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface NewGaitRegistrationDialogProps {
  /** Whether the dialog is visible */
  open: boolean;
  /** The new, unrecognised feature vector that should be stored */
  featureVector: number[];
  /**
   * Called when the user clicks **Save**.
   * Receives the trimmed name and the feature vector.
   * Should return a Promise – the dialog shows a spinner while it resolves.
   */
  onSave: (personName: string, featureVector: number[]) => Promise<void>;
  /** Called when the user clicks **Skip** or closes the dialog */
  onSkip: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewGaitRegistrationDialog({
  open,
  featureVector,
  onSave,
  onSkip,
}: NewGaitRegistrationDialogProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input whenever dialog opens and reset state
  useEffect(() => {
    if (open) {
      setName("");
      setNameError("");
      setSaving(false);
      // slight delay so the animation has started before we steal focus
      const id = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(id);
    }
  }, [open]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Person name cannot be empty.");
      inputRef.current?.focus();
      return;
    }
    setNameError("");
    setSaving(true);
    try {
      await onSave(trimmed, featureVector);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (saving) return; // don't allow skip while saving
    onSkip();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleSkip();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={handleSkip}
            aria-hidden="true"
          />

          {/* ── Panel ── */}
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ngrd-title"
            aria-describedby="ngrd-description"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="
              fixed left-1/2 top-1/2 z-50
              w-[92vw] max-w-md
              -translate-x-1/2 -translate-y-1/2
              rounded-2xl border border-slate-700/70
              bg-slate-900/95 shadow-2xl shadow-black/60
              backdrop-blur-xl
              p-7 space-y-5
            "
          >
            {/* Close (×) button */}
            <button
              id="ngrd-close-btn"
              onClick={handleSkip}
              disabled={saving}
              aria-label="Close"
              className="
                absolute right-4 top-4
                text-slate-500 hover:text-slate-200
                transition disabled:opacity-30
              "
            >
              <X className="w-4 h-4" />
            </button>

            {/* ── Warning banner ── */}
            <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/25 p-4">
              <span className="mt-0.5 flex-shrink-0 rounded-full bg-amber-500/20 p-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </span>
              <div className="space-y-0.5">
                <p
                  id="ngrd-title"
                  className="text-sm font-semibold text-amber-300"
                >
                  Unknown Gait Signature Detected
                </p>
                <p
                  id="ngrd-description"
                  className="text-xs text-amber-400/80 leading-relaxed"
                >
                  A new person was detected whose gait feature vector does not
                  match any existing profile in the database. Assign a name to
                  register them, or skip to discard.
                </p>
              </div>
            </div>

            {/* ── Feature vector preview (truncated) ── */}
            <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 px-4 py-2.5 flex items-center gap-2.5">
              <Fingerprint className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <p className="text-xs text-slate-400 font-mono truncate">
                <span className="text-slate-500 mr-1">vector</span>
                [{featureVector.slice(0, 6).map((v) => v.toFixed(3)).join(", ")}
                {featureVector.length > 6 ? `, … +${featureVector.length - 6} more` : ""}]
              </p>
            </div>

            {/* ── Name input ── */}
            <div className="space-y-1.5">
              <label
                htmlFor="ngrd-person-name"
                className="block text-sm font-medium text-slate-300"
              >
                Person Name{" "}
                <span className="text-red-400" aria-hidden="true">*</span>
              </label>

              <input
                ref={inputRef}
                id="ngrd-person-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError("");
                }}
                onKeyDown={handleKeyDown}
                disabled={saving}
                placeholder="e.g. John Doe"
                autoComplete="off"
                aria-describedby={nameError ? "ngrd-name-error" : undefined}
                aria-invalid={!!nameError}
                className={`
                  w-full rounded-lg px-4 py-2.5
                  bg-slate-800/70 border text-sm text-white
                  placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-cyan-500/50
                  transition disabled:opacity-50
                  ${nameError
                    ? "border-red-500/60 focus:border-red-500"
                    : "border-slate-700 focus:border-cyan-500"
                  }
                `}
              />

              {/* Inline error */}
              <AnimatePresence>
                {nameError && (
                  <motion.p
                    id="ngrd-name-error"
                    role="alert"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-red-400 flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    {nameError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* ── Action buttons ── */}
            <div className="flex gap-3 pt-1">
              {/* Skip */}
              <Button
                id="ngrd-skip-btn"
                variant="outline"
                className="
                  flex-1
                  border-slate-700 text-slate-400
                  hover:border-slate-500 hover:text-slate-200
                  hover:bg-slate-800/60
                  transition
                "
                onClick={handleSkip}
                disabled={saving}
              >
                Skip
              </Button>

              {/* Save */}
              <Button
                id="ngrd-save-btn"
                className="
                  flex-1
                  bg-cyan-500 hover:bg-cyan-400
                  text-black font-semibold
                  shadow-lg shadow-cyan-500/25
                  disabled:opacity-40
                  transition
                "
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
