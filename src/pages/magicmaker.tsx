import { Upload, ArrowLeft, Twitter, Instagram, Facebook, Trash, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
// XLSX is dynamically imported when needed to reduce initial bundle size (~500KB saved)
import {
  generate3DModel,
  generateImage,
  pollJobStatus,
  getResultFileUrl,
  cancelJob,
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

// Lazy-load heavy components so their chunks only download when needed.
const LazyModelViewer3D = lazy(() => import("@/components/ModelViewer3D"));
const LazyDetailsModal = lazy(() => import("@/components/MagicDetailsModal"));
const LazyCropModal = lazy(() => import("@/components/MagicCropModal"));

const MagicMaker = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [boysList, setBoysList] = useState<string[]>([]);
  const [girlsList, setGirlsList] = useState<string[]>([]);
  const [cropOpen, setCropOpen] = useState(false);
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
  const [previewGenerating, setPreviewGenerating] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
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

    // Use preview image if available, otherwise use original cropped image
    const imageToUse = previewImageUrl || previewUrl;
    if (!imageToUse) {
      setGenerationMessage("Please generate a preview image first or upload an image.");
      return;
    }

    setGenerationStatus("running");
    setGenerationMessage("Uploading image and starting 3D model generation...");
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
      // Convert image URL to File - use preview image if available
      const response = await fetch(imageToUse);
      const blob = await response.blob();
      const file = new File([blob], "preview-image.jpg", { type: blob.type });

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

  const startPreviewGeneration = async () => {
    if (!readyForPreview) {
      setGenerationMessage("Upload a photo, select a model, and enter a prompt to preview.");
      return;
    }
    if (previewGenerating) {
      return;
    }

    if (!previewUrl) {
      setGenerationMessage("Please upload an image first.");
      return;
    }

    setPreviewGenerating(true);
    setPreviewProgress(0);
    setPreviewImageUrl(null);
    setPreviewJobId(null);
    setShowPreview(true);
    setGenerationStatus("running");
    setGenerationMessage("Generating preview image...");

    try {
      // Convert preview URL to File
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const file = new File([blob], "uploaded-image.jpg", { type: blob.type });

      // Start image generation
      const jobResponse = await generateImage(
        file,
        customNotes,
        "watermark, text, low quality, blurry",
        20,
        3.5
      );

      setPreviewJobId(jobResponse.job_id);
      setGenerationMessage(`Preview job created! Generating...`);

      // Poll for status
      const result = await pollJobStatus(
        jobResponse.job_id,
        (progressValue, status) => {
          setPreviewProgress(progressValue);
          if (status === "processing" || status === "queued") {
            setGenerationMessage(`Generating preview... ${Math.round(progressValue)}%`);
          }
        },
        2000,
        300000 // 5 minute timeout for preview
      );

      // Preview completed
      setPreviewProgress(100);
      setPreviewGenerating(false);
      setGenerationStatus("done");

      if (result.result_files && result.result_files.length > 0) {
        // Find image file
        const imageFile = result.result_files.find(
          (f) => f.endsWith(".png") || f.endsWith(".jpg") || f.endsWith(".jpeg")
        );
        if (imageFile) {
          const imageUrl = getResultFileUrl(jobResponse.job_id, imageFile);
          setPreviewImageUrl(imageUrl);
          setGenerationMessage("Preview generated! Review and create 3D model if satisfied.");
        } else {
          setGenerationMessage("Preview completed, but no image file found.");
        }
      } else {
        setGenerationMessage("Preview completed, but no output files found.");
      }
    } catch (error) {
      console.error("Preview generation error:", error);
      setPreviewGenerating(false);
      setGenerationStatus("error");
      
      if (error instanceof ApiError) {
        setGenerationMessage(`Preview error: ${error.message}`);
      } else {
        setGenerationMessage(`An error occurred: ${error instanceof Error ? error.message : "Unknown error"}`);
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
        // Dynamically import XLSX only when needed - saves ~500KB from initial bundle
        const XLSX = await import("xlsx");
        const response = await fetch("/character-prompts.xlsx");
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet) as Array<Record<string, any>>;
        
        const map = new Map<string, string>();
        const boys: string[] = [];
        const girls: string[] = [];
        
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
            if (!boys.includes(boyName)) {
              boys.push(boyName);
            }
            const normalized = normalizeName(boyName);
            map.set(normalized, boyPrompt);
            // Also store original name for exact match
            map.set(boyName.toLowerCase(), boyPrompt);
          }
          
          // Process GIRL column
          const girlName = (row["GIRL"] || row["Girl"] || "").toString().trim();
          const girlPrompt = (row["PROMPT_1"] || row["PROMPT"] || "").toString().trim();
          if (girlName && girlPrompt) {
            if (!girls.includes(girlName)) {
              girls.push(girlName);
            }
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
        
        setBoysList(boys.sort());
        setGirlsList(girls.sort());
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
      const modelName = model;
      
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

  const modelOptions: string[] = gender === "male"
    ? boysList
    : gender === "female"
      ? girlsList
      : [...new Set([...boysList, ...girlsList])].sort();

  const MIN_AGE = 1;
  const MAX_AGE = 16;

  return (
    <div className="relative min-h-screen bg-dark-bg text-white flex flex-col font-sans selection:bg-neon-cyan selection:text-black overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -top-28 -left-24 h-[24rem] w-[24rem] rounded-full bg-[#00f2ff]/12 blur-[120px]" />
        <div className="absolute top-16 right-[-5rem] h-[22rem] w-[22rem] rounded-full bg-[#7000ff]/15 blur-[120px]" />
      </div>
      {/* Header */}
      <header className="w-full border-b border-white/10 backdrop-blur-xl bg-black/40 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-xl glass px-4 py-2 text-[11px] uppercase tracking-widest font-bold border border-white/10 transition-all hover:bg-white/10 hover:scale-105"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <div className="w-8 h-8 bg-gradient-action rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <span className="w-5 h-5 rounded-md bg-white" />
              </div>
              <span className="text-lg font-bold tracking-tighter uppercase">3DGENI</span>
            </button>
            </div>
          <div className="flex items-center gap-3">
            <div
              className="p-[2px] rounded-full bg-gradient-action shadow-[0_0_20px_rgba(112,0,255,0.35)]"
              title={user?.name || "Profile"}
            >
              <div className="h-10 w-10 rounded-full bg-[#07070a] text-white flex items-center justify-center font-extrabold tracking-wide shadow-inner">
                {(user?.name || "U").split("@")[0].slice(0,1).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full relative z-10" style={{ scrollBehavior: 'smooth' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 text-center tracking-tight">
            <span className="text-white">Transform your child's imagination into </span>
            <span className="text-[#00f2ff]">3D</span>
            <span className="text-white"> magic</span>
            <span className="text-[#ff8a00]">.</span>
          </h1>
          <div className="max-w-5xl mx-auto mb-8 rounded-2xl glass border border-white/10 px-4 py-3 flex flex-wrap items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em]">
            <div className="inline-flex items-center gap-2 text-white/70">
              <Sparkles className="h-3.5 w-3.5 text-[#00f2ff]" />
              <span>Status: {statusMessage}</span>
            </div>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="text-white/60">Model: <span className="text-white">{model || "Not selected"}</span></span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="text-white/60">Accessory: <span className="text-white">{selectedAccessoryLabel}</span></span>
            {generating && (
              <>
                <span className="hidden sm:inline text-white/20">|</span>
                <span className="text-[#00f2ff]">ETA: {estimatedSecondsLeft}s</span>
              </>
            )}
          </div>

          {/* Top Section: Upload (Left) and Preview (Right) */}
          <div className="flex justify-center mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-[92%]">
            {/* Left: Upload Photo */}
            <div className="rounded-2xl glass border border-white/10 p-6 shadow-[0_0_30px_rgba(0,242,255,0.08)] transition-all duration-300 hover:border-[#00f2ff]/30 focus-within:ring-2 focus-within:ring-[#00f2ff]/30 focus-within:outline-none">
              <div className="mb-5">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2 font-bold">Input</div>
                <div className="font-bold text-white text-lg mb-1">Upload any picture</div>
                <div className="text-sm text-white/60">Select from your device</div>
              </div>
              
              {/* Photo Preview Area */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-[#0b0b12] via-[#101022] to-[#17132a] flex items-center justify-center shadow-[inset_0_2px_20px_rgba(0,0,0,0.45)] ring-1 ring-white/10 max-h-[60vh]">
                {previewUrl ? (
                  <img src={previewUrl} alt="Upload preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center flex flex-col items-center justify-center h-full">
                    <div className="text-white/50 text-sm mb-3">Upload preview</div>
                    <button
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-action text-white hover:opacity-95 px-5 py-2.5 text-sm font-bold shadow-[0_0_20px_rgba(112,0,255,0.35)] transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#00f2ff]/40 focus:ring-offset-2 focus:ring-offset-transparent"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Upload Photo
                    </button>
                  </div>
                )}
                {previewUrl && (
                  <>
                    <button
                      className="absolute top-3 right-3 inline-flex items-center justify-center h-9 w-9 rounded-xl glass border border-white/15 hover:border-red-400/40 hover:bg-red-500/20 text-white transition-all hover:scale-110 backdrop-blur-sm"
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
                        setPreviewImageUrl(null);
                      }}
                      aria-label="Remove uploaded image"
                      title="Remove photo"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                    <button
                      className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-xl glass border border-white/15 hover:bg-white/10 text-white px-3 py-1.5 text-xs font-medium transition-all hover:scale-105 backdrop-blur-sm"
                      onClick={() => {
                        if (rawImageUrl) {
                          setCropOpen(true);
                        }
                      }}
                      title="Crop photo"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Crop
                    </button>
                  </>
                )}
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
                      setCropOpen(true);
                    }
                  }}
                />
              </div>
            </div>

            {/* Right: Preview Image */}
            <div className="rounded-2xl glass border border-white/10 p-6 shadow-[0_0_30px_rgba(112,0,255,0.12)] transition-all duration-300 hover:border-[#7000ff]/35 focus-within:ring-2 focus-within:ring-[#7000ff]/25 focus-within:outline-none">
              <div className="mb-5">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2 font-bold">Preview</div>
                <div className="font-bold text-white text-lg mb-1">Choose a fun cartoon style</div>
                <div className="text-sm text-white/60">Pick a style that suits your child's personality</div>
              </div>
              
              <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-[#0d0b16] via-[#18122a] to-[#1f1430] flex items-center justify-center relative mb-4 shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] ring-1 ring-white/10 max-h-[60vh]">
                {previewGenerating ? (
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                    <div className="text-white font-medium">Generating preview... {Math.round(previewProgress)}%</div>
                    <div className="w-48 bg-white/15 rounded-full h-2 mx-auto">
                      <div
                        className="bg-gradient-to-r from-[#00f2ff] to-[#7000ff] h-2 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(0,242,255,0.4)]"
                        style={{ width: `${previewProgress}%` }}
                      />
                    </div>
                  </div>
                ) : previewImageUrl ? (
                  <div className="relative w-full h-full">
                    <img
                      src={previewImageUrl}
                      alt="Generated preview"
                      className="w-full h-full object-cover"
                    />
                    {model && (
                      <div className="absolute top-2 right-2 glass border border-white/15 text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded">
                        {model}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-white/60 flex flex-col items-center justify-center h-full">
                    <div className="text-4xl mb-2">🎨</div>
                    <div className="text-sm">Preview will appear here</div>
                  </div>
                )}
              </div>

              {/* Download and Retry Buttons */}
              {(previewImageUrl || showPreview) && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      const imageUrl = previewImageUrl || previewUrl || "";
                      if (imageUrl) {
                        const link = document.createElement('a');
                        link.href = imageUrl;
                        link.download = `preview-${model || 'character'}.jpg`;
                        link.click();
                      }
                    }}
                    disabled={!previewImageUrl && !previewUrl}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 py-2.5 px-4 text-[11px] uppercase tracking-widest font-bold transition-all duration-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#00f2ff]/35 focus:ring-offset-2 focus:ring-offset-transparent ${
                      (previewImageUrl || previewUrl)
                        ? "glass hover:bg-white/10 text-white hover:scale-105"
                        : "bg-white/5 text-white/40 cursor-not-allowed"
                    }`}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      // Clear current preview and restart generation
                      setPreviewImageUrl(null);
                      setPreviewJobId(null);
                      setPreviewProgress(0);
                      setPreviewGenerating(false);
                      setShowPreview(false);
                      setGenerationStatus("idle");
                      setGenerationMessage("");
                      // Restart the preview generation flow
                      if (readyForPreview) {
                        startPreviewGeneration();
                      }
                    }}
                    disabled={!readyForPreview || previewGenerating}
                    className="inline-flex items-center justify-center gap-2 rounded-xl glass hover:bg-white/10 text-white border border-white/15 py-2.5 px-4 text-[11px] uppercase tracking-widest font-bold transition-all duration-300 backdrop-blur-sm hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#7000ff]/35 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
            </div>
          </div>


          {/* Crop Modal (lazy-loaded) */}
          {cropOpen && rawImageUrl && (
            <Suspense
              fallback={
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
                  <div className="text-white/80 text-sm">Loading crop tool...</div>
                </div>
              }
            >
              <LazyCropModal
                open={cropOpen}
                imageUrl={rawImageUrl}
                onClose={() => setCropOpen(false)}
                onCropped={(url) => {
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(url);
                  setCropOpen(false);
                  setShowDetailsModal(true);
                }}
              />
            </Suspense>
          )}

          {/* Action Buttons */}
          {previewUrl && (
            <div className="flex gap-4 mb-8 justify-center">
              <button
                type="button"
                onClick={startGeneration}
                disabled={!previewUrl || generating}
                className={`relative group inline-flex items-center justify-center rounded-2xl px-10 py-5 font-extrabold text-[10px] uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_0_30px_rgba(112,0,255,0.3)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent overflow-hidden ${
                  previewUrl && !generating
                    ? "bg-gradient-action text-white hover:opacity-95 hover:scale-105 focus:ring-[#7000ff]/45"
                    : "bg-white/10 text-white/40 cursor-not-allowed focus:ring-white/20"
                } ${generating ? "animate-pulse shadow-[0_0_40px_rgba(0,242,255,0.25)]" : ""}`}
              >
                {!generating && <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity" />}
                <span className="relative">{generating ? `Creating 3D Model... ${Math.round(progress)}%` : "Create 3D Model"}</span>
              </button>
            </div>
          )}

          {/* 3D Model Viewer */}
          {previewUrl && (
            <div className="rounded-2xl glass border border-white/10 p-8 shadow-[0_0_40px_rgba(112,0,255,0.12)]">
              <div className="flex items-center justify-center mb-6">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1">Output</p>
                  <h4 className="text-xl font-extrabold text-white">3D Model</h4>
                </div>
                {resultModelUrl && (resultModelUrl.endsWith('.glb') || resultModelUrl.endsWith('.obj')) && (
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => {
                        // Retry 3D generation
                        setResultModelUrl(null);
                        setResultFiles([]);
                        setCurrentJobId(null);
                        setProgress(0);
                        setGenerationStatus("idle");
                        setGenerationMessage("");
                        if (previewImageUrl || previewUrl) {
                          startGeneration();
                        }
                      }}
                      disabled={generating}
                      className="inline-flex items-center justify-center gap-2 rounded-xl glass hover:bg-white/10 text-white border border-white/15 py-2.5 px-5 text-sm font-medium transition-all backdrop-blur-sm hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      Retry
                    </button>
                    {resultFiles.length > 0 && (
                      <button
                        onClick={() => {
                          // Download all files
                          resultFiles.forEach((file) => {
                            if (currentJobId) {
                              const link = document.createElement('a');
                              link.href = getResultFileUrl(currentJobId, file);
                              link.download = file.split('/').pop() || 'model';
                              link.click();
                            }
                          });
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-action text-white font-bold py-2.5 px-5 text-sm transition-all shadow-[0_0_20px_rgba(112,0,255,0.3)] hover:opacity-95 hover:scale-105"
                      >
                        <Download className="h-4 w-4" />
                        Download All
                      </button>
                    )}
                  </div>
                )}
              </div>
              {resultModelUrl && (resultModelUrl.endsWith('.glb') || resultModelUrl.endsWith('.obj')) ? (
                <div className="flex flex-col items-center gap-8">
                  <div className="w-full max-w-4xl">
                    <div className="aspect-[16/9] max-h-[450px] rounded-2xl overflow-hidden bg-black/60 shadow-2xl ring-1 ring-[#00f2ff]/20">
                      <Suspense
                        fallback={
                          <div className="w-full h-full flex items-center justify-center text-white/70 text-sm">
                            Loading 3D viewer...
                          </div>
                        }
                      >
                        <LazyModelViewer3D modelUrl={resultModelUrl} />
                      </Suspense>
                    </div>
                  </div>
                  {resultFiles.length > 0 && (
                    <div className="space-y-4 w-full max-w-4xl">
                      <div className="text-sm font-semibold text-white text-center">Download Files:</div>
                      <div className="flex flex-col gap-2">
                        {resultFiles.map((file, idx) => (
                          <a
                            key={idx}
                            href={currentJobId ? getResultFileUrl(currentJobId, file) : '#'}
                            download
                            className="inline-flex items-center justify-center gap-2 text-sm glass hover:bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white/80 hover:text-white transition-all backdrop-blur-sm hover:scale-105"
                          >
                            <Download className="h-4 w-4" />
                            {file.split('/').pop()}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : generating ? (
                <div className="aspect-[16/9] max-h-[450px] max-w-4xl mx-auto rounded-2xl overflow-hidden bg-black/60 flex items-center justify-center shadow-2xl ring-1 ring-[#7000ff]/25">
                  <div className="text-center space-y-5 px-4">
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-white/20 border-t-[#00f2ff] mx-auto shadow-lg"></div>
                    <div className="text-white font-semibold text-xl">Generating 3D Model...</div>
                    <div className="text-sm text-white/70">{Math.round(progress)}% complete</div>
                    <div className="w-72 mx-auto bg-white/10 rounded-full h-2.5 shadow-inner">
                      <div
                        className="bg-gradient-to-r from-[#00f2ff] via-[#3a88ff] to-[#7000ff] h-2.5 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(0,242,255,0.35)]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <button
                      onClick={async () => {
                        // Cancel generation
                        if (currentJobId) {
                          try {
                            await cancelJob(currentJobId);
                          } catch (error) {
                            console.error("Failed to cancel job:", error);
                          }
                        }
                        setGenerating(false);
                        setProgress(0);
                        setGenerationStatus("idle");
                        setGenerationMessage("Generation cancelled");
                        setCurrentJobId(null);
                      }}
                      className="mt-4 text-sm text-white/60 hover:text-white underline transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="aspect-[16/9] max-h-[450px] max-w-4xl mx-auto rounded-2xl overflow-hidden bg-black/60 border-2 border-dashed border-white/10 flex items-center justify-center shadow-inner">
                  <div className="text-center space-y-4 px-4">
                    <div className="text-white/30 text-7xl mb-4 drop-shadow-2xl">🎭</div>
                    <p className="text-white/70 text-xl font-semibold">3D Model will appear here</p>
                    <p className="text-white/50 text-base">Click "Create 3D Model" to generate</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Details Modal (Gender/Age/Model) - lazy-loaded */}
      {showDetailsModal && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
              <div className="text-white/80 text-sm">Loading details...</div>
            </div>
          }
        >
          <LazyDetailsModal
            open={showDetailsModal}
            gender={gender}
            age={age}
            model={model}
            modelOptions={modelOptions}
            minAge={MIN_AGE}
            maxAge={MAX_AGE}
            onClose={() => setShowDetailsModal(false)}
            onGenderChange={(g) => {
              setGender(g);
              setModel(null);
              setShowPreview(false);
            }}
            onAgeChange={(val) => setAge(val)}
            onModelChange={(selectedName) => {
              setModel(selectedName);
              setShowPreview(false);
            }}
            onDone={() => {
              if (gender && age && model) {
                setShowDetailsModal(false);
                if (readyForPreview) {
                  startPreviewGeneration();
                }
              }
            }}
          />
        </Suspense>
      )}


      {/* Footer */}
      <footer className="mt-auto w-full py-8 border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/70">
          <div className="flex items-center gap-6">
            <a href="#" className="text-white/40 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-white/40 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-white/40 hover:text-white transition-colors">Contact Us</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-white/60 hover:text-white transition-colors" aria-label="Twitter"><Twitter className="h-5 w-5" /></a>
            <a href="#" className="text-white/60 hover:text-white transition-colors" aria-label="Instagram"><Instagram className="h-5 w-5" /></a>
            <a href="#" className="text-white/60 hover:text-white transition-colors" aria-label="Facebook"><Facebook className="h-5 w-5" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MagicMaker;

