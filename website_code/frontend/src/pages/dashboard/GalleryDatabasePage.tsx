import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { gaitAPI } from "@/lib/api";
import { toast } from "sonner";

type Profile = {
  _id: string;
  file_name: string;
  condition: string;
  status: string;
  description?: string;
  createdAt: string;
};

const conditionColors: Record<string, string> = {
  normal: "bg-success/10 text-success border-success/20",
  bag: "bg-primary/10 text-primary border-primary/20",
  coat: "bg-warning/10 text-warning border-warning/20",
};

export default function GalleryDatabasePage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const response = await gaitAPI.listProfiles({ page: 1, limit: 200 });
        setProfiles(response.data?.profiles || []);
      } catch (error) {
        toast.error("Failed to load gallery data");
      } finally {
        setLoading(false);
      }
    };
    loadProfiles();
  }, []);

  const filtered = useMemo(
    () =>
      profiles.filter((s) =>
        s.file_name.toLowerCase().includes(search.toLowerCase()) ||
        s._id.toLowerCase().includes(search.toLowerCase())
      ),
    [profiles, search]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gallery Database</h1>
          <p className="text-muted-foreground text-sm">{profiles.length} profiles in the system</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search profiles..." className="pl-10 bg-secondary border-border w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading gallery...</p>
      ) : (
        <div className="card-glow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">ID</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">File Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Condition</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s._id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer">
                    <td className="py-3 px-4 font-mono text-primary text-xs">{s._id.slice(0, 8)}</td>
                    <td className="py-3 px-4 text-foreground font-medium">{s.file_name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{s.description || "-"}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={conditionColors[s.condition] || "bg-secondary text-foreground border-border"}>
                        {s.condition}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-foreground">{s.status}</td>
                    <td className="py-3 px-4 text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

