import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  type DateRange,
  useTotalUsers,
  useTotalEnrollments,
  useTotalViews,
  useTotalDownloads,
  useSignupTrend,
  useEnrollmentsPerCourse,
  useViewsPerRecording,
  useDownloadsPerResource,
} from "@/hooks/useAnalytics";

const RANGES: { label: string; value: DateRange }[] = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "All time", value: "all" },
];

const SummaryCard = ({ label, value, loading }: { label: string; value: number; loading: boolean }) => (
  <div className="bg-card border border-border rounded-lg p-5">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-3xl font-bold text-foreground mt-1">
      {loading ? "..." : value.toLocaleString()}
    </p>
  </div>
);

const AdminAnalytics = () => {
  const [range, setRange] = useState<DateRange>("30d");

  const totalUsers = useTotalUsers();
  const totalEnrollments = useTotalEnrollments();
  const totalViews = useTotalViews(range);
  const totalDownloads = useTotalDownloads(range);
  const signupTrend = useSignupTrend(range);
  const enrollmentsPerCourse = useEnrollmentsPerCourse();
  const viewsPerRecording = useViewsPerRecording(range);
  const downloadsPerResource = useDownloadsPerResource(range);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold text-primary">Analytics</h2>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                range === r.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Total Users" value={totalUsers.data ?? 0} loading={totalUsers.isLoading} />
        <SummaryCard label="Enrollments" value={totalEnrollments.data ?? 0} loading={totalEnrollments.isLoading} />
        <SummaryCard label="Video Views" value={totalViews.data ?? 0} loading={totalViews.isLoading} />
        <SummaryCard label="Downloads" value={totalDownloads.data ?? 0} loading={totalDownloads.isLoading} />
      </div>

      {/* Signup trend */}
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <h3 className="font-heading text-lg font-semibold mb-4">Signup Trend</h3>
        {(signupTrend.data?.length ?? 0) > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={signupTrend.data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
        )}
      </div>

      {/* Enrollments per course */}
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <h3 className="font-heading text-lg font-semibold mb-4">Enrollments per Course</h3>
        {(enrollmentsPerCourse.data?.length ?? 0) > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={enrollmentsPerCourse.data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
        )}
      </div>

      {/* Video views per recording */}
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <h3 className="font-heading text-lg font-semibold mb-4">Video Views per Recording</h3>
        {(viewsPerRecording.data?.length ?? 0) > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={viewsPerRecording.data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
        )}
      </div>

      {/* Downloads per resource */}
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <h3 className="font-heading text-lg font-semibold mb-4">Downloads per Resource</h3>
        {(downloadsPerResource.data?.length ?? 0) > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={downloadsPerResource.data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
