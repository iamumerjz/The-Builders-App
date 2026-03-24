import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, Phone, CheckCircle, ImagePlus, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProJobCardProps {
  booking: any;
  clientProfile: any;
  workPhotos: any[];
  onUpdate: () => void;
}

const ProJobCard = ({ booking, clientProfile, workPhotos, onUpdate }: ProJobCardProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isPending = booking.status === "upcoming";
  const isAccepted = booking.status === "accepted" || booking.status === "confirmed";
  const isCompleted = booking.status === "completed";
  const isRejected = booking.status === "rejected";
  const showClientInfo = isAccepted || isCompleted;

  const handleAccept = async () => {
    await supabase.from("bookings").update({ status: "accepted" } as any).eq("id", booking.id);
    toast({ title: "Job accepted", description: "Client details are now visible. Good luck!" });
    onUpdate();
  };

  const handleReject = async () => {
    await supabase.from("bookings").update({ status: "rejected" } as any).eq("id", booking.id);
    toast({ title: "Job declined", description: "The client will be notified." });
    onUpdate();
  };

  const handleUploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 5 * 1024 * 1024) { toast({ title: "File too large", description: `${file.name} exceeds 5MB limit.`, variant: "destructive" }); continue; }

      const ext = file.name.split(".").pop();
      const path = `${userId}/${booking.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("work-photos").upload(path, file);
      if (uploadError) { toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" }); continue; }

      const { data: { publicUrl } } = supabase.storage.from("work-photos").getPublicUrl(path);

      await supabase.from("work_photos").insert({
        booking_id: booking.id,
        uploaded_by: userId,
        photo_url: publicUrl,
      } as any);
    }

    setUploading(false);
    toast({ title: "Photos uploaded", description: "Work photos have been saved." });
    onUpdate();
  };

  const handleMarkComplete = async () => {
    await supabase.from("bookings").update({ status: "completed" } as any).eq("id", booking.id);
    toast({ title: "Job marked complete", description: "The client can now leave a review." });
    onUpdate();
  };

  const statusLabel = isPending ? "Pending" : isAccepted ? "Accepted" : isCompleted ? "Completed" : isRejected ? "Declined" : booking.status;
  const statusStyle = isCompleted ? "bg-success/15 text-success" : isPending ? "bg-warning/15 text-warning" : isAccepted ? "bg-primary/15 text-primary" : isRejected ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
          {(clientProfile?.full_name || "C")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-foreground text-sm">{clientProfile?.full_name || "Client"}</h3>
          <p className="text-xs text-muted-foreground">{booking.service}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(booking.booking_date).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.time_slot}</span>
          </div>
        </div>
        <div className="text-right flex items-center gap-2">
          <div>
            <p className="font-bold text-foreground text-sm">PKR {booking.rate}/hr</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyle}`}>
              {statusLabel}
            </span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-border overflow-hidden">

            {/* Accept / Reject for pending bookings */}
            {isPending && (
              <div className="p-4 bg-warning/5 space-y-3">
                <p className="text-sm text-foreground font-medium">New job request — accept or decline?</p>
                <div className="flex gap-2">
                  <Button onClick={handleAccept} className="flex-1 bg-success text-success-foreground hover:bg-success/90">
                    <ThumbsUp className="w-4 h-4 mr-1.5" /> Accept
                  </Button>
                  <Button onClick={handleReject} variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/10">
                    <ThumbsDown className="w-4 h-4 mr-1.5" /> Decline
                  </Button>
                </div>
              </div>
            )}

            {showClientInfo && (
              <div className="p-4 bg-secondary/30 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Client Details</p>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span>{clientProfile?.phone || "Not provided"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>{clientProfile?.address || "Not provided"}{clientProfile?.city ? `, ${clientProfile.city}` : ""}</span>
                </div>
              </div>
            )}

            {/* Work Photos */}
            {workPhotos.length > 0 && (
              <div className="p-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Work Photos</p>
                <div className="grid grid-cols-3 gap-2">
                  {workPhotos.map((wp: any) => (
                    <img key={wp.id} src={wp.photo_url} alt="Work" className="w-full h-20 object-cover rounded-lg border border-border" />
                  ))}
                </div>
              </div>
            )}

            {/* Actions — only for accepted jobs */}
            {isAccepted && (
              <div className="p-4 border-t border-border flex flex-wrap gap-2">
                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:border-primary transition-colors cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                  {uploading ? <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <ImagePlus className="w-4 h-4 text-primary" />}
                  Upload Photos
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleUploadPhotos} disabled={uploading} />
                </label>
                <Button onClick={handleMarkComplete} className="bg-success text-success-foreground hover:bg-success/90">
                  <CheckCircle className="w-4 h-4 mr-1" /> Mark Complete
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProJobCard;
