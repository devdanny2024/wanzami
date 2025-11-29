import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { MovieTitle } from "./MoviesManagement"; // reuse shape

export function AddEditSeriesForm({
  token,
  series,
  onClose,
  onSaved,
}: {
  token?: string;
  series: MovieTitle;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(series.name ?? "");
  const [description, setDescription] = useState(series.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(series.name ?? "");
    setDescription(series.description ?? "");
  }, [series.id]);

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const isEdit = !!series.id;
      const endpoint = isEdit ? `/api/admin/titles/${series.id}` : "/api/admin/titles";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: title.trim(),
          description: description.trim(),
          type: "SERIES",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Save failed");
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="bg-neutral-800 border-neutral-700">
        <TabsTrigger value="basic" className="data-[state=active]:bg-[#fd7e14] data-[state=active]:text-white">
          Basic Info
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 mt-4">
        <div>
          <Label className="text-neutral-300">Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 bg-neutral-950 border-neutral-800 text-white"
            placeholder="Enter series title"
          />
        </div>
        <div>
          <Label className="text-neutral-300">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 bg-neutral-950 border-neutral-800 text-white"
            rows={4}
            placeholder="Enter series description"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-neutral-800 pt-4">
          <Button variant="outline" onClick={onClose} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
            Cancel
          </Button>
          <Button disabled={saving} onClick={handleSave} className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
            {saving ? "Saving..." : "Save Series"}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
