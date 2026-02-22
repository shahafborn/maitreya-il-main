import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCourseContentBlocks, type CourseContentBlock } from "@/hooks/useCourseContent";
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

const SECTIONS = ["about", "practice", "footer_note", "custom"];

interface Props {
  courseId: string;
}

const AdminContentBlockEditor = ({ courseId }: Props) => {
  const queryClient = useQueryClient();
  const { data: blocks = [], isLoading } = useCourseContentBlocks(courseId);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["course-content-blocks", courseId] });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_content_blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  if (isLoading) return <div className="animate-pulse text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <h3 className="font-heading text-lg font-semibold">Content Blocks</h3>

      {blocks.map((block) => (
        <BlockRow
          key={block.id}
          block={block}
          courseId={courseId}
          onDelete={() => deleteMutation.mutate(block.id)}
        />
      ))}

      <NewBlockForm courseId={courseId} sortOrder={blocks.length} />
    </div>
  );
};

function BlockRow({
  block,
  courseId,
  onDelete,
}: {
  block: CourseContentBlock;
  courseId: string;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    section: block.section,
    title: block.title ?? "",
    body: block.body,
    dir: block.dir,
    sort_order: String(block.sort_order),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("course_content_blocks")
        .update({
          section: form.section,
          title: form.title || null,
          body: form.body,
          dir: form.dir,
          sort_order: Number(form.sort_order),
        })
        .eq("id", block.id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["course-content-blocks", courseId] }),
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs">Section</Label>
          <Select value={form.section} onValueChange={(v) => set("section", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SECTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Direction</Label>
          <Select value={form.dir} onValueChange={(v) => set("dir", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ltr">LTR</SelectItem>
              <SelectItem value="rtl">RTL</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Sort Order</Label>
          <Input type="number" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
        </div>
      </div>

      <div>
        <Label className="text-xs">Title (optional)</Label>
        <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
      </div>

      <div>
        <Label className="text-xs">Body</Label>
        <Textarea
          value={form.body}
          onChange={(e) => set("body", e.target.value)}
          rows={6}
          dir={form.dir}
        />
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

function NewBlockForm({ courseId, sortOrder }: { courseId: string; sortOrder: number }) {
  const queryClient = useQueryClient();
  const [section, setSection] = useState("about");

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("course_content_blocks").insert({
        course_id: courseId,
        section,
        body: "",
        sort_order: sortOrder,
      });
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["course-content-blocks", courseId] }),
  });

  return (
    <div className="flex items-end gap-3 pt-4 border-t border-border">
      <div>
        <Label className="text-xs">Section</Label>
        <Select value={section} onValueChange={setSection}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SECTIONS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
        Add Block
      </Button>
    </div>
  );
}

export default AdminContentBlockEditor;
