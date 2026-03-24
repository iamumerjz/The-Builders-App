import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ImagePlus, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  booking: any;
  userId: string;
  onSubmitted: () => void;
}

const ReviewModal = ({ open, onClose, booking, userId, onSubmitted }: ReviewModalProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024);
    if (validFiles.length < files.length) {
      toast({ title: "Some files skipped", description: "Only images under 5MB are allowed." });
    }
    setPhotos(prev => [...prev, ...validFiles]);
    validFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating < 1) { toast({ title: "Please select a rating", variant: "destructive" }); return; }
    setSubmitting(true);

    // Create review
    const { data: review, error } = await supabase.from("reviews").insert({
      client_id: userId,
      pro_id: booking.pro_id,
      booking_id: booking.id,
      rating,
      text: text.trim(),
      job_type: booking.service,
    } as any).select().single();

    if (error || !review) {
      toast({ title: "Error", description: "Failed to submit review.", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Upload photos
    for (const file of photos) {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${(review as any).id}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("work-photos").upload(path, file);
      if (uploadErr) continue;

      const { data: { publicUrl } } = supabase.storage.from("work-photos").getPublicUrl(path);
      await supabase.from("review_photos").insert({
        review_id: (review as any).id,
        photo_url: publicUrl,
      } as any);
    }

    setSubmitting(false);
    toast({ title: "Review submitted", description: "Thank you for your feedback!" });
    onSubmitted();
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card border border-border rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-lg text-foreground">Leave a Review</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Booking info */}
            <div className="bg-secondary/30 rounded-lg p-3 mb-5">
              <p className="text-sm text-foreground font-medium">{booking.pro_profiles?.full_name || "Pro"}</p>
              <p className="text-xs text-muted-foreground">{booking.service} — {new Date(booking.booking_date).toLocaleDateString()}</p>
            </div>

            {/* Star rating */}
            <div className="mb-5">
              <p className="text-sm font-medium text-foreground mb-2">Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110 active:scale-95">
                    <Star className={`w-8 h-8 ${(hoverRating || rating) >= star ? "fill-primary text-primary" : "text-muted-foreground/30"} transition-colors`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Text */}
            <div className="mb-5">
              <p className="text-sm font-medium text-foreground mb-2">Your Review</p>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="How was your experience?"
                rows={4}
                className="resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">{text.length}/500</p>
            </div>

            {/* Photos */}
            <div className="mb-6">
              <p className="text-sm font-medium text-foreground mb-2">Photos (optional)</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20">
                    <img src={src} alt="" className="w-full h-full object-cover rounded-lg border border-border" />
                    <button onClick={() => removePhoto(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <ImagePlus className="w-5 h-5 text-muted-foreground" />
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} />
                </label>
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Submitting…
                </span>
              ) : (
                <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Submit Review</span>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReviewModal;
