import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCourseResources, type CourseResource } from "@/hooks/useCourseContent";
import { uploadFile, deleteFile, isExternalUrl } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { friendlyTitle } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  courseId: string;
}

const AdminResourceUploader = ({ courseId }: Props) => {
  const queryClient = useQueryClient();
  const { data: resources = [], isLoading } = useCourseResources(courseId);

  const photos = resources.filter((r) => r.resource_type === "photo");
  // Links live in the same list as files - both are "things to open".
  const files = resources.filter(
    (r) => r.resource_type === "pdf" || r.resource_type === "link"
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["course-resources", courseId] });

  const deleteMutation = useMutation({
    mutationFn: async (resource: CourseResource) => {
      // Delete storage object first, then DB row. A link has no object in the
      // bucket - deleting it would throw and strand the row.
      if (!isExternalUrl(resource.storage_path)) {
        await deleteFile(resource.storage_path);
      }
      const { error } = await supabase
        .from("course_resources")
        .delete()
        .eq("id", resource.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  if (isLoading) return <div className="animate-pulse text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Upload new resource */}
      <UploadForm courseId={courseId} sortOrder={resources.length} />

      {/* Photos */}
      {photos.length > 0 && (
        <div>
          <h3 className="font-heading text-lg font-semibold mb-3">Photos ({photos.length})</h3>
          <div className="space-y-2">
            {photos.map((r) => (
              <ResourceRow
                key={r.id}
                resource={r}
                courseId={courseId}
                onDelete={() => deleteMutation.mutate(r)}
                deleting={deleteMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* PDFs */}
      {files.length > 0 && (
        <div>
          <h3 className="font-heading text-lg font-semibold mb-3">Files &amp; Links ({files.length})</h3>
          <div className="space-y-2">
            {files.map((r) => (
              <ResourceRow
                key={r.id}
                resource={r}
                courseId={courseId}
                onDelete={() => deleteMutation.mutate(r)}
                deleting={deleteMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function ResourceRow({
  resource,
  courseId,
  onDelete,
  deleting,
}: {
  resource: CourseResource;
  courseId: string;
  onDelete: () => void;
  deleting: boolean;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(resource.title);
  const [description, setDescription] = useState(resource.description ?? "");

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("course_resources")
        .update({ title, description: description || null })
        .eq("id", resource.id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["course-resources", courseId] }),
  });

  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
      <span className="text-xs text-muted-foreground w-12 shrink-0 uppercase">
        {resource.resource_type}
      </span>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1"
        placeholder="Title"
      />
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="flex-1"
        placeholder="Description (optional)"
      />
      <Button
        size="sm"
        variant="outline"
        onClick={() => updateMutation.mutate()}
        disabled={updateMutation.isPending}
      >
        Save
      </Button>
      <Button size="sm" variant="destructive" onClick={onDelete} disabled={deleting}>
        Delete
      </Button>
    </div>
  );
}

function UploadForm({ courseId, sortOrder }: { courseId: string; sortOrder: number }) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [resourceType, setResourceType] = useState<"photo" | "pdf" | "link">("photo");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  /** A link has no file to upload - just a row with the URL in storage_path. */
  const handleAddLink = async () => {
    if (!linkTitle.trim() || !linkUrl.trim()) return;
    setUploading(true);
    setError("");
    try {
      const { error: dbError } = await supabase.from("course_resources").insert({
        course_id: courseId,
        resource_type: "link",
        title: linkTitle.trim(),
        storage_path: linkUrl.trim(),
        sort_order: sortOrder,
      });
      if (dbError) throw dbError;
      queryClient.invalidateQueries({ queryKey: ["course-resources", courseId] });
      setLinkTitle("");
      setLinkUrl("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not add the link");
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const folder = resourceType === "photo" ? "photos" : "files";
      const storagePath = `${courseId}/${folder}/${Date.now()}_${file.name}`;
      await uploadFile(storagePath, file);

      const { error: dbError } = await supabase.from("course_resources").insert({
        course_id: courseId,
        resource_type: resourceType,
        title: friendlyTitle(file.name),
        storage_path: storagePath,
        mime_type: file.type,
        file_size: file.size,
        sort_order: sortOrder,
      });
      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ["course-resources", courseId] });
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
      <h3 className="font-heading text-lg font-semibold">Add Resource</h3>
      <div className="flex items-end gap-3">
        <div>
          <Label className="text-xs">Type</Label>
          <Select
            value={resourceType}
            onValueChange={(v: "photo" | "pdf" | "link") => setResourceType(v)}
          >
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="photo">Photo</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="link">Link</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {resourceType === "link" ? (
          <>
            <div className="flex-1">
              <Label className="text-xs">Title</Label>
              <Input
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="What the link is called on the page"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs">URL</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                dir="ltr"
              />
            </div>
            <Button onClick={handleAddLink} disabled={uploading}>
              {uploading ? "Adding..." : "Add Link"}
            </Button>
          </>
        ) : (
          <>
            <div className="flex-1">
              <Label className="text-xs">File</Label>
              <Input
                ref={fileRef}
                type="file"
                accept={resourceType === "photo" ? "image/*" : "application/pdf"}
              />
            </div>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export default AdminResourceUploader;
