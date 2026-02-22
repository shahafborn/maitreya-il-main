import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminMeetingEditor from "./AdminMeetingEditor";
import AdminContentBlockEditor from "./AdminContentBlockEditor";
import AdminResourceUploader from "./AdminResourceUploader";
import AdminRecordingEditor from "./AdminRecordingEditor";
import type { Course } from "@/hooks/useCourse";

const AdminCourseEditor = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useQuery<Course>({
    queryKey: ["admin-course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId!)
        .single();
      if (error) throw error;
      return data as Course;
    },
    enabled: !!courseId,
  });

  if (isLoading || !course) {
    return <div className="animate-pulse text-muted-foreground">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/admin/courses"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Courses
        </Link>
        <h2 className="font-heading text-2xl font-bold text-primary">
          {course.title}
        </h2>
      </div>

      <Tabs defaultValue="metadata" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="metadata">Settings</TabsTrigger>
          <TabsTrigger value="meetings">Schedule</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
        </TabsList>

        <TabsContent value="metadata">
          <MetadataEditor course={course} />
        </TabsContent>
        <TabsContent value="meetings">
          <AdminMeetingEditor courseId={course.id} />
        </TabsContent>
        <TabsContent value="content">
          <AdminContentBlockEditor courseId={course.id} />
        </TabsContent>
        <TabsContent value="resources">
          <AdminResourceUploader courseId={course.id} />
        </TabsContent>
        <TabsContent value="recordings">
          <AdminRecordingEditor courseId={course.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ---- Metadata sub-editor ----

function MetadataEditor({ course }: { course: Course }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: course.title,
    slug: course.slug,
    description: course.description,
    hero_image_url: course.hero_image_url ?? "",
    course_start_date: course.course_start_date ?? "",
    access_code: course.access_code ?? "",
    default_dir: course.default_dir,
    is_published: course.is_published,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("courses")
        .update({
          title: form.title,
          slug: form.slug,
          description: form.description,
          hero_image_url: form.hero_image_url || null,
          course_start_date: form.course_start_date || null,
          access_code: form.access_code || null,
          default_dir: form.default_dir,
          is_published: form.is_published,
        })
        .eq("id", course.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-course", course.id] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  const set = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Slug</Label>
        <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} dir="ltr" />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Hero Image URL (optional)</Label>
        <Input
          value={form.hero_image_url}
          onChange={(e) => set("hero_image_url", e.target.value)}
          placeholder="https://..."
                 />
      </div>

      <div className="space-y-2">
        <Label>Course Start Date (optional)</Label>
        <Input
          type="date"
          value={form.course_start_date}
          onChange={(e) => set("course_start_date", e.target.value)}
                 />
      </div>

      <div className="space-y-2">
        <Label>Access Code (leave empty for free courses)</Label>
        <Input
          value={form.access_code}
          onChange={(e) => set("access_code", e.target.value)}
          placeholder="Leave empty for open enrollment"
                 />
      </div>

      <div className="space-y-2">
        <Label>Default Direction</Label>
        <Select value={form.default_dir} onValueChange={(v) => set("default_dir", v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ltr">LTR (English)</SelectItem>
            <SelectItem value="rtl">RTL (Hebrew)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={form.is_published}
          onCheckedChange={(v) => set("is_published", v)}
        />
        <Label>Published</Label>
      </div>

      <Button
        onClick={() => updateMutation.mutate()}
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending ? "Saving..." : "Save Changes"}
      </Button>

      {updateMutation.isError && (
        <p className="text-sm text-destructive">
          {(updateMutation.error as Error).message}
        </p>
      )}
      {updateMutation.isSuccess && (
        <p className="text-sm text-green-600">Saved!</p>
      )}
    </div>
  );
}

export default AdminCourseEditor;
