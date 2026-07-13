import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, type Variants } from "framer-motion";
import {
  ScanLine, ShieldCheck, Upload, Brain, Eye, Video,
  Layers, Users, BarChart3, Cpu, ArrowRight, ChevronRight
} from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
  }),
};

const steps = [
  { icon: Upload, title: "Upload Video", desc: "Upload surveillance footage in any resolution" },
  { icon: ScanLine, title: "Process & Extract", desc: "AI extracts silhouettes and generates GEI" },
  { icon: Brain, title: "Feature Analysis", desc: "Ensemble CNN analyzes gait features" },
  { icon: ShieldCheck, title: "Identify", desc: "Match against gallery for biometric ID" },
];

const features = [
  { icon: Video, title: "Low-Resolution Support", desc: "Works with degraded surveillance footage through super-resolution enhancement" },
  { icon: Eye, title: "Cross-View Handling", desc: "Recognizes subjects across multiple camera angles from 0° to 180°" },
  { icon: Cpu, title: "Ensemble CNN", desc: "Multiple CNN models working together for robust feature extraction" },
  { icon: Layers, title: "Part-Based Segmentation", desc: "Body divided into semantic parts for fine-grained analysis" },
  { icon: Users, title: "Gait Profile Database", desc: "Comprehensive gallery with GEI templates and feature vectors" },
  { icon: BarChart3, title: "Detailed Analytics", desc: "Rank-1 accuracy metrics, similarity scores, and confidence reports" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <ScanLine className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground">GaitID</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button variant="glow" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute inset-0 bg-gradient-radial" />
        <div className="container relative z-10">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            animate="visible"
          >
            <motion.div custom={0} variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm mb-6">
              <Cpu className="w-3.5 h-3.5" />
              AI-Powered Biometric System
            </motion.div>
            <motion.h1 custom={1} variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
              <span className="text-foreground">Gait Recognition for </span>
              <span className="text-gradient-cyan">Biometric Identification</span>
            </motion.h1>
            <motion.p custom={2} variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Advanced deep learning system for identifying individuals through walking patterns in low-resolution surveillance footage using ensemble CNN and GEI analysis.
            </motion.p>
            <motion.div custom={3} variants={fadeUp} className="flex items-center justify-center gap-4">
              <Button variant="glow" size="lg" asChild>
                <Link to="/signup">Get Started <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
              <Button variant="outline-glow" size="lg" asChild>
                <Link to="/login">Login</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t border-border/50">
        <div className="container">
          <motion.div className="text-center mb-14" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold mb-3 text-foreground">How It Works</h2>
            <p className="text-muted-foreground">From video upload to biometric identification in four steps</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="relative card-glow p-6 text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-xs text-primary font-mono mb-2">STEP {i + 1}</div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
                {i < 3 && (
                  <ChevronRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40 z-10" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border/50">
        <div className="container">
          <motion.div className="text-center mb-14" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold mb-3 text-foreground">Key Features</h2>
            <p className="text-muted-foreground">Cutting-edge technology for gait-based biometric identification</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="card-glow p-6 group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feat.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                  <ScanLine className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="font-semibold text-foreground">GaitID</span>
              </div>
              <p className="text-sm text-muted-foreground">Graduation Project — Gait Recognition for Biometric Identification in Low-Resolution Surveillance Footage</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Team Members</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Team Member 1</li>
                <li>Team Member 2</li>
                <li>Team Member 3</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Supervisor</h4>
              <p className="text-sm text-muted-foreground">Prof. Supervisor Name</p>
              <p className="text-sm text-muted-foreground mt-1">Department of Computer Science</p>
              <p className="text-sm text-muted-foreground">University Name</p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border/50 text-center text-sm text-muted-foreground">
            © 2026 GaitID — All Rights Reserved
          </div>
        </div>
      </footer>
    </div>
  );
}
