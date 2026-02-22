import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCourseRecordings, type CourseRecording } from "@/hooks/useCourseContent";
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
import VideoEmbed from "@/components/course/VideoEmbed";

const EMBED_TYPES = ["bunny", "youtube", "iframe"] as const;
const SESSION_TYPES = [
  { value: "main", label: "Main Teaching" },
  { value: "clarification", label: "Clarification" },
];

interface Props {
  courseId: string;
}

const AdminRecordingEditor = ({ courseId }: Props) => {
  const queryClient = useQueryClient();
  const { data: recordings = [], isLoading } = useCourseRecordings(courseId);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["course-recordings", courseId] });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_recordings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  if (isLoading) return <div className="animate-pulse text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <h3 className="font-heading text-lg font-semibold">Recordings</h3>

      {recordings.map((rec) => (
        <RecordingRow
          key={rec.id}
          recording={rec}
          courseId={courseId}
          onDelete={() => deleteMutation.mutate(rec.id)}
        />
      ))}

      <NewRecordingForm courseId={courseId} sortOrder={recordings.length} />
    </div>
  );
};

function RecordingRow({
  recording: rec,
  courseId,
  onDelete,
}: {
  recording: CourseRecording;
  courseId: string;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: rec.title,
    week_number: rec.week_number !== null ? String(rec.week_number) : "",
    session_type: rec.session_type ?? "",
    embed_type: rec.embed_type,
    embed_url: rec.embed_url,
    sort_order: String(rec.sort_order),
  });
  const [showPreview, setShowPreview] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("course_recordings")
        .update({
          title: form.title,
          week_number: form.week_number ? Number(form.week_number) : null,
          session_type: form.session_type || null,
          embed_type: form.embed_type,
          embed_url: form.embed_url,
          sort_order: Number(form.sort_order),
        })
        .eq("id", rec.id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["course-recordings", courseId] }),
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="md:col-span-2">
          <Label className="text-xs">Title</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Week #</Label>
          <Input type="number" value={form.week_number} onChange={(e) => set("week_number", e.target.value)} placeholder="—" />
        </div>
        <div>
          <Label className="text-xs">Session Type</Label>
          <Select value={form.session_type} onValueChange={(v) => set("session_type", v)}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {SESSION_TYPES.map((st) => (
                <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Sort Order</Label>
          <Input type="number" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <Label className="text-xs">Embed Type</Label>
          <Select value={form.embed_type} onValueChange={(v) => set("embed_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {EMBED_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-3">
          <Label className="text-xs">Embed URL</Label>
          <Input value={form.embed_url} onChange={(e) => set("embed_url", e.target.value)} />
        </div>
      </div>

      {showPreview && form.embed_url && (
        <div className="max-w-md">
          <VideoEmbed
            embedType={form.embed_type as "bunny" | "youtube" | "iframe"}
            embedUrl={form.embed_url}
            title={form.title}
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowPreview(!showPreview)}>
          {showPreview ? "Hide Preview" : "Preview"}
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete}>Delete</Button>
      </div>
    </div>
  );
}

function NewRecordingForm({ courseId, sortOrder }: { courseId: string; sortOrder: number }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [embedType, setEmbedType] = useState("bunny");
  const [embedUrl, setEmbedUrl] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("course_recordings").insert({
        course_id: courseId,
        title,
        embed_type: embedType,
        embed_url: embedUrl,
        sort_order: sortOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-recordings", courseId] });
      setTitle("");
      setEmbedUrl("");
    },
  });

  return (
    <div className="flex items-end gap-3 pt-4 border-t border-border">
      <div className="flex-1">
        <Label className="text-xs">Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Week 1 — Main Teaching" />
      </div>
      <div>
        <Label className="text-xs">Type</Label>
        <Select value={embedType} onValueChange={setEmbedType}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {EMBED_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <Label className="text-xs">Embed URL</Label>
        <Input value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} placeholder="https://..." />
      </div>
      <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !title || !embedUrl}>
        Add
      </Button>
    </div>
  );
}

export default AdminRecordingEditor;
