import { Star, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Professional } from "@/lib/mockData";
import { Button } from "@/components/ui/button";

interface ProCardProps {
  pro: Professional;
  index?: number;
}

const ProCard = ({ pro, index = 0 }: ProCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="card-hover rounded-lg bg-card border border-border p-5 relative group"
    >
      {pro.topRated && (
        <span className="absolute top-3 right-3 text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
          Top Rated
        </span>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <img src={pro.avatar} alt={pro.name} className="w-14 h-14 rounded-full object-cover border-2 border-border" />
          <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-card ${pro.available ? "bg-success" : "bg-destructive"}`} />
        </div>
        <div>
          <h3 className="font-heading font-bold text-foreground">{pro.name}</h3>
          <span className="text-xs font-semibold uppercase tracking-wider bg-primary/15 text-primary px-2 py-0.5 rounded-full">
            {pro.profession}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-primary text-primary" />
          <span className="text-foreground font-semibold">{pro.rating || "New"}</span>
          {pro.reviewCount > 0 && <span>({pro.reviewCount})</span>}
        </span>
        {pro.city && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {pro.city}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-lg font-bold text-foreground">
          PKR {pro.hourlyRate}<span className="text-sm font-normal text-muted-foreground">/hr</span>
        </span>
        <button className="text-xs text-primary hover:underline font-medium">Negotiate</button>
      </div>

      {pro.availability.length > 0 && (
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {pro.availability.map((a) => (
            <span key={a} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">{a}</span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 border-border text-foreground hover:border-primary hover:text-primary" onClick={() => navigate(`/pro/${pro.id}`)}>
          View Profile
        </Button>
        <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary-dark" onClick={() => navigate(`/book/${pro.id}`)}>
          Book Now
        </Button>
      </div>
    </motion.div>
  );
};

export default ProCard;
