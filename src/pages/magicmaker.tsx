import ModelViewer3D from "@/components/ModelViewer3D";
<<<<<<< HEAD
import { Upload, ArrowLeft, Twitter, Instagram, Facebook, ShoppingBag, Trash, Sparkles, Palette } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaMale, FaFemale } from "react-icons/fa";

type ColorPart = "hair" | "outfit" | "skin" | "shoes";

const colorConfig: Record<ColorPart, { label: string; colors: string[] }> = {
  hair: {
    label: "Hair",
    colors: ["#F97316", "#0F172A", "#FDE68A", "#EF4444", "#A855F7"],
  },
  outfit: {
    label: "Outfit",
    colors: ["#F59E0B", "#3B82F6", "#10B981", "#F472B6", "#94A3B8"],
  },
  skin: {
    label: "Skin Tone",
    colors: ["#FCD3B6", "#F2B59F", "#EAB676", "#C58C5C", "#8D5524"],
  },
  shoes: {
    label: "Shoes",
    colors: ["#111827", "#F9FAFB", "#2563EB", "#22D3EE", "#F97316"],
  },
};

interface AccessoryOption {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

const accessoryOptions: AccessoryOption[] = [
  { id: "ball", label: "Sports Ball", emoji: "🏀", description: "Great for sporty heroes" },
  { id: "car", label: "Toy Car", emoji: "🚗", description: "Adds a speedy friend" },
  { id: "snake", label: "Friendly Snake", emoji: "🐍", description: "Perfect for explorers" },
  { id: "wand", label: "Magic Wand", emoji: "✨", description: "For wizards & fairies" },
  { id: "book", label: "Story Book", emoji: "📚", description: "Ideal for storytellers" },
  { id: "shield", label: "Hero Shield", emoji: "🛡️", description: "For brave protectors" },
];

const colorPartsOrder: ColorPart[] = ["hair", "outfit", "skin", "shoes"];
=======
import { Upload, LogIn, Twitter, Instagram, Facebook, ShoppingBag, Trash } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
>>>>>>> 8fbf66df8942473647be6535d2d82aec5565e4dd

const MagicMaker = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
<<<<<<< HEAD
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  type ModelItem = { src: string; name: string };
  const [model, setModel] = useState<ModelItem | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showCharModal, setShowCharModal] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropScale, setCropScale] = useState(1.0);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{x:number;y:number}|null>(null);
  const cropContainerRef = useRef<HTMLDivElement | null>(null);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; size: number }>({ x: 150, y: 150, size: 300 });
  const [cropDragMode, setCropDragMode] = useState<null | "move" | "nw" | "ne" | "sw" | "se">(null);
  const [dragStartPt, setDragStartPt] = useState<{ x: number; y: number } | null>(null);
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [selectedColors, setSelectedColors] = useState<Record<ColorPart, string>>({
    hair: colorConfig.hair.colors[0],
    outfit: colorConfig.outfit.colors[0],
    skin: colorConfig.skin.colors[0],
    shoes: colorConfig.shoes.colors[0],
  });
  const [selectedAccessory, setSelectedAccessory] = useState<string | null>(null);
  const [customNotes, setCustomNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState<"idle" | "running" | "done">("idle");
  const [generationMessage, setGenerationMessage] = useState("");
=======
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
>>>>>>> 8fbf66df8942473647be6535d2d82aec5565e4dd
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("auth_user") || "null"); } catch { return null; }
  }, []);

<<<<<<< HEAD
  const readyForCustomization = Boolean(previewUrl && model);
  const estimatedSecondsLeft = generating ? Math.max(0, Math.ceil((100 - progress) * 0.35)) : 0;
  const selectedAccessoryLabel = selectedAccessory ? accessoryOptions.find((opt) => opt.id === selectedAccessory)?.label ?? "None" : "None";
  const statusMessage = generationMessage || (readyForCustomization ? "Customize the colors and accessories, then create your 3D model." : "Upload a photo and choose a cartoon style to get started.");

  const handleColorSelect = (part: ColorPart, color: string) => {
    setSelectedColors((prev) => ({ ...prev, [part]: color }));
  };

  const startGeneration = () => {
    if (!readyForCustomization) {
      setGenerationMessage("Upload a photo and pick a model to start generating.");
      return;
    }
    if (generating) {
      return;
    }
    setGenerationStatus("running");
    setGenerationMessage("Generating your 3D model...");
    setGenerating(true);
    setProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const increment = Math.min(100 - prev, Math.floor(Math.random() * 6) + 2);
        const next = prev + increment;
        if (next >= 100) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          setGenerating(false);
          setGenerationStatus("done");
          setGenerationMessage("Your 3D model is ready! Scroll down to preview.");
          return 100;
        }
        return next;
      });
    }, 600);
  };

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!readyForCustomization) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setGenerating(false);
      setProgress(0);
      setGenerationStatus("idle");
      setGenerationMessage("");
    } else if (generationStatus === "idle") {
      setGenerationMessage("Customize the colors and accessories, then create your 3D model.");
    }
  }, [readyForCustomization, generationStatus]);

=======
>>>>>>> 8fbf66df8942473647be6535d2d82aec5565e4dd
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate(`/login?redirect=/magic-maker`, { replace: true });
    }
  }, [navigate]);

<<<<<<< HEAD
  const maleModels: ModelItem[] = [
    { src: "/src/gallery 3d models/character-knight.png", name: "Knight" },
    { src: "/src/gallery 3d models/character-superhero.png", name: "Superhero" },
    { src: "/src/gallery 3d models/one_piece.jpg", name: "One Piece" },
    { src: "/src/gallery 3d models/one_piece_blue.jpeg", name: "One Piece (Blue)" },
    { src: "/src/gallery 3d models/3d-character-models/captain-america.jpg", name: "Captain America" },
    { src: "/src/gallery 3d models/3d-character-models/goku.jpg", name: "Goku" },
    { src: "/src/gallery 3d models/3d-character-models/iron-man.jpg", name: "Iron Man" },
    { src: "/src/gallery 3d models/3d-character-models/luffy.jpg", name: "Luffy" },
    { src: "/src/gallery 3d models/3d-character-models/naruto.jpg", name: "Naruto" },
    { src: "/src/gallery 3d models/3d-character-models/spider-man.jpg", name: "Spider-Man" },
    { src: "/src/gallery 3d models/3d-character-models/tanjiro.jpg", name: "Tanjiro" },
  ];
  const femaleModels: ModelItem[] = [
    { src: "/src/gallery 3d models/character-fairy.png", name: "Fairy" },
    { src: "/src/gallery 3d models/character-astronaut.png", name: "Astronaut" },
    { src: "/src/gallery 3d models/moana_blue.jpeg", name: "Moana (Blue)" },
    { src: "/src/gallery 3d models/snowwhite_blue.jpeg", name: "Snow White (Blue)" },
    { src: "/src/gallery 3d models/Moana.jpg", name: "Moana" },
    { src: "/src/gallery 3d models/Moana_bluebg.jpg", name: "Moana (Blue BG)" },
    { src: "/src/gallery 3d models/Snow-white.jpg", name: "Snow White" },
    { src: "/src/gallery 3d models/3d-character-models/anna.jpg", name: "Anna" },
    { src: "/src/gallery 3d models/3d-character-models/ariel.jpg", name: "Ariel" },
    { src: "/src/gallery 3d models/3d-character-models/belle.jpg", name: "Belle" },
    { src: "/src/gallery 3d models/3d-character-models/cinderella.jpg", name: "Cinderella" },
    { src: "/src/gallery 3d models/3d-character-models/elsa.jpg", name: "Elsa" },
    { src: "/src/gallery 3d models/3d-character-models/moana.jpg", name: "Moana (Alt)" },
    { src: "/src/gallery 3d models/3d-character-models/mulan.jpg", name: "Mulan" },
    { src: "/src/gallery 3d models/3d-character-models/rapunzel.jpg", name: "Rapunzel" },
    { src: "/src/gallery 3d models/3d-character-models/snow-white.jpg", name: "Snow White (Alt)" },
  ];
  const modelOptions: ModelItem[] = gender === "male" ? maleModels : gender === "female" ? femaleModels : [...maleModels, ...femaleModels];

  const MIN_AGE = 1;
  const MAX_AGE = 16;

  const renderCrop = () => {
    const canvas = cropCanvasRef.current;
    const img = cropImgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = Math.min(canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const iw = img.naturalWidth * cropScale;
    const ih = img.naturalHeight * cropScale;
    const cx = canvas.width / 2 + cropOffset.x;
    const cy = canvas.height / 2 + cropOffset.y;
    const dx = cx - iw / 2;
    const dy = cy - ih / 2;
    ctx.drawImage(img, dx, dy, iw, ih);
  };

  useEffect(() => { renderCrop(); }, [cropScale, cropOffset, cropOpen]);

=======
>>>>>>> 8fbf66df8942473647be6535d2d82aec5565e4dd
  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
<<<<<<< HEAD
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 px-4 py-2 text-sm border border-white/10 transition-colors"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          <div className="text-3xl sm:text-4xl font-black tracking-[0.25em] italic">
            <span className="bg-gradient-to-r from-fuchsia-300 via-white to-sky-300 bg-clip-text text-transparent drop-shadow-lg">AI-FORGE</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
=======
          <div className="text-3xl sm:text-4xl font-black tracking-[0.25em] italic">
            <span className="bg-gradient-to-r from-fuchsia-300 via-white to-sky-300 bg-clip-text text-transparent drop-shadow-lg">AI-FORGE</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Profile avatar styled like a logo */}
>>>>>>> 8fbf66df8942473647be6535d2d82aec5565e4dd
            <div
              className="p-[2px] rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-400 to-sky-400"
              title={user?.name || "Profile"}
            >
              <div className="h-10 w-10 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-extrabold tracking-wide">
<<<<<<< HEAD
                {(user?.name || "U").split("@")[0].slice(0,1).toUpperCase()}
              </div>
            </div>
=======
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
>>>>>>> 8fbf66df8942473647be6535d2d82aec5565e4dd
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
<<<<<<< HEAD
                      if (rawImageUrl) URL.revokeObjectURL(rawImageUrl);
                      setRawImageUrl(url);
                      setShowCharModal(true);
                    }
                  }}
                />
                {showCharModal && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 bg-gradient-to-br from-yellow-200 via-orange-200 to-sky-200 rounded-lg z-20">
                    <div className="bg-white/80 backdrop-blur px-6 py-8 rounded-xl shadow-xl w-full max-w-xs mx-auto">
                      <h2 className="font-bold text-lg mb-4 text-center text-[#222]">Enter Character Details</h2>
                      <div className="mb-2">
                        <label className="block mb-1 font-medium text-black">Gender:</label>
                        <div className="flex gap-6 items-center mb-2 justify-center">
                          <button
                            className={`flex flex-col items-center px-3 py-2 rounded-xl border transition hover:bg-yellow-100 ${gender === 'male' ? 'bg-yellow-300 border-yellow-600 text-black scale-105' : 'bg-white/60 border-gray-300 text-gray-500'}`}
                            onClick={() => setGender('male')}
                            type="button"
                            tabIndex={0}
                          >
                            <FaMale className="text-3xl mb-1" />
                            <span className="text-xs font-medium">Boy</span>
                          </button>
                          <button
                            className={`flex flex-col items-center px-3 py-2 rounded-xl border transition hover:bg-pink-100 ${gender === 'female' ? 'bg-pink-200 border-pink-600 text-black scale-105' : 'bg-white/60 border-gray-300 text-gray-500'}`}
                            onClick={() => setGender('female')}
                            type="button"
                            tabIndex={0}
                          >
                            <FaFemale className="text-3xl mb-1" />
                            <span className="text-xs font-medium">Girl</span>
                          </button>
                        </div>
                      </div>
                      <div className="mb-6">
                        <label className="block mb-1 font-medium text-black">Age (years):</label>
                        <input
                          type="number"
                          value={age}
                          onChange={e => {
                            let val = parseInt(e.target.value.replace(/[^\d]/g, ""), 10);
                            if (isNaN(val)) val = "";
                            if (val !== "" && val < MIN_AGE) val = MIN_AGE;
                            if (val > MAX_AGE) val = MAX_AGE;
                            setAge(val === "" ? "" : String(val));
                          }}
                          min={MIN_AGE}
                          max={MAX_AGE}
                          className="border border-gray-300 p-2 rounded w-full text-black text-lg bg-white bg-opacity-70 focus:ring-2 focus:ring-yellow-400"
                          placeholder={`Enter age (${MIN_AGE}-${MAX_AGE})`}
                          maxLength={2}
                          inputMode="numeric"
                        />
                        <div className="text-xs text-gray-600 mt-1">Only ages 1 to 16 allowed</div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <button className="bg-white border text-gray-700 px-4 py-2 rounded hover:bg-gray-200 flex-1" type="button" onClick={() => setShowCharModal(false)}>
                          Cancel
                        </button>
                        <button
                          className="bg-yellow-400 hover:bg-yellow-300 text-[#0f172a] font-semibold px-4 py-2 rounded flex-1 disabled:bg-gray-200 disabled:text-gray-400"
                          type="button"
                          disabled={!(gender && age && Number(age) >= MIN_AGE && Number(age) <= MAX_AGE)}
                          onClick={() => {
                            setShowCharModal(false);
                            if (rawImageUrl) {
                              setCropOpen(true);
                              setTimeout(() => {
                                // initialize crop canvas and image
                                const img = new Image();
                                img.onload = () => {
                                  cropImgRef.current = img;
                                  const canvas = cropCanvasRef.current;
                                  if (canvas) {
                                    const rect = canvas.getBoundingClientRect();
                                    canvas.width = 600; // logical size for quality
                                    canvas.height = 600;
                                    setCropScale(Math.min(600 / img.naturalWidth, 600 / img.naturalHeight) * 1.2);
                                    setCropOffset({ x: 0, y: 0 });
                                    renderCrop();
                                  }
                                };
                                img.src = rawImageUrl;
                              }, 0);
                            }
                          }}
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  </div>
                )}
=======
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(url);
                    }
                  }}
                />
>>>>>>> 8fbf66df8942473647be6535d2d82aec5565e4dd
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
<<<<<<< HEAD
                {model ? (
                  <>
                    <img src={model.src} alt={model.name} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-sm px-3 py-2 text-center">{model.name}</div>
                  </>
                ) : (
                  <div className="text-white/70 text-sm">Cartoon model preview</div>
                )}
                {model && (
                  <button
                    className="absolute top-3 right-3 inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    onClick={() => setModel(null)}
=======
                {modelUrl ? (
                  <img src={modelUrl} alt="Selected model" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-white/70 text-sm">Cartoon model preview</div>
                )}
                {modelUrl && (
                  <button
                    className="absolute top-3 right-3 inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    onClick={() => setModelUrl(null)}
>>>>>>> 8fbf66df8942473647be6535d2d82aec5565e4dd
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
<<<<<<< HEAD
                  {modelOptions.map((item) => (
                    <button
                      key={item.src}
                      className="relative rounded-xl overflow-hidden border border-white/10 hover:border-white/30 focus:outline-none"
                      onClick={() => {
                        setModel(item);
                        setPickerOpen(false);
                      }}
                    >
                      <img src={item.src} alt={item.name} className="w-full h-40 object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 text-center">{item.name}</div>
=======
                  {[
                    "/src/gallery 3d models/character-knight.png",
                    "/src/gallery 3d models/character-superhero.png",
                    "/src/gallery 3d models/character-fairy.png",
                    "/src/gallery 3d models/character-astronaut.png",
                    "/src/gallery 3d models/opb.jpeg",
                    "/src/gallery 3d models/boss_blbg.jpeg",
                    "/src/gallery 3d models/moanabg.jpg",
                    "/src/gallery 3d models/elsabg.jpeg",
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
>>>>>>> 8fbf66df8942473647be6535d2d82aec5565e4dd
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

<<<<<<< HEAD
          {/* Crop Modal */}
          {cropOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-xl bg-[#0b1222] text-white rounded-2xl border border-white/10 p-4 sm:p-6 select-none">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Crop your photo</h3>
                  <button className="text-white/70 hover:text-white" onClick={() => setCropOpen(false)}>Close</button>
                </div>
                <div
                  ref={cropContainerRef}
                  className="relative w-full aspect-square rounded-xl overflow-hidden bg-black/70 border border-white/10 select-none"
                  onMouseDown={(e) => {
                    const rect = cropContainerRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const h = 14;
                    const within = (rx: number, ry: number) => x >= rx && x <= rx + h && y >= ry && y <= ry + h;
                    if (within(cropRect.x - h/2, cropRect.y - h/2)) { setCropDragMode("nw"); }
                    else if (within(cropRect.x + cropRect.size - h/2, cropRect.y - h/2)) { setCropDragMode("ne"); }
                    else if (within(cropRect.x - h/2, cropRect.y + cropRect.size - h/2)) { setCropDragMode("sw"); }
                    else if (within(cropRect.x + cropRect.size - h/2, cropRect.y + cropRect.size - h/2)) { setCropDragMode("se"); }
                    else if (x >= cropRect.x && x <= cropRect.x + cropRect.size && y >= cropRect.y && y <= cropRect.y + cropRect.size) {
                      setCropDragMode("move");
                    } else {
                      setCropDragMode(null);
                    }
                    setDragStartPt({ x, y });
                  }}
                  onMouseMove={(e) => {
                    if (!cropDragMode || !dragStartPt) return;
                    const rect = cropContainerRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const dx = x - dragStartPt.x;
                    const dy = y - dragStartPt.y;
                    setDragStartPt({ x, y });
                    setCropRect((prev) => {
                      let { x: px, y: py, size } = prev;
                      const max = rect.width; // square
                      if (cropDragMode === "move") {
                        px = Math.max(0, Math.min(max - size, px + dx));
                        py = Math.max(0, Math.min(max - size, py + dy));
                        return { x: px, y: py, size };
                      }
                      // Resize keeping square
                      if (cropDragMode === "nw") {
                        px += dx; py += dy; size -= Math.max(dx, dy);
                      } else if (cropDragMode === "ne") {
                        py += dy; size -= Math.max(-dx, dy); px = px; // right edge moves
                      } else if (cropDragMode === "sw") {
                        px += dx; size -= Math.max(dx, -dy); py = py;
                      } else if (cropDragMode === "se") {
                        size += Math.max(dx, dy);
                      }
                      size = Math.max(50, Math.min(max, size));
                      px = Math.max(0, Math.min(max - size, px));
                      py = Math.max(0, Math.min(max - size, py));
                      return { x: px, y: py, size };
                    });
                  }}
                  onMouseUp={() => { setCropDragMode(null); setDragStartPt(null); }}
                  onMouseLeave={() => { setCropDragMode(null); setDragStartPt(null); }}
                >
                  {/* base image canvas (for accurate transform) */}
                  <canvas ref={cropCanvasRef} className="absolute inset-0 w-full h-full" />
                  {/* crop overlay */}
                  <div className="absolute inset-0 bg-black/40" />
                  <div
                    className="absolute border-2 border-yellow-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
                    style={{ left: cropRect.x, top: cropRect.y, width: cropRect.size, height: cropRect.size }}
                  >
                    {/* handles */}
                    {(["nw","ne","sw","se"] as const).map((pos) => {
                      const half = 7;
                      const style: React.CSSProperties = {
                        width: 14, height: 14, background: "#fde047", borderRadius: 3, position: "absolute",
                        left: pos.includes("e") ? cropRect.size - half : -half,
                        top: pos.includes("s") ? cropRect.size - half : -half,
                        cursor: `${pos}-resize` as any,
                      };
                      return <div key={pos} style={style} />;
                    })}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs text-white/60">Zoom</span>
                  <input
                    type="range"
                    min={0.4}
                    max={3}
                    step={0.02}
                    value={cropScale}
                    onChange={(e) => setCropScale(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded px-4 py-2" onClick={() => setCropOpen(false)}>Cancel</button>
                  <button
                    className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold rounded px-4 py-2"
                    onClick={() => {
                      const viewCanvas = cropCanvasRef.current;
                      const img = cropImgRef.current;
                      if (!viewCanvas || !img) return;
                      const exportCanvas = document.createElement("canvas");
                      exportCanvas.width = 600; exportCanvas.height = 600;
                      const ctx = exportCanvas.getContext("2d");
                      if (!ctx) return;
                      const iw = img.naturalWidth * cropScale;
                      const ih = img.naturalHeight * cropScale;
                      const cx = viewCanvas.width / 2 + cropOffset.x;
                      const cy = viewCanvas.height / 2 + cropOffset.y;
                      const dx = cx - iw / 2;
                      const dy = cy - ih / 2;
                      const scaleExport = 600 / cropRect.size;
                      ctx.setTransform(scaleExport, 0, 0, scaleExport, -cropRect.x * scaleExport, -cropRect.y * scaleExport);
                      ctx.drawImage(img, dx, dy, iw, ih);
                      exportCanvas.toBlob((blob) => {
                        if (!blob) return;
                        const url = URL.createObjectURL(blob);
                        if (previewUrl) URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(url);
                        setCropOpen(false);
                      }, "image/jpeg", 0.92);
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Creation flow */}
          <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-6 sm:p-8 mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-300 via-purple-400 to-pink-400 flex items-center justify-center text-[#0f172a]">
                <Palette className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Customize Colors & Accessories</h3>
                <p className="text-sm text-white/70">Pick colors, props, and special notes so the 3D artist knows exactly what to build.</p>
              </div>
            </div>

            {readyForCustomization ? (
              <div className="space-y-8">
                <section>
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70 mb-3">Colors</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {colorPartsOrder.map((part) => {
                      const config = colorConfig[part];
                      return (
                        <div key={part} className="space-y-2 rounded-2xl bg-black/10 border border-white/10 p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-white">{config.label}</span>
                            <span className="text-xs text-white/60">{selectedColors[part]}</span>
                          </div>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {config.colors.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => handleColorSelect(part, color)}
                                className={`h-11 w-11 rounded-full border-2 transition-transform ${selectedColors[part] === color ? "border-yellow-300 scale-105 shadow-lg shadow-yellow-300/40" : "border-transparent hover:scale-105"}`}
                                style={{ backgroundColor: color }}
                                aria-label={`${config.label} ${color}`}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70 mb-3">Accessories</h4>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {accessoryOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedAccessory((prev) => (prev === option.id ? null : option.id))}
                        className={`rounded-2xl border px-4 py-3 text-left transition-all ${selectedAccessory === option.id ? "border-yellow-300 bg-white/15" : "border-white/10 bg-white/5 hover:border-white/30"}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{option.emoji}</span>
                          <div>
                            <div className="text-sm font-semibold text-white">{option.label}</div>
                            <div className="text-xs text-white/60">{option.description}</div>
                          </div>
                        </div>
            </button>
                    ))}
                  </div>
                </section>

                <section className="grid sm:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <h4 className="text-sm font-semibold text-white mb-2">Special Requests</h4>
                    <textarea
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="Describe poses, expressions, background items, or favorite themes for your child."
                      className="w-full min-h-[100px] rounded-xl border border-white/15 bg-[#0f172a]/60 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-300/40"
                    />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 flex flex-col gap-3 text-sm text-white/80">
                    <div>
                      <h4 className="font-semibold text-white mb-2">Summary</h4>
                      <ul className="space-y-1">
                        {colorPartsOrder.map((part) => (
                          <li key={part}>
                            {colorConfig[part].label}: <span className="font-semibold" style={{ color: selectedColors[part] }}>{selectedColors[part]}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      Accessory: <span className="font-semibold text-white">{selectedAccessoryLabel}</span>
                    </div>
                    <div className="text-white/60">
                      {selectedAccessory ? accessoryOptions.find((opt) => opt.id === selectedAccessory)?.description : "Add an optional prop to the character."}
                    </div>
                    <div className="text-white/70">
                      {customNotes ? `Notes: ${customNotes}` : "Share extra instructions to make the model perfect."}
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl bg-white/8 border border-white/12 p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-yellow-300 via-orange-400 to-pink-500 flex items-center justify-center text-[#0f172a]">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Magic Maker Engine</div>
                      <p className="text-xs text-white/70">We blend your custom colors, props, and photo details into a magical 3D render.</p>
                    </div>
                  </div>
                  <div className="w-full md:w-1/2 space-y-3">
                    <button
                      type="button"
                      onClick={startGeneration}
                      disabled={!readyForCustomization || generating}
                      className={`w-full inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold transition-all ${readyForCustomization ? "bg-yellow-400 text-[#0f172a] hover:bg-yellow-300" : "bg-white/10 text-white/40 cursor-not-allowed"} ${generating ? "animate-pulse" : ""}`}
                    >
                      {generating ? "Creating model..." : "Create 3D Model"}
            </button>
                    <div className="rounded-xl bg-black/40 border border-white/10 p-3 text-xs text-white/70 space-y-2">
                      <div className="font-semibold text-white">Status</div>
                      <p>{statusMessage}</p>
                      {(generating || progress > 0) && (
                        <>
                          <div className="flex items-center justify-between text-[11px] text-white/50">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="text-[11px] text-white/50">
                            {generating && estimatedSecondsLeft ? `Estimated time left: ~${estimatedSecondsLeft}s` : generationStatus === "done" ? "Model ready! Scroll down to preview below." : null}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/5 py-12 text-center text-white/60">
                <div className="max-w-md mx-auto space-y-2">
                  <p className="font-semibold text-white">Upload a picture and choose a cartoon model to unlock customization.</p>
                  <p className="text-sm">Once a style is selected, you can recolor outfits, change hairstyles, and add props like balls, cars, wands, or pets.</p>
                </div>
              </div>
            )}
=======
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <button className="w-full sm:w-auto rounded-full bg-yellow-400 hover:bg-yellow-300 text-black font-medium px-6 py-3 transition-colors">
              Create 3D Model
            </button>
            <button className="w-full sm:w-auto rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium px-6 py-3 transition-colors">
              Customize Colors & Accessories
            </button>
>>>>>>> 8fbf66df8942473647be6535d2d82aec5565e4dd
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


