import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/index";
import NotFound from "./pages/notfound";
import MagicMaker from "./pages/magicmaker";
import LoginPage from "./pages/login";
import PricingPage from "./pages/pricing";
import Product2D from "./pages/product-2d";
import Product3D from "./pages/product-3d";
import ProductAPI from "./pages/product-api";
import OurStory from "./pages/about-story";
import BlogPage from "./pages/about-blog";
import TeamPage from "./pages/about-team";
import CareersPage from "./pages/about-careers";
import FAQsPage from "./pages/help-faqs";
import ContactPage from "./pages/help-contact";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/product/2d-art" element={<Product2D />} />
      <Route path="/product/3d-model" element={<Product3D />} />
      <Route path="/product/api" element={<ProductAPI />} />
      <Route path="/about/our-story" element={<OurStory />} />
      <Route path="/about/blog" element={<BlogPage />} />
      <Route path="/about/team" element={<TeamPage />} />
      <Route path="/about/careers" element={<CareersPage />} />
      <Route path="/help/faqs" element={<FAQsPage />} />
      <Route path="/help/contact" element={<ContactPage />} />
      <Route path="/magic-maker" element={<MagicMaker />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
