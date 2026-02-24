import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { uploadFile, deleteFile } from "@/lib/storage";
import { useAllPromotions, type Promotion } from "@/hooks/usePromotions";
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

type PromoForm = {
  title: string;
  description: string;
  image_storage_path: string;
  event_date: string;
  event_end_date: string;
  link_url: string;
  region: "il" | "international" | "all";
  language: "he" | "en";
  is_active: boolean;
  sort_order: number;
};

const emptyForm: PromoForm = {
  title: "",
  description: "",
  image_storage_path: "",
  event_date: "",
  event_end_date: "",
  link_url: "",
  region: "all",
  language: "he",
  is_active: true,
  sort_order: 0,
};

function formToPayload(form: PromoForm) {
  return {
    title: form.title,
    description: form.description || null,
    image_storage_path: form.image_storage_path || null,
    event_date: form.event_date || null,
    event_end_date: form.event_end_date || null,
    link_url: form.link_url,
    region: form.region,
    language: form.language,
    is_active: form.is_active,
    sort_order: form.sort_order,
  };
}

// ---- Image resize helper ----

const MAX_IMAGE_WIDTH = 1024;
const JPEG_QUALITY = 0.85;

/** Resize an image file if it exceeds MAX_IMAGE_WIDTH, returns JPEG. */
function resizeImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      if (img.width <= MAX_IMAGE_WIDTH) {
        resolve(file);
        return;
      }
      const scale = MAX_IMAGE_WIDTH / img.width;
      const canvas = document.createElement("canvas");
      canvas.width = MAX_IMAGE_WIDTH;
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to resize image."));
            return;
          }
          const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    };
    img.onerror = () => reject(new Error("Failed to load image for resizing."));
    img.src = URL.createObjectURL(file);
  });
}

// ---- Image drop zone ----

function ImageUploader({
  storagePath,
  onUploaded,
  onRemoved,
}: {
  storagePath: string;
  onUploaded: (path: string) => void;
  onRemoved: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }
      setError("");
      setUploading(true);
      try {
        const optimized = await resizeImage(file);
        const path = `promotions/${Date.now()}_${optimized.name}`;
        await uploadFile(path, optimized);
        onUploaded(path);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setUploading(false);
      }
    },
    [onUploaded],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const file = Array.from(e.clipboardData.items)
        .find((item) => item.type.startsWith("image/"))
        ?.getAsFile();
      if (file) {
        e.preventDefault();
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleRemove = async () => {
    if (storagePath) {
      try {
        await deleteFile(storagePath);
      } catch {
        // ignore — file may already be gone
      }
    }
    onRemoved();
  };

  if (storagePath) {
    return (
      <div className="space-y-2">
        <Label>Image</Label>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground truncate flex-1">
            {storagePath.split("/").pop()}
          </span>
          <Button variant="outline" size="sm" onClick={handleRemove}>
            Remove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Image</Label>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-accent bg-accent/5"
            : "border-border hover:border-muted-foreground"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onPaste={onPaste}
        onClick={() => inputRef.current?.click()}
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {uploading ? (
          <p className="text-sm text-muted-foreground">Uploading...</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Drop image here, paste from clipboard, or click to browse
          </p>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

// ---- Main component ----

const AdminPromotions = () => {
  const { data: promotions = [], isLoading } = useAllPromotions();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoForm>(emptyForm);

  const set = (key: keyof PromoForm, value: string | boolean | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["promotions"] });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("promotions")
        .insert(formToPayload(form));
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setForm(emptyForm);
      setEditingId(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("promotions")
        .update(formToPayload(form))
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setForm(emptyForm);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const promo = promotions.find((p) => p.id === id);
      if (promo?.image_storage_path) {
        try {
          await deleteFile(promo.image_storage_path);
        } catch {
          // ignore
        }
      }
      const { error } = await supabase
        .from("promotions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const startEdit = (p: Promotion) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description ?? "",
      image_storage_path: p.image_storage_path ?? "",
      event_date: p.event_date ?? "",
      event_end_date: p.event_end_date ?? "",
      link_url: p.link_url,
      region: p.region,
      language: p.language,
      is_active: p.is_active,
      sort_order: p.sort_order,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate(editingId);
    } else {
      createMutation.mutate();
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <h2 className="font-heading text-2xl font-bold text-primary">Promotions</h2>

      {/* Existing promotions list */}
      {promotions.length > 0 && (
        <div className="space-y-3">
          {promotions.map((p) => (
            <div
              key={p.id}
              className="border border-border rounded-lg p-4 bg-card flex items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{p.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {p.region}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {p.language === "he" ? "Hebrew" : "English"}
                  </span>
                  {!p.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                      inactive
                    </span>
                  )}
                </div>
                {p.event_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {p.event_date}
                    {p.event_end_date && p.event_end_date !== p.event_date
                      ? ` → ${p.event_end_date}`
                      : ""}
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(p)}
                  disabled={editingId !== null}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm("Delete this promotion?")) deleteMutation.mutate(p.id);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      <div className="border border-border rounded-lg p-6 bg-card space-y-5 max-w-xl">
        <h3 className="font-heading text-lg font-bold">
          {editingId ? "Edit Promotion" : "New Promotion"}
        </h3>

        <div className="space-y-2">
          <Label>Language</Label>
          <Select value={form.language} onValueChange={(v) => set("language", v)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="he">Hebrew</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Title *</Label>
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            dir={form.language === "he" ? "rtl" : "ltr"}
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            dir={form.language === "he" ? "rtl" : "ltr"}
          />
        </div>

        <ImageUploader
          storagePath={form.image_storage_path}
          onUploaded={(path) => set("image_storage_path", path)}
          onRemoved={() => set("image_storage_path", "")}
        />

        <div className="flex gap-4">
          <div className="space-y-2 flex-1">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={form.event_date}
              onChange={(e) => set("event_date", e.target.value)}
            />
          </div>
          <div className="space-y-2 flex-1">
            <Label>End Date</Label>
            <Input
              type="date"
              value={form.event_end_date}
              onChange={(e) => set("event_end_date", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Link URL *</Label>
          <Input
            value={form.link_url}
            onChange={(e) => set("link_url", e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2">
          <Label>Region</Label>
          <Select value={form.region} onValueChange={(v) => set("region", v)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="il">Israel</SelectItem>
              <SelectItem value="international">International</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Input
            type="number"
            value={form.sort_order}
            onChange={(e) => set("sort_order", Number(e.target.value))}
            className="w-24"
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={form.is_active}
            onCheckedChange={(v) => set("is_active", v)}
          />
          <Label>Active</Label>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={isSaving || !form.title || !form.link_url}>
            {isSaving ? "Saving..." : editingId ? "Update" : "Create"}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
          )}
        </div>

        {saveError && (
          <p className="text-sm text-destructive">{(saveError as Error).message}</p>
        )}
      </div>
    </div>
  );
};

export default AdminPromotions;
