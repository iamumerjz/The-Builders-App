import { Hammer, Facebook, Twitter, Instagram, Linkedin, Github } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="yellow-line-top bg-secondary">
    <div className="container mx-auto py-16 md:py-20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Hammer className="w-7 h-7 text-primary" />
            <span className="font-heading font-bold text-xl text-foreground">
              The <span className="text-primary">Builders</span>
            </span>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed">
            Connecting homeowners with verified, skilled service professionals.
          </p>
        </div>

        {[
          { title: "Company", links: [["About", "/"], ["How It Works", "/"], ["Safety", "/"], ["Blog", "/"]] },
          { title: "Support", links: [["Help Center", "/"], ["Contact Us", "/"], ["Terms", "/"], ["Privacy", "/"]] },
          { title: "For Pros", links: [["Join as Pro", "/"], ["Pro Resources", "/"], ["Success Stories", "/"]] },
        ].map((section) => (
          <div key={section.title}>
            <h4 className="font-heading font-bold text-base uppercase tracking-wider text-foreground mb-5">
              {section.title}
            </h4>
            <ul className="space-y-3">
              {section.links.map(([label, url]) => (
                <li key={label}>
                  <Link to={url} className="text-base text-muted-foreground hover:text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between mt-14 pt-8 border-t border-border">
        <p className="text-sm text-muted-foreground">
          © 2026 The Builders. All rights reserved. Built by{" "}
          <a href="https://linkedin.com/in/iamumerjz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Umer Ijaz</a>
        </p>
        <div className="flex gap-5 mt-4 md:mt-0">
          <a href="https://linkedin.com/in/iamumerjz" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            <Linkedin className="w-6 h-6" />
          </a>
          <a href="https://github.com/iamumerjz" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            <Github className="w-6 h-6" />
          </a>
          {[Twitter, Instagram].map((Icon, i) => (
            <a key={i} href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Icon className="w-6 h-6" />
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;