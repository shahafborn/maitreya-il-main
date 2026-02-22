import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCourseMeetings, type CourseMeeting } from "@/hooks/useCourseContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const WEEKDAY_LABELS: Record<string, string> = {
  sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday",
  thu: "Thursday", fri: "Friday", sat: "Saturday",
};

interface Props {
  courseId: string;
}

const AdminMeetingEditor = ({ courseId }: Props) => {
  const queryClient = useQueryClient();
  const { data: meetings = [], isLoading } = useCourseMeetings(courseId);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["course-meetings", courseId] });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_meetings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  if (isLoading) return <div className="animate-pulse text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <h3 className="font-heading text-lg font-semibold">Schedule</h3>

      {meetings.map((m) => (
        <MeetingRow key={m.id} meeting={m} courseId={courseId} onDelete={() => deleteMutation.mutate(m.id)} />
      ))}

      <NewMeetingForm courseId={courseId} sortOrder={meetings.length} />
    </div>
  );
};

// ---- Inline edit row ----

function MeetingRow({
  meeting: m,
  courseId,
  onDelete,
}: {
  meeting: CourseMeeting;
  courseId: string;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    weekday: m.weekday,
    label: m.label,
    start_time_local: m.start_time_local,
    duration_minutes: String(m.duration_minutes),
    zoom_join_url: m.zoom_join_url ?? "",
    zoom_meeting_id: m.zoom_meeting_id ?? "",
    zoom_passcode: m.zoom_passcode ?? "",
    note: m.note ?? "",
    sort_order: String(m.sort_order),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("course_meetings")
        .update({
          weekday: form.weekday,
          label: form.label,
          start_time_local: form.start_time_local,
          duration_minutes: Number(form.duration_minutes),
          zoom_join_url: form.zoom_join_url || null,
          zoom_meeting_id: form.zoom_meeting_id || null,
          zoom_passcode: form.zoom_passcode || null,
          note: form.note || null,
          sort_order: Number(form.sort_order),
        })
        .eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["course-meetings", courseId] }),
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs">Weekday</Label>
          <Select value={form.weekday} onValueChange={(v) => set("weekday", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {WEEKDAYS.map((d) => (
                <SelectItem key={d} value={d}>{WEEKDAY_LABELS[d]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Label</Label>
          <Input value={form.label} onChange={(e) => set("label", e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Time (local)</Label>
          <Input type="time" value={form.start_time_local} onChange={(e) => set("start_time_local", e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Duration (min)</Label>
          <Input type="number" value={form.duration_minutes} onChange={(e) => set("duration_minutes", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Zoom URL</Label>
          <Input value={form.zoom_join_url} onChange={(e) => set("zoom_join_url", e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Meeting ID</Label>
          <Input value={form.zoom_meeting_id} onChange={(e) => set("zoom_meeting_id", e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Passcode</Label>
          <Input value={form.zoom_passcode} onChange={(e) => set("zoom_passcode", e.target.value)} />
        </div>
      </div>

      <div>
        <Label className="text-xs">Note</Label>
        <Textarea value={form.note} onChange={(e) => set("note", e.target.value)} rows={2} />
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save"}
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete}>Delete</Button>
      </div>
    </div>
  );
}

// ---- New meeting form ----

function NewMeetingForm({ courseId, sortOrder }: { courseId: string; sortOrder: number }) {
  const queryClient = useQueryClient();
  const [weekday, setWeekday] = useState("sat");
  const [label, setLabel] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("course_meetings").insert({
        course_id: courseId,
        weekday,
        label,
        start_time_local: "10:00",
        sort_order: sortOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-meetings", courseId] });
      setLabel("");
    },
  });

  return (
    <div className="flex items-end gap-3 pt-4 border-t border-border">
      <div>
        <Label className="text-xs">Weekday</Label>
        <Select value={weekday} onValueChange={setWeekday}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {WEEKDAYS.map((d) => (
              <SelectItem key={d} value={d}>{WEEKDAY_LABELS[d]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <Label className="text-xs">Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Main Teaching" />
      </div>
      <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !label}>
        Add Meeting
      </Button>
    </div>
  );
}

export default AdminMeetingEditor;
