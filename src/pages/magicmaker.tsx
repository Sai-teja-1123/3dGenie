import ModelViewer3D from "@/components/ModelViewer3D";
import { Upload, ArrowLeft, Twitter, Instagram, Facebook, ShoppingBag, Trash, Sparkles, Palette } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaMale, FaFemale } from "react-icons/fa";
import * as XLSX from "xlsx";
import {
  generate3DModel,
  pollJobStatus,
  getResultFileUrl,
  ApiError,
} from "@/services/api";
import { Download } from "lucide-react";

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

const MagicMaker = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
  const [promptsMap, setPromptsMap] = useState<Map<string, string>>(new Map());
  const [promptsLoaded, setPromptsLoaded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [generationMessage, setGenerationMessage] = useState("");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [resultFiles, setResultFiles] = useState<string[]>([]);
  const [resultModelUrl, setResultModelUrl] = useState<string | null>(null);
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("auth_user") || "null"); } catch { return null; }
  }, []);

  const readyForCustomization = Boolean(previewUrl && model);
  const readyForPreview = Boolean(previewUrl && model && customNotes.trim());
  const [showPreview, setShowPreview] = useState(false);
  const estimatedSecondsLeft = generating ? Math.max(0, Math.ceil((100 - progress) * 0.35)) : 0;
  const selectedAccessoryLabel = selectedAccessory ? accessoryOptions.find((opt) => opt.id === selectedAccessory)?.label ?? "None" : "None";
  const statusMessage = generationMessage || (readyForCustomization ? "Enter or review your prompt, then create your 3D model." : "Upload a photo and choose a cartoon style to get started.");

  const handleColorSelect = (part: ColorPart, color: string) => {
    setSelectedColors((prev) => ({ ...prev, [part]: color }));
  };

  const startGeneration = async () => {
    if (!readyForCustomization) {
      setGenerationMessage("Upload a photo and pick a model to start generating.");
      return;
    }
    if (generating) {
      return;
    }

    if (!previewUrl) {
      setGenerationMessage("Please upload an image first.");
      return;
    }

    setGenerationStatus("running");
    setGenerationMessage("Uploading image and starting generation...");
    setGenerating(true);
    setProgress(0);
    setResultFiles([]);
    setResultModelUrl(null);

    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    try {
      // Convert preview URL to File
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const file = new File([blob], "uploaded-image.jpg", { type: blob.type });

      // Start generation
      setGenerationMessage("Submitting generation request...");
      const jobResponse = await generate3DModel(file, 50);

      setCurrentJobId(jobResponse.job_id);
      setGenerationMessage(`Job created! Job ID: ${jobResponse.job_id.substring(0, 8)}...`);

      // Poll for status
      setGenerationMessage("Processing your 3D model... This may take a few minutes.");
      
      const result = await pollJobStatus(
        jobResponse.job_id,
        (progressValue, status) => {
          setProgress(progressValue);
          if (status === "processing" || status === "queued") {
            setGenerationMessage(`Processing... ${Math.round(progressValue)}%`);
          }
        },
        2000, // Poll every 2 seconds
        600000 // 10 minute timeout
      );

      // Generation completed
      setProgress(100);
      setGenerating(false);
      setGenerationStatus("done");
      
      if (result.result_files && result.result_files.length > 0) {
        setResultFiles(result.result_files);
        
        // Find GLB/OBJ files for 3D model display
        const modelFile = result.result_files.find(
          (f) => f.endsWith(".glb") || f.endsWith(".obj")
        );
        
        if (modelFile) {
          const modelUrl = getResultFileUrl(jobResponse.job_id, modelFile);
          setResultModelUrl(modelUrl);
          setGenerationMessage("Your 3D model is ready! Scroll down to preview.");
        } else {
          // If no 3D file, show images
          const imageFile = result.result_files.find(
            (f) => f.endsWith(".png") || f.endsWith(".jpg") || f.endsWith(".jpeg")
          );
          if (imageFile) {
            const imageUrl = getResultFileUrl(jobResponse.job_id, imageFile);
            setResultModelUrl(imageUrl);
            setGenerationMessage("Generation completed! Check the preview below.");
          } else {
            setGenerationMessage("Generation completed! Files are ready for download.");
          }
        }
      } else {
        setGenerationMessage("Generation completed, but no output files found.");
      }
    } catch (error) {
      console.error("Generation error:", error);
      setGenerating(false);
      setGenerationStatus("error");
      
      if (error instanceof ApiError) {
        const errorMsg = error.message.toLowerCase();
        // Check for model-related errors
        const isModelError = 
          errorMsg.includes("model") ||
          errorMsg.includes("does not exist") ||
          errorMsg.includes("node") && errorMsg.includes("not found") ||
          errorMsg.includes("file not found") ||
          errorMsg.includes("missing") ||
          errorMsg.includes("cannot execute");
        
        if (isModelError) {
          setGenerationMessage(
            `Models not installed: ${error.message}. Please install the required models in ComfyUI. See backend/MODELS_SETUP.md for instructions.`
          );
        } else if (error.statusCode === 503) {
          setGenerationMessage(
            `Backend service unavailable: ${error.message}. Please ensure ComfyUI is running and accessible.`
          );
        } else {
          setGenerationMessage(
            `Error: ${error.message}`
          );
        }
      } else {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        const lowerMsg = errorMsg.toLowerCase();
        
        // Check for model-related errors in generic errors too
        const isModelError = 
          lowerMsg.includes("model") ||
          lowerMsg.includes("does not exist") ||
          lowerMsg.includes("node") && lowerMsg.includes("not found");
        
        if (isModelError) {
          setGenerationMessage(
            `Models not installed: ${errorMsg}. Please install the required models in ComfyUI. See backend/MODELS_SETUP.md for instructions.`
          );
        } else {
          setGenerationMessage(
            `An error occurred: ${errorMsg}`
          );
        }
      }
      
      // Clear interval if still running
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
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

  useEffect(() => {
    if (!readyForCustomization) {
      setShowPreview(false);
    }
  }, [readyForCustomization]);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate(`/login?redirect=/magic-maker`, { replace: true });
    }
  }, [navigate]);

  // Load prompts from Excel file
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const response = await fetch("/character-prompts.xlsx");
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet) as Array<Record<string, any>>;
        
        const map = new Map<string, string>();
        
        // Helper function to normalize model names for matching
        const normalizeName = (name: string): string => {
          return name
            .toLowerCase()
            .replace(/\s*-\s*/g, " ") // Replace hyphens with spaces
            .replace(/\s+/g, " ") // Multiple spaces to single space
            .trim();
        };
        
        // Map to handle name variations between code and Excel
        const nameVariations: Record<string, string[]> = {
          "elsa": ["elsa", "elsa - frozen"],
          "anna": ["anna", "anna- frozen"],
          "ariel": ["ariel", "little mermaid"],
          "belle": ["belle", "belle - beauty and the beast"],
        };
        
        // Parse Excel data - handle BOY and GIRL columns
        data.forEach((row) => {
          // Process BOY column
          const boyName = (row["BOY"] || row["Boy"] || "").toString().trim();
          const boyPrompt = (row["PROMPT"] || "").toString().trim();
          if (boyName && boyPrompt) {
            const normalized = normalizeName(boyName);
            map.set(normalized, boyPrompt);
            // Also store original name for exact match
            map.set(boyName.toLowerCase(), boyPrompt);
          }
          
          // Process GIRL column
          const girlName = (row["GIRL"] || row["Girl"] || "").toString().trim();
          const girlPrompt = (row["PROMPT_1"] || row["PROMPT"] || "").toString().trim();
          if (girlName && girlPrompt) {
            const normalized = normalizeName(girlName);
            map.set(normalized, girlPrompt);
            // Also store original name for exact match
            map.set(girlName.toLowerCase(), girlPrompt);
          }
        });
        
        // Add variations mapping
        Object.entries(nameVariations).forEach(([baseName, variations]) => {
          const prompt = map.get(baseName) || map.get(variations[0]);
          if (prompt) {
            variations.forEach(variation => {
              if (!map.has(variation)) {
                map.set(variation, prompt);
              }
            });
          }
        });
        
        setPromptsMap(map);
        setPromptsLoaded(true);
      } catch (error) {
        console.error("Failed to load prompts from Excel:", error);
        setPromptsLoaded(true); // Set to true even on error to prevent infinite retries
      }
    };
    
    loadPrompts();
  }, []);

  // Auto-populate prompt when model is selected
  useEffect(() => {
    if (model && promptsLoaded) {
      const modelName = model.name;
      
      // Helper function to normalize model names for matching
      const normalizeName = (name: string): string => {
        return name
          .toLowerCase()
          .replace(/\s*-\s*/g, " ") // Replace hyphens with spaces
          .replace(/\s+/g, " ") // Multiple spaces to single space
          .trim();
      };
      
      // Try exact match first
      let prompt = promptsMap.get(modelName.toLowerCase());
      
      // Try normalized match
      if (!prompt) {
        const normalized = normalizeName(modelName);
        prompt = promptsMap.get(normalized);
      }
      
      // Handle specific name variations
      const nameVariations: Record<string, string[]> = {
        "elsa": ["elsa", "elsa - frozen"],
        "anna": ["anna", "anna- frozen"],
        "ariel": ["ariel", "little mermaid"],
        "belle": ["belle", "belle - beauty and the beast"],
      };
      
      if (!prompt) {
        const lowerName = modelName.toLowerCase();
        for (const [base, variations] of Object.entries(nameVariations)) {
          if (variations.includes(lowerName) || lowerName === base) {
            for (const variation of variations) {
              prompt = promptsMap.get(variation);
              if (prompt) break;
            }
            if (prompt) break;
          }
        }
      }
      
      // Always populate prompt when model is selected
      if (prompt) {
        setCustomNotes(prompt);
      } else {
        // Default prompt for models not in Excel (include model name)
        const defaultPrompt = `Create a 3D character model inspired by ${modelName}. Make it vibrant, playful, and suitable for children.`;
        setCustomNotes(defaultPrompt);
      }
    }
  }, [model, promptsLoaded, promptsMap]);

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

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 px-4 py-2 text-sm border border-white/10 transition-colors"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          <div className="text-3xl sm:text-4xl font-black tracking-[0.25em] italic">
            <span className="bg-gradient-to-r from-fuchsia-300 via-white to-sky-300 bg-clip-text text-transparent drop-shadow-lg">3DGENI</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="p-[2px] rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-400 to-sky-400"
              title={user?.name || "Profile"}
            >
              <div className="h-10 w-10 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-extrabold tracking-wide">
                {(user?.name || "U").split("@")[0].slice(0,1).toUpperCase()}
              </div>
            </div>
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
                  <>
                    <button
                      className="absolute top-3 right-3 inline-flex items-center justify-center h-9 w-9 rounded-full bg-black/70 hover:bg-red-600/80 text-white transition-colors"
                      onClick={() => {
                        if (previewUrl) URL.revokeObjectURL(previewUrl);
                        if (rawImageUrl) URL.revokeObjectURL(rawImageUrl);
                        setPreviewUrl(null);
                        setRawImageUrl(null);
                        setGender("");
                        setAge("");
                        setModel(null);
                        setCustomNotes("");
                    setShowPreview(false);
                      }}
                      aria-label="Remove uploaded image"
                      title="Remove photo"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                    <button
                      className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white px-3 py-1.5 text-xs font-medium transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      title="Change photo"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Change
                    </button>
                  </>
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
                    onClick={() => {
                      setModel(null);
                      setShowPreview(false);
                    }}
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
                  {modelOptions.map((item) => (
                    <button
                      key={item.src}
                      className="relative rounded-xl overflow-hidden border border-white/10 hover:border-white/30 focus:outline-none"
                      onClick={() => {
                        setModel(item);
                      setShowPreview(false);
                        setPickerOpen(false);
                        // Auto-populate prompt when model is selected
                        if (promptsLoaded) {
                          const normalizeName = (name: string): string => {
                            return name
                              .toLowerCase()
                              .replace(/\s*-\s*/g, " ")
                              .replace(/\s+/g, " ")
                              .trim();
                          };
                          
                          let prompt = promptsMap.get(item.name.toLowerCase());
                          
                          if (!prompt) {
                            const normalized = normalizeName(item.name);
                            prompt = promptsMap.get(normalized);
                          }
                          
                          // Handle specific name variations
                          const nameVariations: Record<string, string[]> = {
                            "elsa": ["elsa", "elsa - frozen"],
                            "anna": ["anna", "anna- frozen"],
                            "ariel": ["ariel", "little mermaid"],
                            "belle": ["belle", "belle - beauty and the beast"],
                          };
                          
                          if (!prompt) {
                            const lowerName = item.name.toLowerCase();
                            for (const [base, variations] of Object.entries(nameVariations)) {
                              if (variations.includes(lowerName) || lowerName === base) {
                                for (const variation of variations) {
                                  prompt = promptsMap.get(variation);
                                  if (prompt) break;
                                }
                                if (prompt) break;
                              }
                            }
                          }
                          
                          if (prompt) {
                            setCustomNotes(prompt);
                          } else {
                            // Default prompt for models not in Excel (include model name)
                            const defaultPrompt = `Create a 3D character model inspired by ${item.name}. Make it vibrant, playful, and suitable for children.`;
                            setCustomNotes(defaultPrompt);
                          }
                        }
                      }}
                    >
                      <img src={item.src} alt={item.name} className="w-full h-40 object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 text-center">{item.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

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
                <h3 className="text-lg font-semibold">Enter Prompt</h3>
                <p className="text-sm text-white/70">Select a model to auto-populate the prompt, or enter your own.</p>
              </div>
            </div>

            {readyForCustomization ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <section>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <h4 className="text-sm font-semibold text-white mb-2">Prompt</h4>
                      <textarea
                        value={customNotes}
                        onChange={(e) => {
                          setCustomNotes(e.target.value);
                          setShowPreview(false);
                        }}
                        placeholder="Prompt will be auto-populated when you select a model."
                        className="w-full min-h-[200px] rounded-xl border border-white/15 bg-[#0f172a]/60 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-300/40"
                      />
                    </div>
                  </section>

                  <section className="rounded-2xl bg-white/8 border border-white/12 p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-300 via-purple-400 to-pink-400 flex items-center justify-center text-[#0f172a]">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">Magic Maker Engine</div>
                        <p className="text-xs text-white/70">We blend your custom colors, props, and photo details into a magical 3D render.</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setShowPreview(true)}
                        disabled={!readyForPreview}
                        className={`w-full inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold transition-all ${
                          readyForPreview ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-white/10 text-white/40 cursor-not-allowed"
                        }`}
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={startGeneration}
                        disabled={!readyForCustomization || generating}
                        className={`w-full inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold transition-all ${
                          readyForCustomization ? "bg-yellow-400 text-[#0f172a] hover:bg-yellow-300" : "bg-white/10 text-white/40 cursor-not-allowed"
                        } ${generating ? "animate-pulse" : ""}`}
                      >
                        {generating ? "Creating model..." : "Create 3D Model"}
                      </button>
                      {!readyForCustomization && (
                        <p className="text-xs text-white/50 text-center">
                          Note: Models must be installed in ComfyUI for generation to work
                        </p>
                      )}
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  {showPreview ? (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <h4 className="text-sm font-semibold text-white mb-4">Live Preview</h4>
                      <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-purple-200 via-pink-200 to-orange-200 flex items-center justify-center">
                        {model ? (
                          <div className="relative w-full h-full">
                            <img src={model.src} alt={`Preview of ${model.name}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <div className="text-center text-white space-y-1 px-4">
                                <div className="text-lg font-bold">3D Preview</div>
                                <div className="text-sm opacity-90">{model.name}</div>
                                <div className="text-xs opacity-75 mt-1 max-w-xs mx-auto">
                                  Prompt: {customNotes.slice(0, 90)}
                                  {customNotes.length > 90 ? "... " : ""}
                                </div>
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-sm px-3 py-2 text-center">
                              Preview Mode
                            </div>
                          </div>
                        ) : (
                          <div className="text-black/60 text-sm">Preview will appear here</div>
                        )}
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={() => setShowPreview(false)}
                          className="w-full inline-flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 py-2 px-4 text-sm font-medium transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 flex items-center justify-center py-12 text-center text-white/60">
                      <div className="max-w-md mx-auto space-y-2">
                        <p className="font-semibold text-white">Enter a prompt and click Preview</p>
                        <p className="text-sm">See how your 3D character will look before generating</p>
                      </div>
                    </div>
                  )}

                  <div
                    className={`rounded-xl border p-3 text-xs space-y-2 ${
                      generationStatus === "error" ? "bg-red-500/10 border-red-500/30 text-red-200" : "bg-black/40 border-white/10 text-white/70"
                    }`}
                  >
                    <div className={`font-semibold ${generationStatus === "error" ? "text-red-300" : "text-white"}`}>Status</div>
                    <p className={generationStatus === "error" ? "text-red-200" : ""}>{statusMessage}</p>
                    {generationStatus === "error" && (
                      <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-[11px]">
                        <div className="font-semibold mb-1">Missing Models?</div>
                        <div className="text-red-200/80">
                          Generation requires models to be installed in ComfyUI. Check{" "}
                          <code className="bg-black/30 px-1 rounded">backend/MODELS_SETUP.md</code> for setup instructions.
                        </div>
                      </div>
                    )}
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
                          {generating && estimatedSecondsLeft
                            ? `Estimated time left: ~${estimatedSecondsLeft}s`
                            : generationStatus === "done"
                              ? "Model ready! Scroll down to preview below."
                              : null}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/5 py-12 text-center text-white/60">
                <div className="max-w-md mx-auto space-y-2">
                  <p className="font-semibold text-white">Upload a picture and choose a cartoon model to get started.</p>
                  <p className="text-sm">The prompt will be auto-populated when you select a model.</p>
                </div>
              </div>
            )}
          </div>

          {/* Large 3D preview */}
          <div className="rounded-xl bg-white/[0.06] border border-white/10 p-2 sm:p-4">
            <div className="aspect-[16/10] rounded-lg overflow-hidden bg-black/60">
              {resultModelUrl && (resultModelUrl.endsWith('.glb') || resultModelUrl.endsWith('.obj')) ? (
                <ModelViewer3D modelUrl={resultModelUrl} />
              ) : resultModelUrl ? (
                <div className="w-full h-full flex items-center justify-center">
                  <img 
                    src={resultModelUrl} 
                    alt="Generated result" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <ModelViewer3D />
              )}
            </div>
            {resultFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-sm font-semibold text-white">Generated Files:</div>
                <div className="flex flex-wrap gap-2">
                  {resultFiles.map((file, idx) => (
                    <a
                      key={idx}
                      href={currentJobId ? getResultFileUrl(currentJobId, file) : '#'}
                      download
                      className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded px-3 py-1.5 text-white/80 hover:text-white transition-colors"
                    >
                      {file.split('/').pop()}
                    </a>
                  ))}
                </div>
              </div>
            )}
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

