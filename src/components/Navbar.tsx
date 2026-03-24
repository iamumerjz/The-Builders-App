import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Hammer, Menu, X, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isLabourer = profile?.is_labourer ?? false;

  const links = [
    { label: "Home", to: "/" },
    { label: "Browse Pros", to: "/browse" },
    { label: "How It Works", to: "/#how-it-works" },
    ...(user && !isLabourer ? [{ label: "Dashboard", to: "/dashboard" }] : []),
    ...(user && isLabourer ? [{ label: "Pro Panel", to: "/pro-panel" }] : []),
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-20 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <Hammer className="w-8 h-8 text-primary" />
            <span className="font-heading font-bold text-2xl text-foreground">
              The <span className="text-primary">Builders</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link key={l.label} to={l.to} className="text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Button variant="outline" size="lg" className="border-border text-foreground hover:border-primary hover:text-primary text-base px-6" onClick={() => navigate(isLabourer ? "/pro-profile" : "/profile")}>
                  <User className="w-4 h-4 mr-2" /> Profile
                </Button>
                <Button size="lg" variant="outline" className="border-border text-muted-foreground hover:border-destructive hover:text-destructive text-base px-4" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-base px-6" onClick={() => navigate("/signin")}>
                  Sign In
                </Button>
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-6" onClick={() => navigate("/signup")}>
                  Join as a Pro
                </Button>
              </>
            )}
          </div>

          <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
            {open ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/90 z-[60] md:hidden" onClick={() => setOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }} className="fixed inset-y-0 right-0 w-72 bg-card border-l border-border z-[70] p-6 flex flex-col gap-4 md:hidden shadow-2xl">
              <button className="self-end text-foreground mb-4" onClick={() => setOpen(false)}>
                <X className="w-6 h-6" />
              </button>
              {links.map((l) => (
                <Link key={l.label} to={l.to} onClick={() => setOpen(false)} className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-border">
                  {l.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link to={isLabourer ? "/pro-profile" : "/profile"} onClick={() => setOpen(false)} className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-border">Profile</Link>
                  <Button variant="outline" className="mt-2 border-destructive text-destructive w-full" onClick={() => { setOpen(false); handleSignOut(); }}>
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 w-full" onClick={() => { setOpen(false); navigate("/signin"); }}>
                    Sign In
                  </Button>
                  <Button variant="outline" className="border-primary text-primary w-full" onClick={() => { setOpen(false); navigate("/signup"); }}>
                    Join as a Pro
                  </Button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;