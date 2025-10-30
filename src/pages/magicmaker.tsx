import ModelViewer3D from "@/components/ModelViewer3D";
import { Upload, LogIn, Twitter, Instagram, Facebook, ShoppingBag, Trash } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const MagicMaker = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("auth_user") || "null"); } catch { return null; }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate(`/login?redirect=/magic-maker`, { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="text-3xl sm:text-4xl font-black tracking-[0.25em] italic">
            <span className="bg-gradient-to-r from-fuchsia-300 via-white to-sky-300 bg-clip-text text-transparent drop-shadow-lg">AI-FORGE</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Profile avatar styled like a logo */}
            <div
              className="p-[2px] rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-400 to-sky-400"
              title={user?.name || "Profile"}
            >
              <div className="h-10 w-10 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-extrabold tracking-wide">
                {(user?.name || "U").slice(0,1).toUpperCase()}
              </div>
            </div>
            {/* replace Sign In with Logout since page is protected */}
            <button
              className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 px-4 py-2 text-sm border border-white/10 transition-colors"
              onClick={() => {
                localStorage.removeItem("auth_token");
                localStorage.removeItem("auth_user");
                window.location.href = "/";
              }}
            >
              <LogIn className="h-4 w-4" />
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
            Transform your child's imagination into 3D magic!
          </h1>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Left: Upload card */}
            <div className="rounded-xl bg-white/[0.06] border border-white/10 p-4 sm:p-6">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-yellow-200 via-orange-200 to-sky-200 flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Upload preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-black/60 text-sm">Upload preview</div>
                )}
                {previewUrl && (
                  <button
                    className="absolute top-3 right-3 inline-flex items-center justify-center h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 text-white"
                    onClick={() => {
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }}
                    aria-label="Remove uploaded image"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                )}
                {/* Upload trigger inside the card */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(url);
                    }
                  }}
                />
                <button
                  className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-white text-[#0f172a] hover:bg-white/90 px-4 py-2 text-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </button>
              </div>
              <div className="mt-4">
                <div className="font-medium">Upload any picture</div>
                <div className="text-sm text-white/70">Select from your device</div>
              </div>
            </div>

            {/* Right: Cartoon style card */}
            <div className="rounded-xl bg-white/[0.06] border border-white/10 p-4 sm:p-6">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-[#111827] flex items-center justify-center">
                {modelUrl ? (
                  <img src={modelUrl} alt="Selected model" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-white/70 text-sm">Cartoon model preview</div>
                )}
                {modelUrl && (
                  <button
                    className="absolute top-3 right-3 inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    onClick={() => setModelUrl(null)}
                    aria-label="Remove selected model"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                )}
                {/* Basket (model picker) */}
                <button
                  className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-white text-[#0f172a] hover:bg-white/90 px-4 py-2 text-sm"
                  onClick={() => setPickerOpen(true)}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Choose Model
                </button>
              </div>
              <div className="mt-4">
                <div className="font-medium">Choose a fun cartoon style</div>
                <div className="text-sm text-white/70">Pick a style that suits your child's personality</div>
              </div>
            </div>
          </div>

          {/* Model Picker Modal */}
          {pickerOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-4xl bg-[#0b1222] text-white rounded-2xl border border-white/10 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Pick a 3D model</h3>
                  <button className="text-white/70 hover:text-white" onClick={() => setPickerOpen(false)}>Close</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 max-h-[60vh] overflow-auto">
                  {[
                    "/src/gallery 3d models/character-knight.png",
                    "/src/gallery 3d models/character-superhero.png",
                    "/src/gallery 3d models/character-fairy.png",
                    "/src/gallery 3d models/character-astronaut.png",
                    "/src/gallery 3d models/one_piece_blue.jpeg",
                    "/src/gallery 3d models/bossbaby-blue.jpeg",
                    "/src/gallery 3d models/moana_blue.jpeg",
                    "/src/gallery 3d models/snowwhite_blue.jpeg",
                  ].map((src) => (
                    <button
                      key={src}
                      className="relative rounded-xl overflow-hidden border border-white/10 hover:border-white/30 focus:outline-none"
                      onClick={() => {
                        setModelUrl(src);
                        setPickerOpen(false);
                      }}
                    >
                      <img src={src} alt="model" className="w-full h-40 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <button className="w-full sm:w-auto rounded-full bg-yellow-400 hover:bg-yellow-300 text-black font-medium px-6 py-3 transition-colors">
              Create 3D Model
            </button>
            <button className="w-full sm:w-auto rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium px-6 py-3 transition-colors">
              Customize Colors & Accessories
            </button>
          </div>

          {/* Large 3D preview */}
          <div className="rounded-xl bg-white/[0.06] border border-white/10 p-2 sm:p-4">
            <div className="aspect-[16/10] rounded-lg overflow-hidden bg-black/60">
              <ModelViewer3D />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto w-full py-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/70">
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
            <a href="#" className="hover:text-white">Contact Us</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white" aria-label="Twitter"><Twitter className="h-5 w-5" /></a>
            <a href="#" className="hover:text-white" aria-label="Instagram"><Instagram className="h-5 w-5" /></a>
            <a href="#" className="hover:text-white" aria-label="Facebook"><Facebook className="h-5 w-5" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MagicMaker;


