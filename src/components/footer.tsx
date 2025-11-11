import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer id="contact" className="py-16 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="text-2xl font-bold mb-6">Compazit</div>
          </div>

          <div>
            <h3 className="font-bold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><button onClick={() => navigate("/product/2d-art")} className="text-left text-muted-foreground hover:text-primary transition-colors">2D Art</button></li>
              <li><button onClick={() => navigate("/product/3d-model")} className="text-left text-muted-foreground hover:text-primary transition-colors">3D Model</button></li>
              <li><button onClick={() => navigate("/pricing")} className="text-left text-muted-foreground hover:text-primary transition-colors">Pricing</button></li>
              <li><button onClick={() => navigate("/product/api")} className="text-left text-muted-foreground hover:text-primary transition-colors">API</button></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">About</h3>
            <ul className="space-y-2">
              <li><button onClick={() => navigate("/about/our-story")} className="text-left text-muted-foreground hover:text-primary transition-colors">Our Story</button></li>
              <li><button onClick={() => navigate("/about/blog")} className="text-left text-muted-foreground hover:text-primary transition-colors">Blog</button></li>
              <li><button onClick={() => navigate("/about/team")} className="text-left text-muted-foreground hover:text-primary transition-colors">Team</button></li>
              <li><button onClick={() => navigate("/about/careers")} className="text-left text-muted-foreground hover:text-primary transition-colors">Careers</button></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Help</h3>
            <ul className="space-y-2">
              <li><button onClick={() => navigate("/help/faqs")} className="text-left text-muted-foreground hover:text-primary transition-colors">FAQs</button></li>
              <li><button onClick={() => navigate("/help/contact")} className="text-left text-muted-foreground hover:text-primary transition-colors">Contact Us</button></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-muted-foreground">
          <p>© 3DGENI. All rights reserved</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
