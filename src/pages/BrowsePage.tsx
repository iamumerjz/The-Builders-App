import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProCard from "@/components/ProCard";
import { SkeletonCard } from "@/components/Skeletons";
import { categories } from "@/lib/mockData";
import { iconMap } from "@/lib/icons";
import { useToast } from "@/hooks/use-toast";
import { fetchProfessionals } from "@/lib/api";
import type { Professional } from "@/lib/mockData";

const BrowsePage = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const s = searchParams.get("service");
    return s ? [s] : [];
  });
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [sortBy, setSortBy] = useState("rating");

  useEffect(() => {
    fetchProfessionals().then((data) => {
      setProfessionals(data);
      setLoading(false);
    });
  }, []);

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const filtered = useMemo(() => {
    let list = professionals.filter((p) => {
      if (selectedCategories.length && !selectedCategories.includes(p.profession)) return false;
      if (p.rating < minRating) return false;
      if (p.hourlyRate < priceRange[0] || p.hourlyRate > priceRange[1]) return false;
      return true;
    });
    if (sortBy === "rating") list.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "price-low") list.sort((a, b) => a.hourlyRate - b.hourlyRate);
    else if (sortBy === "price-high") list.sort((a, b) => b.hourlyRate - a.hourlyRate);
    return list;
  }, [professionals, selectedCategories, minRating, priceRange, sortBy]);

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-foreground mb-3">Service Type</h3>
        <div className="space-y-2">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon];
            return (
              <label key={cat.name} className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Checkbox checked={selectedCategories.includes(cat.name)} onCheckedChange={() => toggleCategory(cat.name)} className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                {Icon && <Icon className="w-4 h-4" />}
                {cat.name}
              </label>
            );
          })}
        </div>
      </div>
      <div>
        <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-foreground mb-3">Min Rating: {minRating}★</h3>
        <Slider value={[minRating]} min={0} max={5} step={0.5} onValueChange={(v) => setMinRating(v[0])} className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary" />
      </div>
      <div>
        <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-foreground mb-3">Price: PKR {priceRange[0]} – PKR {priceRange[1]}/hr</h3>
        <Slider value={priceRange} min={0} max={10000} step={100} onValueChange={setPriceRange} className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary" />
      </div>
      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary-dark" onClick={() => { setMobileFilters(false); toast({ title: "Filters Applied", description: `Showing ${filtered.length} professionals` }); }}>
        Apply Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-foreground">Browse <span className="text-primary">Professionals</span></h1>
          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 bg-card border-border text-foreground"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="rating">Sort by Rating</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="md:hidden border-border text-foreground" onClick={() => setMobileFilters(true)}>
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-8">
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-card border border-border rounded-lg p-5"><FilterPanel /></div>
          </aside>
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">No professionals found. {professionals.length === 0 ? "Be the first to join as a Pro!" : "Try adjusting your filters."}</p>
                {professionals.length > 0 && (
                  <Button variant="outline" className="mt-4 border-primary text-primary" onClick={() => { setSelectedCategories([]); setMinRating(0); setPriceRange([0, 10000]); toast({ title: "Filters Reset", description: "Showing all professionals" }); }}>
                    Reset Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((pro, i) => <ProCard key={pro.id} pro={pro} index={i} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileFilters && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background z-40" onClick={() => setMobileFilters(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }} className="fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl p-6 z-50 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading font-bold text-lg text-foreground">Filters</h3>
                <button onClick={() => setMobileFilters(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <FilterPanel />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
};

export default BrowsePage;
