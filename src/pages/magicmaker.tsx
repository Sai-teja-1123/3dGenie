import ModelViewer3D from "@/components/ModelViewer3D";
import { Upload, ArrowLeft, Twitter, Instagram, Facebook, Trash, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaMale, FaFemale } from "react-icons/fa";
import * as XLSX from "xlsx";
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

const MagicMaker = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [boysList, setBoysList] = useState<string[]>([]);
  const [girlsList, setGirlsList] = useState<string[]>([]);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropScale, setCropScale] = useState(1.0);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const cropContainerRef = useRef<HTMLDivElement | null>(null);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; size: number }>({ x: 150, y: 150, size: 300 });
  const [minZoom, setMinZoom] = useState(0.1);
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

  const modelOptions: string[] = gender === "male" ? boysList : gender === "female" ? girlsList : [...boysList, ...girlsList];

  const MIN_AGE = 1;
  const MAX_AGE = 16;

  const renderCrop = () => {
    const canvas = cropCanvasRef.current;
    const img = cropImgRef.current;
    const container = cropContainerRef.current;
    if (!canvas || !img || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Get actual container size (use full dimensions, not just minimum)
    const rect = container.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    
    if (containerWidth <= 0 || containerHeight <= 0) return; // Wait for valid size
    
    // Set canvas size to match container (use device pixel ratio for quality)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    
    // Reset transform and scale for high DPI
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    
    // Clear and fill background
    ctx.clearRect(0, 0, containerWidth, containerHeight);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, containerWidth, containerHeight);
    
    // Calculate image dimensions
    const iw = img.naturalWidth * cropScale;
    const ih = img.naturalHeight * cropScale;
    
    // Center the image with offset
    const cx = containerWidth / 2 + cropOffset.x;
    const cy = containerHeight / 2 + cropOffset.y;
    const dx = cx - iw / 2;
    const dy = cy - ih / 2;
    
    // Draw the image
    ctx.drawImage(img, dx, dy, iw, ih);
  };

  useEffect(() => { 
    if (cropOpen) {
      // Resize canvas when container size changes
      const resizeObserver = new ResizeObserver(() => {
        const container = cropContainerRef.current;
        const img = cropImgRef.current;
        if (container && img) {
          const rect = container.getBoundingClientRect();
          const containerWidth = rect.width;
          const containerHeight = rect.height;
          if (containerWidth > 0 && containerHeight > 0) {
            // Recalculate min zoom when container resizes
            const scaleToFitWidth = containerWidth / img.naturalWidth;
            const scaleToFitHeight = containerHeight / img.naturalHeight;
            const scaleToFit = Math.min(scaleToFitWidth, scaleToFitHeight);
            const calculatedMinZoom = scaleToFit * 0.5;
            setMinZoom(Math.max(0.05, calculatedMinZoom));
          }
        }
        renderCrop();
      });
      const container = cropContainerRef.current;
      if (container) {
        resizeObserver.observe(container);
        renderCrop(); // Initial render
        return () => resizeObserver.disconnect();
      }
    }
  }, [cropScale, cropOffset, cropOpen]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-white/5 backdrop-blur-xl bg-[#0f172a]/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 px-4 py-2 text-sm border border-white/10 backdrop-blur-sm transition-all hover:scale-105 hover:shadow-lg hover:shadow-white/5"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          <div className="text-3xl sm:text-4xl font-black tracking-[0.25em] italic">
            <span className="bg-gradient-to-r from-fuchsia-300 via-white to-sky-300 bg-clip-text text-transparent drop-shadow-2xl">3DGENI</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="p-[2px] rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-400 to-sky-400 shadow-lg shadow-fuchsia-500/20"
              title={user?.name || "Profile"}
            >
              <div className="h-10 w-10 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-extrabold tracking-wide shadow-inner">
                {(user?.name || "U").split("@")[0].slice(0,1).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full" style={{ scrollBehavior: 'smooth' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-8 text-white tracking-[0.02em] text-center">
            <span className="inline-block transform-gpu bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent" style={{
              textShadow: `
                0 2px 4px rgba(0, 0, 0, 0.3),
                0 4px 8px rgba(0, 0, 0, 0.2),
                0 8px 16px rgba(0, 0, 0, 0.1),
                0 0 30px rgba(255, 255, 255, 0.15)
              `,
              transform: 'perspective(500px) rotateX(5deg)',
              display: 'inline-block',
              letterSpacing: '0.03em'
            }}>
              Transform your child's imagination into 3D magic!
            </span>
          </h1>

          {/* Top Section: Upload (Left) and Preview (Right) */}
          <div className="flex justify-center mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full" style={{ maxWidth: '90%' }}>
            {/* Left: Upload Photo */}
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.4),0_6px_24px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-white/20 focus-within:ring-2 focus-within:ring-white/20 focus-within:outline-none">
              <div className="mb-5">
                <div className="font-bold text-white text-lg mb-1 tracking-wide" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}>Upload any picture</div>
                <div className="text-sm text-white/60 tracking-normal">Select from your device</div>
              </div>
              
              {/* Photo Preview Area */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-200 via-orange-200 to-sky-200 flex items-center justify-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] ring-1 ring-white/10 max-h-[60vh]">
                {previewUrl ? (
                  <img src={previewUrl} alt="Upload preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center flex flex-col items-center justify-center h-full">
                    <div className="text-black/60 text-sm mb-3">Upload preview</div>
                    <button
                      className="inline-flex items-center gap-2 rounded-xl bg-white text-[#0f172a] hover:bg-white/90 px-5 py-2.5 text-sm font-bold shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent"
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
                      className="absolute top-3 right-3 inline-flex items-center justify-center h-9 w-9 rounded-xl bg-black/80 hover:bg-red-600/90 text-white transition-all shadow-lg hover:scale-110 backdrop-blur-sm"
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
                      className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-xl bg-black/80 hover:bg-black/90 text-white px-3 py-1.5 text-xs font-medium transition-all shadow-lg hover:scale-105 backdrop-blur-sm"
                      onClick={() => {
                        setCropOpen(true);
                        if (rawImageUrl) {
                          setTimeout(() => {
                            const img = new Image();
                            img.onload = () => {
                              cropImgRef.current = img;
                              const container = cropContainerRef.current;
                              if (container) {
                                const initCrop = () => {
                                  const rect = container.getBoundingClientRect();
                                  const containerWidth = rect.width;
                                  const containerHeight = rect.height;
                                  
                                  if (containerWidth <= 0 || containerHeight <= 0) {
                                    setTimeout(initCrop, 50);
                                    return;
                                  }
                                  
                                  const scaleToFitWidth = containerWidth / img.naturalWidth;
                                  const scaleToFitHeight = containerHeight / img.naturalHeight;
                                  const scaleToFit = Math.min(scaleToFitWidth, scaleToFitHeight);
                                  const calculatedMinZoom = scaleToFit * 0.3;
                                  const finalMinZoom = Math.max(0.05, calculatedMinZoom);
                                  setMinZoom(finalMinZoom);
                                  const initialScale = scaleToFit * 0.95;
                                  setCropScale(initialScale);
                                  setCropOffset({ x: 0, y: 0 });
                                  const containerSize = Math.min(containerWidth, containerHeight);
                                  const cropSize = containerSize * 0.6;
                                  const cropX = (containerWidth - cropSize) / 2;
                                  const cropY = (containerHeight - cropSize) / 2;
                                  setCropRect({ x: cropX, y: cropY, size: cropSize });
                                  renderCrop();
                                };
                                initCrop();
                              }
                            };
                            img.src = rawImageUrl;
                          }, 100);
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
                      setTimeout(() => {
                        const img = new Image();
                        img.onload = () => {
                          cropImgRef.current = img;
                          const container = cropContainerRef.current;
                          if (container) {
                            const initCrop = () => {
                              const rect = container.getBoundingClientRect();
                              const containerWidth = rect.width;
                              const containerHeight = rect.height;
                              
                              if (containerWidth <= 0 || containerHeight <= 0) {
                                setTimeout(initCrop, 50);
                                return;
                              }
                              
                              const scaleToFitWidth = containerWidth / img.naturalWidth;
                              const scaleToFitHeight = containerHeight / img.naturalHeight;
                              const scaleToFit = Math.min(scaleToFitWidth, scaleToFitHeight);
                              const calculatedMinZoom = scaleToFit * 0.3;
                              const finalMinZoom = Math.max(0.05, calculatedMinZoom);
                              setMinZoom(finalMinZoom);
                              const initialScale = scaleToFit * 0.95;
                              setCropScale(initialScale);
                              setCropOffset({ x: 0, y: 0 });
                              const containerSize = Math.min(containerWidth, containerHeight);
                              const cropSize = containerSize * 0.6;
                              const cropX = (containerWidth - cropSize) / 2;
                              const cropY = (containerHeight - cropSize) / 2;
                              setCropRect({ x: cropX, y: cropY, size: cropSize });
                              renderCrop();
                            };
                            initCrop();
                          }
                        };
                        img.src = url;
                      }, 100);
                    }
                  }}
                />
              </div>
            </div>

            {/* Right: Preview Image */}
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.4),0_6px_24px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-white/20 focus-within:ring-2 focus-within:ring-white/20 focus-within:outline-none">
              <div className="mb-5">
                <div className="font-bold text-white text-lg mb-1 tracking-wide" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}>Choose a fun cartoon style</div>
                <div className="text-sm text-white/60 tracking-normal">Pick a style that suits your child's personality</div>
              </div>
              
              <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-purple-200 via-pink-200 to-orange-200 flex items-center justify-center relative mb-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] ring-1 ring-white/10 max-h-[60vh]">
                {previewGenerating ? (
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                    <div className="text-white font-medium">Generating preview... {Math.round(previewProgress)}%</div>
                    <div className="w-48 bg-white/20 rounded-full h-2 mx-auto">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
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
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
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
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 py-2.5 px-4 text-sm font-medium transition-all backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent ${
                      (previewImageUrl || previewUrl)
                        ? "bg-white/10 hover:bg-white/20 text-white hover:scale-105 hover:shadow-lg"
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
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 py-2.5 px-4 text-sm font-medium transition-all backdrop-blur-sm hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
            </div>
          </div>


          {/* Crop Modal */}
          {cropOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-4xl max-h-[90vh] bg-[#0b1222]/95 backdrop-blur-xl text-white rounded-3xl border border-white/10 p-6 sm:p-8 select-none flex flex-col shadow-2xl shadow-black/50 overflow-y-auto">
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                  <div>
                    <h3 className="text-xl font-extrabold tracking-wide" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.3)' }}>Crop to Select Face</h3>
                    <p className="text-sm text-white/60 mt-1">Adjust the crop area to focus on the face</p>
                  </div>
                  <button className="text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10 p-2" onClick={() => setCropOpen(false)}>Close</button>
                </div>
                <div
                  ref={cropContainerRef}
                  className="relative w-full flex-1 min-h-0 rounded-2xl overflow-hidden bg-black/70 border border-white/10 select-none shadow-2xl ring-1 ring-white/5"
                  style={{ minHeight: '400px', maxHeight: 'calc(90vh - 200px)', aspectRatio: '4 / 3' }}
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
                      const maxWidth = rect.width;
                      const maxHeight = rect.height;
                      const maxSize = Math.min(maxWidth, maxHeight);
                      
                      if (cropDragMode === "move") {
                        px = Math.max(0, Math.min(maxWidth - size, px + dx));
                        py = Math.max(0, Math.min(maxHeight - size, py + dy));
                        return { x: px, y: py, size };
                      }
                      // Resize keeping square
                      if (cropDragMode === "nw") {
                        px += dx; py += dy; size -= Math.max(dx, dy);
                      } else if (cropDragMode === "ne") {
                        py += dy; size -= Math.max(-dx, dy);
                      } else if (cropDragMode === "sw") {
                        px += dx; size -= Math.max(dx, -dy);
                      } else if (cropDragMode === "se") {
                        size += Math.max(dx, dy);
                      }
                      size = Math.max(50, Math.min(maxSize, size));
                      px = Math.max(0, Math.min(maxWidth - size, px));
                      py = Math.max(0, Math.min(maxHeight - size, py));
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
                <div className="mt-4 flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-white/60">Zoom</span>
                  <input
                    type="range"
                    min={minZoom}
                    max={3}
                    step={0.02}
                    value={cropScale}
                    onChange={(e) => setCropScale(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3 flex-shrink-0">
                  <button className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl px-6 py-3 font-medium transition-all hover:scale-105 hover:shadow-lg backdrop-blur-sm" onClick={() => setCropOpen(false)}>Cancel</button>
                  <button
                    className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl px-8 py-3 transition-all hover:scale-105 hover:shadow-xl hover:shadow-yellow-400/30"
                    onClick={() => {
                      const viewCanvas = cropCanvasRef.current;
                      const img = cropImgRef.current;
                      const container = cropContainerRef.current;
                      if (!viewCanvas || !img || !container) return;
                      
                      const rect = container.getBoundingClientRect();
                      const containerWidth = rect.width;
                      const containerHeight = rect.height;
                      
                      const exportCanvas = document.createElement("canvas");
                      exportCanvas.width = 600; exportCanvas.height = 600;
                      const ctx = exportCanvas.getContext("2d");
                      if (!ctx) return;
                      
                      const iw = img.naturalWidth * cropScale;
                      const ih = img.naturalHeight * cropScale;
                      const cx = containerWidth / 2 + cropOffset.x;
                      const cy = containerHeight / 2 + cropOffset.y;
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
                        // Open details modal after crop
                        setShowDetailsModal(true);
                      }, "image/jpeg", 0.92);
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {previewUrl && (
            <div className="flex gap-4 mb-8 justify-center">
              <button
                type="button"
                onClick={startGeneration}
                disabled={!previewUrl || generating}
                className={`inline-flex items-center justify-center rounded-2xl px-10 py-5 font-extrabold text-lg transition-all shadow-[0_8px_24px_rgba(0,0,0,0.3)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${
                  previewUrl && !generating
                    ? "bg-yellow-400 text-[#0f172a] hover:bg-yellow-300 hover:scale-105 hover:shadow-[0_12px_32px_rgba(234,179,8,0.4)] focus:ring-yellow-400/50"
                    : "bg-white/10 text-white/40 cursor-not-allowed focus:ring-white/20"
                } ${generating ? "animate-pulse shadow-yellow-400/30" : ""}`}
              >
                {generating ? `Creating 3D Model... ${Math.round(progress)}%` : "Create 3D Model"}
              </button>
            </div>
          )}

          {/* 3D Model Viewer */}
          {previewUrl && (
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2)]">
              <div className="flex items-center justify-center mb-6">
                <h4 className="text-xl font-extrabold text-white tracking-wide" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.3)' }}>3D Model</h4>
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
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 py-2.5 px-5 text-sm font-medium transition-all backdrop-blur-sm hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2.5 px-5 text-sm transition-all shadow-lg hover:scale-105 hover:shadow-yellow-400/30"
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
                    <div className="aspect-[16/9] max-h-[450px] rounded-2xl overflow-hidden bg-black/60 shadow-2xl ring-1 ring-white/10">
                      <ModelViewer3D modelUrl={resultModelUrl} />
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
                            className="inline-flex items-center justify-center gap-2 text-sm bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-3 text-white/80 hover:text-white transition-all backdrop-blur-sm hover:scale-105 hover:shadow-lg"
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
                <div className="aspect-[16/9] max-h-[450px] max-w-4xl mx-auto rounded-2xl overflow-hidden bg-black/60 flex items-center justify-center shadow-2xl ring-1 ring-white/10">
                  <div className="text-center space-y-5 px-4">
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-white/20 border-t-yellow-400 mx-auto shadow-lg"></div>
                    <div className="text-white font-semibold text-xl">Generating 3D Model...</div>
                    <div className="text-sm text-white/70">{Math.round(progress)}% complete</div>
                    <div className="w-72 mx-auto bg-white/10 rounded-full h-2.5 shadow-inner">
                      <div
                        className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 h-2.5 rounded-full transition-all duration-300 shadow-lg shadow-yellow-400/30"
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

      {/* Details Modal (Gender/Age/Model) */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0b1222]/95 backdrop-blur-xl text-white rounded-3xl border border-white/10 p-8 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold tracking-tight">Select Character Details</h3>
              <button className="text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10 p-2" onClick={() => setShowDetailsModal(false)}>Close</button>
            </div>
            
            <div className="space-y-6">
              {/* Gender Selection */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-3">Select Gender</label>
                <div className="flex gap-4">
                  <button
                    className={`flex-1 flex flex-col items-center justify-center px-4 py-5 rounded-2xl border-2 transition-all backdrop-blur-sm ${
                      gender === 'male' 
                        ? 'bg-yellow-400/20 border-yellow-400 text-yellow-300 scale-105 shadow-lg shadow-yellow-400/20' 
                        : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10 hover:scale-105 hover:shadow-lg'
                    }`}
                    onClick={() => {
                      setGender('male');
                      setModel(null);
                      setShowPreview(false);
                    }}
                    type="button"
                  >
                    <FaMale className="text-3xl mb-2" />
                    <span className="text-sm font-medium">Boy</span>
                  </button>
                  <button
                    className={`flex-1 flex flex-col items-center justify-center px-4 py-5 rounded-2xl border-2 transition-all backdrop-blur-sm ${
                      gender === 'female' 
                        ? 'bg-pink-400/20 border-pink-400 text-pink-300 scale-105 shadow-lg shadow-pink-400/20' 
                        : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10 hover:scale-105 hover:shadow-lg'
                    }`}
                    onClick={() => {
                      setGender('female');
                      setModel(null);
                      setShowPreview(false);
                    }}
                    type="button"
                  >
                    <FaFemale className="text-3xl mb-2" />
                    <span className="text-sm font-medium">Girl</span>
                  </button>
                </div>
              </div>

              {/* Age Selection */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Age (years)</label>
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
                  className="w-full border border-white/20 bg-white/5 backdrop-blur-sm text-white rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all shadow-inner"
                  placeholder={`Enter age (${MIN_AGE}-${MAX_AGE})`}
                  maxLength={2}
                  inputMode="numeric"
                />
                <div className="text-xs text-white/50 mt-1">Ages {MIN_AGE} to {MAX_AGE} only</div>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Choose Character</label>
                <select
                  value={model || ""}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    if (selectedName) {
                      setModel(selectedName);
                      setShowPreview(false);
                      if (promptsLoaded) {
                        const normalizeName = (name: string): string => {
                          return name
                            .toLowerCase()
                            .replace(/\s*-\s*/g, " ")
                            .replace(/\s+/g, " ")
                            .trim();
                        };
                        
                        let prompt = promptsMap.get(selectedName.toLowerCase());
                        
                        if (!prompt) {
                          const normalized = normalizeName(selectedName);
                          prompt = promptsMap.get(normalized);
                        }
                        
                        const nameVariations: Record<string, string[]> = {
                          "elsa": ["elsa", "elsa - frozen"],
                          "anna": ["anna", "anna- frozen"],
                          "ariel": ["ariel", "little mermaid"],
                          "belle": ["belle", "belle - beauty and the beast"],
                        };
                        
                        if (!prompt) {
                          const lowerName = selectedName.toLowerCase();
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
                          const defaultPrompt = `Create a 3D character model inspired by ${selectedName}. Make it vibrant, playful, and suitable for children.`;
                          setCustomNotes(defaultPrompt);
                        }
                      }
                    } else {
                      setModel(null);
                      setShowPreview(false);
                    }
                  }}
                  disabled={!gender || !promptsLoaded}
                  className="w-full border border-white/20 bg-white/5 backdrop-blur-sm text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-inner"
                >
                  <option value="">{!gender ? "Select gender first" : !promptsLoaded ? "Loading characters..." : "Choose a character"}</option>
                  {modelOptions.map((characterName) => (
                    <option key={characterName} value={characterName} className="bg-[#0f172a] text-white">
                      {characterName}
                    </option>
                  ))}
                </select>
                {!gender && (
                  <div className="text-xs text-white/50 mt-2">Please select gender first</div>
                )}
              </div>

              {/* Done Button */}
              <div className="flex justify-end gap-3 pt-6">
                <button
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl px-6 py-3 font-medium transition-all hover:scale-105 hover:shadow-lg backdrop-blur-sm"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl px-8 py-3 transition-all hover:scale-105 hover:shadow-xl hover:shadow-yellow-400/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  onClick={() => {
                    if (gender && age && model) {
                      setShowDetailsModal(false);
                      // Auto-generate preview
                      if (readyForPreview) {
                        startPreviewGeneration();
                      }
                    }
                  }}
                  disabled={!gender || !age || !model}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


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

