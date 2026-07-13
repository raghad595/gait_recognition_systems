import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, Video, Target, Activity, Upload, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { dashboardAPI } from "@/lib/api";
import { toast } from "sonner";

type DashboardStats = {
  totalSubjects: number;
  processedVideos: number;
  accuracy: number;
  activeSessions: number;
};

type ChartPoint = {
  time: string;
  accuracy: number;
};

type RecentUpload = {
  id: string;
  filename: string;
  subject: string;
  status: string;
  score: string | number;
  time: string;
};

const COLORS = ['hsl(192 95% 55%)', 'hsl(280 85% 60%)', 'hsl(340 85% 60%)', 'hsl(160 80% 45%)', 'hsl(40 95% 60%)'];

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalSubjects: 0,
    processedVideos: 0,
    accuracy: 0,
    activeSessions: 0,
  });
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsRes, chartRes, uploadsRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getAccuracyChart(),
          dashboardAPI.getRecentUploads(),
        ]);

        setStats(statsRes.data);
        setChartData(chartRes.data || []);
        setRecentUploads(uploadsRes.data || []);
      } catch (error) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const statsCards = useMemo(
    () => [
      { icon: Users, label: "Total Subjects", value: stats.totalSubjects, color: "text-primary" },
      { icon: Video, label: "Processed Videos", value: stats.processedVideos, color: "text-accent" },
      { icon: Target, label: "Recognition Accuracy", value: `${Number(stats.accuracy || 0).toFixed(1)}%`, color: "text-success" },
      { icon: Activity, label: "Active Sessions", value: stats.activeSessions, color: "text-warning" },
    ],
    [stats]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview of gait recognition system</p>
        </div>
        <Button variant="glow" asChild>
          <Link to="/dashboard/upload"><Upload className="w-4 h-4 mr-2" /> Quick Upload</Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading dashboard data...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card-glow p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 card-glow p-6">
              <h3 className="font-semibold text-foreground mb-4">Recognition Activity</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                  <XAxis dataKey="time" stroke="hsl(215 20% 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215 20% 55%)" fontSize={12} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(222 44% 9%)", border: "1px solid hsl(222 30% 18%)", borderRadius: 8, color: "hsl(210 40% 95%)" }} />
                  <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-2 card-glow p-6">
              <h3 className="font-semibold text-foreground mb-4">Recent Uploads</h3>
              <div className="space-y-3">
                {recentUploads.slice(0, 4).map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{u.filename}</p>
                      <p className="text-xs text-muted-foreground">{u.time}</p>
                    </div>
                    <span className={`text-xs font-mono px-2 py-1 rounded-full ${
                      u.status === "identified" ? "bg-success/10 text-success" :
                      u.status === "processing" ? "bg-primary/10 text-primary" :
                      "bg-destructive/10 text-destructive"
                    }`}>{u.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card-glow p-6">
            <h3 className="font-semibold text-foreground mb-4">All Recent Uploads</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-3 font-medium">ID</th>
                    <th className="text-left py-3 font-medium">File Name</th>
                    <th className="text-left py-3 font-medium">Subject</th>
                    <th className="text-left py-3 font-medium">Status</th>
                    <th className="text-left py-3 font-medium">Score</th>
                    <th className="text-right py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUploads.map((u) => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 font-mono text-primary text-xs">{u.id}</td>
                      <td className="py-3 text-foreground">{u.filename}</td>
                      <td className="py-3 text-muted-foreground">{u.subject}</td>
                      <td className="py-3 text-foreground">{u.status}</td>
                      <td className="py-3 text-foreground">{u.score}</td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

