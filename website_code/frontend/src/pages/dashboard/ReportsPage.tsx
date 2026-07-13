import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, Target, BarChart3, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { reportsAPI } from "@/lib/api";
import { toast } from "sonner";

type Summary = {
  rank1Accuracy: number;
  rank5Accuracy: number;
  datasetSize: number;
  modelParameters: string;
};

type ConditionAccuracy = {
  condition: string;
  accuracy: number;
};

type Distribution = {
  condition: string;
  percentage: number;
};

const tooltipStyle = {
  backgroundColor: "hsl(222 44% 9%)",
  border: "1px solid hsl(222 30% 18%)",
  borderRadius: 8,
  color: "hsl(210 40% 95%)",
};

const COLORS = ['hsl(192 95% 55%)', 'hsl(280 85% 60%)', 'hsl(340 85% 60%)', 'hsl(160 80% 45%)', 'hsl(40 95% 60%)'];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({
    rank1Accuracy: 0,
    rank5Accuracy: 0,
    datasetSize: 0,
    modelParameters: "N/A",
  });
  const [accuracyByCondition, setAccuracyByCondition] = useState<ConditionAccuracy[]>([]);
  const [distribution, setDistribution] = useState<Distribution[]>([]);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const [summaryRes, conditionRes, distRes] = await Promise.all([
          reportsAPI.getSummary(),
          reportsAPI.getAccuracyByCondition(),
          reportsAPI.getDatasetDistribution(),
        ]);

        setSummary(summaryRes.data);
        setAccuracyByCondition(conditionRes.data || []);
        setDistribution(distRes.data || []);
      } catch (error) {
        toast.error("Failed to load reports data");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const cards = useMemo(
    () => [
      { icon: Target, label: "Overall Rank-1 Accuracy", value: `${Number(summary.rank1Accuracy || 0).toFixed(1)}%`, sub: "Across all conditions" },
      { icon: BarChart3, label: "Dataset Size", value: Number(summary.datasetSize || 0).toLocaleString(), sub: "Total gait profiles" },
      { icon: PieChart, label: "Model Parameters", value: summary.modelParameters || "N/A", sub: "Model configuration" },
    ],
    [summary]
  );

  const exportReport = async () => {
    try {
      const result = await reportsAPI.exportReports();
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gait-report-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report exported");
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm">Detailed accuracy metrics and system performance</p>
        </div>
        <Button variant="glow" onClick={exportReport}><Download className="w-4 h-4 mr-2" /> Download Report</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading reports data...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {cards.map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card-glow p-5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <card.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-sm text-foreground font-medium">{card.label}</p>
                <p className="text-xs text-muted-foreground">{card.sub}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-glow p-6">
              <h3 className="font-semibold text-foreground mb-4">Accuracy by Condition</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={accuracyByCondition}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                  <XAxis dataKey="condition" stroke="hsl(215 20% 55%)" fontSize={11} />
                  <YAxis stroke="hsl(215 20% 55%)" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="accuracy" radius={[3, 3, 0, 0]} name="Accuracy">
                    {accuracyByCondition.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card-glow p-6">
              <h3 className="font-semibold text-foreground mb-4">Dataset Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                  <XAxis dataKey="condition" stroke="hsl(215 20% 55%)" fontSize={11} />
                  <YAxis stroke="hsl(215 20% 55%)" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="percentage" radius={[3, 3, 0, 0]} name="Percentage">
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

