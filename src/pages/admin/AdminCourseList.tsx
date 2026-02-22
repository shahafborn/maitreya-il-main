import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAllCourses } from "@/hooks/useCourse";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AdminCourseList = () => {
  const { data: courses = [], isLoading } = useAllCourses();
  const { isAdminOrAbove } = useAdmin();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("courses").insert({
        title: newTitle,
        slug: newSlug,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setOpen(false);
      setNewTitle("");
      setNewSlug("");
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.rpc("update_course_metadata", {
        _course_id: id,
        _is_published: published,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">Loading courses...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold text-primary">Courses</h2>
        {isAdminOrAbove && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>New Course</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Course</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Introduction to Tantra"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder="intro-to-tantra"
                                   />
                </div>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !newTitle || !newSlug}
                  className="w-full"
                >
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
                {createMutation.isError && (
                  <p className="text-sm text-destructive">
                    {(createMutation.error as Error).message}
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="flex items-center justify-between bg-card border border-border rounded-lg p-4"
          >
            <div>
              <Link
                to={`/admin/courses/${course.id}`}
                className="font-medium text-foreground hover:text-accent transition-colors"
              >
                {course.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                /courses/{course.slug}
                {course.access_code && " (access code required)"}
              </p>
            </div>
            {isAdminOrAbove && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {course.is_published ? "Published" : "Draft"}
                </span>
                <Switch
                  checked={course.is_published}
                  onCheckedChange={(checked) =>
                    togglePublish.mutate({ id: course.id, published: checked })
                  }
                />
              </div>
            )}
            {!isAdminOrAbove && (
              <span className="text-xs text-muted-foreground">
                {course.is_published ? "Published" : "Draft"}
              </span>
            )}
          </div>
        ))}
        {courses.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No courses yet. Create your first one above.
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminCourseList;
