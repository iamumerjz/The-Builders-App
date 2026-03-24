import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, Star, CheckCircle, Users, MessageSquare, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProCard from "@/components/ProCard";
import { categories, testimonials } from "@/lib/mockData";
import { fetchProfessionals } from "@/lib/api";
import { iconMap } from "@/lib/icons";
import heroBg from "@/assets/hero-bg.jpg";
import type { Professional } from "@/lib/mockData";
import { useRef } from "react";

const StatBadge = ({ icon: Icon, value, label }: { icon: React.ElementType; value: string; label: string }) => (
  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.8 }}
    className="flex items-center gap-3 bg-card/80 backdrop-blur border border-border rounded-xl px-6 py-4">
    <Icon className="w-7 h-7 text-primary" />
    <div>
      <p className="font-heading font-bold text-foreground text-lg md:text-xl">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  </motion.div>
);

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchService, setSearchService] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [proCount, setProCount] = useState(0);

  useEffect(() => {
    fetchProfessionals().then((data) => {
      setProfessionals(data);
      setProCount(data.length);
    });
  }, []);

  const scrollCategories = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === "left" ? -300 : 300, behavior: "smooth" });
    }
  };

  const handleSearch = () => {
    if (!searchService.trim() && !searchLocation.trim()) {
      toast({ title: "Enter a search", description: "Please enter a service or location to search.", variant: "destructive" });
      return;
    }
    toast({ title: "Searching...", description: `Finding ${searchService || "all services"} in ${searchLocation || "all locations"}` });
    navigate(`/browse?service=${searchService}&location=${searchLocation}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        <div className="absolute inset-0"><img src={heroBg} alt="" className="w-full h-full object-cover" /></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background" />
        <div className="container mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading font-black text-4xl md:text-6xl lg:text-7xl text-foreground leading-tight mb-6">
              Build Your Dream. <span className="text-gradient-yellow">Hire the Best.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto">Connect with verified carpenters, plumbers, electricians & more — on your schedule.</p>

            <div className="flex flex-col md:flex-row gap-3 max-w-2xl mx-auto bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 flex-1 bg-muted rounded-md px-3 transition-shadow duration-300 focus-within:shadow-[0_0_12px_hsl(var(--primary)/0.5)] focus-within:border focus-within:border-primary/40">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input placeholder="What service do you need?" value={searchService} onChange={(e) => setSearchService(e.target.value)} className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2 flex-1 bg-muted rounded-md px-3 transition-shadow duration-300 focus-within:shadow-[0_0_12px_hsl(var(--primary)/0.5)] focus-within:border focus-within:border-primary/40">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <Input placeholder="Your location" value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground" />
              </div>
              <Button onClick={handleSearch} className="bg-primary text-primary-foreground hover:bg-primary-dark glow-yellow-sm px-8">Search</Button>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-10">
              <StatBadge icon={Users} value={proCount > 0 ? `${proCount}+` : "Join Now"} label="Verified Pros" />
              <StatBadge icon={Star} value="98%" label="Satisfaction" />
              <StatBadge icon={CheckCircle} value="10K+" label="Jobs Done" />
            </div>
          </motion.div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 md:py-32 bg-secondary">
        <div className="container mx-auto">
          <h2 className="font-heading font-bold text-3xl md:text-5xl text-center text-foreground mb-5">How It <span className="text-primary">Works</span></h2>
          <p className="text-center text-muted-foreground mb-16 max-w-lg mx-auto text-base md:text-lg">Three simple steps to get your project started</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto relative">
            <div className="hidden md:block absolute top-20 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
            {[
              { icon: Search, title: "Search & Filter", desc: "Browse verified professionals by skill, rating, and availability." },
              { icon: MessageSquare, title: "Bargain & Book", desc: "Negotiate rates directly and book a time that works for you." },
              { icon: CheckCircle, title: "Job Done", desc: "Get quality work, leave a review, and build trust." },
            ].map((step, i) => (
              <motion.div key={step.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-center relative z-10">
                <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center"><step.icon className="w-9 h-9 text-primary" /></div>
                <h3 className="font-heading font-bold text-xl md:text-2xl text-foreground mb-3">{step.title}</h3>
                <p className="text-base text-muted-foreground max-w-xs mx-auto">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="container mx-auto">
          <h2 className="font-heading font-bold text-3xl md:text-5xl text-center text-foreground mb-14">Service <span className="text-primary">Categories</span></h2>
          <div className="relative">
            <button onClick={() => scrollCategories("left")} className="absolute -left-3 md:-left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all shadow-lg"><ChevronLeft className="w-6 h-6" /></button>
            <div ref={scrollRef} className="flex gap-5 overflow-x-auto overflow-y-hidden py-4 scrollbar-none px-8">
              {categories.map((cat) => {
                const Icon = iconMap[cat.icon];
                return (
                  <motion.button key={cat.name} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} onClick={() => navigate(`/browse?service=${cat.name}`)}
                    className="flex-shrink-0 flex flex-col items-center gap-4 p-8 rounded-xl bg-card border border-border hover:border-primary hover:glow-yellow-sm transition-colors min-w-[140px] cursor-pointer">
                    {Icon && <Icon className="w-10 h-10 text-primary" />}
                    <span className="text-sm font-semibold uppercase tracking-wider text-foreground">{cat.name}</span>
                  </motion.button>
                );
              })}
            </div>
            <button onClick={() => scrollCategories("right")} className="absolute -right-3 md:-right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all shadow-lg"><ChevronRight className="w-6 h-6" /></button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary">
        <div className="container mx-auto">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-center text-foreground mb-12">Featured <span className="text-primary">Professionals</span></h2>
          {professionals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {professionals.slice(0, 6).map((pro, i) => <ProCard key={pro.id} pro={pro} index={i} />)}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">No professionals yet. Be the first to join!</p>
          )}
          <div className="text-center mt-10">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => navigate("/browse")}>View All Professionals</Button>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-center text-foreground mb-12">What Our <span className="text-primary">Clients Say</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-lg p-6 relative">
                <Quote className="w-8 h-8 text-primary/30 absolute top-4 right-4" />
                <div className="flex mb-3">{Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 fill-primary text-primary" />)}</div>
                <p className="text-sm text-muted-foreground mb-4 italic">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.author}</p>
                  <p className="text-xs text-primary uppercase tracking-wider">{t.jobType}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 blueprint-grid relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10" />
        <div className="container mx-auto text-center relative z-10">
          <h2 className="font-heading font-bold text-3xl md:text-5xl text-foreground mb-5">Ready to Build?</h2>
          <p className="text-muted-foreground mb-10 max-w-lg mx-auto text-base md:text-lg">Join thousands of homeowners who've found their perfect builder.</p>
          <div className="flex gap-5 justify-center">
            <Button className="bg-primary text-primary-foreground hover:bg-primary-dark glow-yellow px-10 py-7 text-lg" onClick={() => navigate("/browse")}>Find a Builder</Button>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-10 py-7 text-lg" onClick={() => navigate("/signup")}>Join as a Pro</Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
