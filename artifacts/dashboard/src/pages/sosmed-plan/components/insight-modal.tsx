import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInsight, updateInsight, SosmedInsight, SosmedContent } from "@/lib/sosmed-api";
import { Eye, ThumbsUp, MessageCircle, Share2, Bookmark, UserPlus, Users, Activity } from "lucide-react";

interface InsightModalProps {
  content: SosmedContent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InsightModal({ content, open, onOpenChange }: InsightModalProps) {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<SosmedInsight>({
    content_id: "",
    reach: 0,
    impressions: 0,
    likes: 0,
    comments_count: 0,
    shares: 0,
    saves: 0,
    profile_visits: 0,
    followers_gained: 0,
  });

  useEffect(() => {
    if (open && content) {
      setLoading(true);
      getInsight(content.id)
        .then((data) => {
          setInsight(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, content]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInsight(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handleSave = async () => {
    if (!content) return;
    setLoading(true);
    try {
      await updateInsight(content.id, insight);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      alert("Failed to save insight");
    } finally {
      setLoading(false);
    }
  };

  if (!content) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Insight: {content.title}</DialogTitle>
        </DialogHeader>
        
        {loading && insight.content_id === "" ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500"/> Reach</Label>
              <Input type="number" name="reach" value={insight.reach || 0} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Eye className="w-4 h-4 text-purple-500"/> Impressions</Label>
              <Input type="number" name="impressions" value={insight.impressions || 0} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><ThumbsUp className="w-4 h-4 text-rose-500"/> Likes</Label>
              <Input type="number" name="likes" value={insight.likes || 0} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-amber-500"/> Comments</Label>
              <Input type="number" name="comments_count" value={insight.comments_count || 0} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Share2 className="w-4 h-4 text-green-500"/> Shares</Label>
              <Input type="number" name="shares" value={insight.shares || 0} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Bookmark className="w-4 h-4 text-orange-500"/> Saves</Label>
              <Input type="number" name="saves" value={insight.saves || 0} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Users className="w-4 h-4 text-indigo-500"/> Profile Visits</Label>
              <Input type="number" name="profile_visits" value={insight.profile_visits || 0} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><UserPlus className="w-4 h-4 text-teal-500"/> Followers Gained</Label>
              <Input type="number" name="followers_gained" value={insight.followers_gained || 0} onChange={handleChange} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
