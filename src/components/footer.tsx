<<<<<<< HEAD
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer id="contact" className="py-16 border-t border-border">
=======
const Footer = () => {
  return (
    <footer className="py-16 border-t border-border">
>>>>>>> 8fbf66df8942473647be6535d2d82aec5565e4dd
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="text-2xl font-bold mb-6">Compazit</div>
          </div>

          <div>
            <h3 className="font-bold mb-4">Product</h3>
            <ul className="space-y-2">
<<<<<<< HEAD
              <li><button onClick={() => navigate("/product/2d-art")} className="text-left text-muted-foreground hover:text-primary transition-colors">2D Art</button></li>
              <li><button onClick={() => navigate("/product/3d-model")} className="text-left text-muted-foreground hover:text-primary transition-colors">3D Model</button></li>
              <li><button onClick={() => navigate("/pricing")} className="text-left text-muted-foreground hover:text-primary transition-colors">Pricing</button></li>
              <li><button onClick={() => navigate("/product/api")} className="text-left text-muted-foreground hover:text-primary transition-colors">API</button></li>
=======
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">2d Art</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">3D Model</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">API</a></li>
>>>>>>> 8fbf66df8942473647be6535d2d82aec5565e4dd
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">About</h3>
            <ul className="space-y-2">
<<<<<<< HEAD
              <li><button onClick={() => navigate("/about/our-story")} className="text-left text-muted-foreground hover:text-primary transition-colors">Our Story</button></li>
              <li><button onClick={() => navigate("/about/blog")} className="text-left text-muted-foreground hover:text-primary transition-colors">Blog</button></li>
              <li><button onClick={() => navigate("/about/team")} className="text-left text-muted-foreground hover:text-primary transition-colors">Team</button></li>
              <li><button onClick={() => navigate("/about/careers")} className="text-left text-muted-foreground hover:text-primary transition-colors">Careers</button></li>
=======
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Our Story</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Team</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Careers</a></li>
>>>>>>> 8fbf66df8942473647be6535d2d82aec5565e4dd
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Help</h3>
            <ul className="space-y-2">
<<<<<<< HEAD
              <li><button onClick={() => navigate("/help/faqs")} className="text-left text-muted-foreground hover:text-primary transition-colors">FAQs</button></li>
              <li><button onClick={() => navigate("/help/contact")} className="text-left text-muted-foreground hover:text-primary transition-colors">Contact Us</button></li>
=======
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">FAQs</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact Us</a></li>
>>>>>>> 8fbf66df8942473647be6535d2d82aec5565e4dd
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-muted-foreground">
          <p>© AI Fordge. All rights reserved</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
