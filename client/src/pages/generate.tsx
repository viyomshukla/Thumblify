import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  aspectRatios,
  dummyThumbnails,
  colorSchemes,
  thumbnailStyles,
  type AspectRatio,
  type ColorScheme,
  type ThumbnailStyle,
} from "../assets/assets";
import { PrimaryButton } from "../components/Buttons";
import {
  Monitor,
  Square,
  RectangleVertical,
  Zap,
  ChevronDown,
  ImageIcon,
  Upload,
  X,
  Sparkles,
  Crown,
  Download,
  ArrowRight,
  FileText,
  Youtube,
  Star,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { thumbnailAPI } from "../utils/api";
import DropdownChatbot from "../components/AIChatbot";
import WhatsAppConnectModal from "../components/WhatsAppConnectModal";

const styleDescriptions: Record<ThumbnailStyle, string> = {
  "Bold & Graphic": "High contrast, bold typography, striking visuals",
  Minimalist: "Clean lines, simple composition, subtle colors",
  Photorealistic: "Lifelike imagery, natural lighting, authentic feel",
  Illustrated: "Artistic illustrations, creative designs, hand-drawn style",
  "Tech/Futuristic": "Modern tech aesthetics, futuristic elements, digital vibes",
};

const Generate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Mode selection
  const [mode, setMode] = useState<"text" | "youtube">("text");

  // Common fields
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [thumbnailStyle, setThumbnailStyle] = useState<ThumbnailStyle>("Bold & Graphic");
  const [selectedColorScheme, setSelectedColorScheme] = useState<ColorScheme>(colorSchemes[0]);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const [previews, setPreviews] = useState<Array<{image_url: string, model: string, model_id: string, prompt_used: string}>>([]);
  const [savedPreviews, setSavedPreviews] = useState<Set<string>>(new Set());
  const [savingModel, setSavingModel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<"basic" | "premium">("basic");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Text mode specific
  const [title, setTitle] = useState("");
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // YouTube mode specific
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [analyzedThumbnail, setAnalyzedThumbnail] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setUploadedPhoto(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        alert("Please upload an image file");
      }
    }
  };

  const handleRemovePhoto = () => {
    setUploadedPhoto(null);
    setPhotoPreview(null);
  };

  const { user, updateCredits } = useAuth();

  const handleAnalyzeYoutube = async () => {
    if (!youtubeUrl) {
      alert("Please enter a YouTube URL");
      return;
    }

    setAnalyzing(true);
    setAnalyzedThumbnail(null);

    try {
      console.log("🔍 Analyzing YouTube video:", youtubeUrl);
      const response = await thumbnailAPI.analyzeYoutube(youtubeUrl);
      console.log("✅ Analysis Response:", response.data);

      if (response.data && response.data.thumbnailUrl) {
        setAnalyzedThumbnail(response.data.thumbnailUrl);
        console.log("✅ YouTube thumbnail loaded:", response.data.thumbnailUrl);
      } else {
        throw new Error("Invalid response format - missing thumbnail URL");
      }
    } catch (error: any) {
      console.error("❌ Analysis Error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to analyze YouTube video. Please try again.";
      alert(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      alert("Please login first");
      return;
    }

    if (mode === "text" && !title) {
      alert("Please enter a title");
      return;
    }

    if (mode === "youtube" && !youtubeUrl) {
      alert("Please enter a YouTube URL");
      return;
    }

    const requiredCredits = model === "premium" ? 20 : 10;

    if (user.credits < requiredCredits) {
      setInsufficientCredits(true);
      setShowSuccessDialog(true);
      return;
    }

    setLoading(true);
    setPreviews([]);
    setSavedPreviews(new Set());
    setInsufficientCredits(false);

    try {
      const onPreview = (preview: any) => {
        console.log(`🖼️ Received preview from ${preview.model}`);
        setPreviews((prev) => [...prev, preview]);
      };

      const onDone = (info: any) => {
        console.log("✅ All models finished:", info);
        setCreditsRemaining(info.creditsRemaining);
        updateCredits();
        setLoading(false);
        if (info.generatedCount > 0) {
          setShowSuccessDialog(true);
        }
      };

      const onError = (msg: string) => {
        console.error("❌ SSE Error:", msg);
        setLoading(false);
        alert(msg);
      };

      if (mode === "text") {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("prompt", additionalDetails);
        formData.append("color_scheme", selectedColorScheme.id);
        formData.append("aspectRatio", aspectRatio);
        formData.append("style", thumbnailStyle);
        formData.append("text_overlay", "true");
        formData.append("additionalDetails", additionalDetails);
        formData.append("model", model);

        if (uploadedPhoto) {
          formData.append("image", uploadedPhoto);
        }

        console.log("🚀 Starting SSE text generation...");
        await thumbnailAPI.generateStream(formData, onPreview, onDone, onError);
      } else {
        const improveData = {
          youtubeUrl,
          color_scheme: selectedColorScheme.id,
          aspectRatio,
          style: thumbnailStyle,
          additionalDetails,
          model,
        };

        console.log("🚀 Starting SSE YouTube improvement...");
        await thumbnailAPI.improveYoutubeStream(improveData, onPreview, onDone, onError);
      }
    } catch (error: any) {
      console.error("❌ Generation Error:", error);
      alert("Failed to generate thumbnails. Please try again.");
      setLoading(false);
    }
  };

  const handleDownload = (url?: string) => {
    const downloadUrl = url || (previews.length > 0 ? previews[0].image_url : null);
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    }
  };

  const handleSavePreview = async (preview: {image_url: string, model: string, model_id: string, prompt_used: string}) => {
    try {
      setSavingModel(preview.model_id);
      await thumbnailAPI.save({
        image_url: preview.image_url,
        model: preview.model,
        prompt_used: preview.prompt_used,
        title: title || `YouTube Thumbnail`,
        color_scheme: selectedColorScheme.id,
        aspectRatio: aspectRatio,
        style: thumbnailStyle,
        additionalDetails,
        model_id: preview.model_id,
        prompt_style: (preview as any).prompt_style,
      });
      setSavedPreviews(prev => new Set([...prev, preview.model_id]));
      console.log(`✅ Saved ${preview.model} thumbnail`);
    } catch (error: any) {
      console.error("❌ Save Error:", error);
      alert(error.response?.data?.message || "Failed to save thumbnail");
    } finally {
      setSavingModel(null);
    }
  };

  const handleGenerateAnother = () => {
    setShowSuccessDialog(false);
    setPreviews([]);
    setSavedPreviews(new Set());
    setTitle("");
    setYoutubeUrl("");
    setAdditionalDetails("");
    setUploadedPhoto(null);
    setPhotoPreview(null);
    setAnalyzedThumbnail(null);
    setCreditsRemaining(null);
  };

  const handleModeChange = (newMode: "text" | "youtube") => {
    setMode(newMode);
    setPreviews([]);
    setSavedPreviews(new Set());
    setAnalyzedThumbnail(null);
    setTitle("");
    setYoutubeUrl("");
    setUploadedPhoto(null);
    setPhotoPreview(null);
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      const thumbnailData = dummyThumbnails.find((t) => t._id === id);

      if (thumbnailData) {
        if (thumbnailData.image_url) {
          setPreviews([{ image_url: thumbnailData.image_url, model: "loaded", model_id: "loaded", prompt_used: "" }]);
        }
        setAdditionalDetails(thumbnailData.user_prompt || "");
        setTitle(thumbnailData.title);

        const colorScheme = colorSchemes.find(
          (scheme) => scheme.id === thumbnailData.color_scheme,
        );
        if (colorScheme) {
          setSelectedColorScheme(colorScheme);
        }

        setAspectRatio(thumbnailData.aspect_ratio || "16:9");
        setThumbnailStyle(thumbnailData.style || "Bold & Graphic");
      } else {
        console.log("No thumbnail found with id:", id);
      }
      setLoading(false);
    }
  }, [id]);

  // Helper function to render a single preview section
  const renderPreviewSection = (preview?: {image_url: string, model: string, model_id: string, prompt_used: string}, index?: number) => {
    const modelColors = {
      "gemini": "bg-blue-500/80",
      "flux": "bg-purple-500/80",
      "dall-e": "bg-green-500/80"
    };

    return (
      <div className="space-y-3">
        {/* Model Name Header */}
        {preview && (
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg ${
              modelColors[preview.model_id as keyof typeof modelColors] || "bg-gray-500/80"
            } text-white`}>
              {preview.model}
            </span>
            {savedPreviews.has(preview.model_id) && (
              <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-lg bg-green-500/80 text-white flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" /> Saved
              </span>
            )}
          </div>
        )}

        {/* Preview Container */}
        <div
          className={`relative w-full border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center bg-white/5 transition-all duration-300 ${
            aspectRatio === "16:9"
              ? "aspect-video"
              : aspectRatio === "1:1"
                ? "aspect-square"
                : "aspect-[9/16]"
          }`}
        >
          {preview ? (
            <img
              src={preview.image_url}
              alt={`${preview.model} generated thumbnail`}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : mode === "youtube" && analyzedThumbnail && index === 0 ? (
            <img
              src={analyzedThumbnail}
              alt="YouTube thumbnail"
              className="w-full h-full object-cover rounded-xl"
            />
          ) : mode === "text" && photoPreview && index === 0 ? (
            <img
              src={photoPreview}
              alt="Uploaded reference"
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <div className="text-center space-y-4 p-4">
              <ImageIcon className="w-12 h-12 text-gray-500 mx-auto" />
              <div className="space-y-1">
                <p className="text-white font-medium text-sm">
                  {mode === "youtube"
                    ? "Recreate your YouTube thumbnail"
                    : "Generate your first thumbnail"}
                </p>
                <p className="text-gray-400 text-xs">
                  {mode === "youtube"
                    ? "Enter URL and click Analyze"
                    : "Fill form and click Generate"}
                </p>
              </div>
            </div>
          )}

          {(loading || analyzing) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-xl">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
              <p className="text-white font-medium text-sm">
                {analyzing ? "Thumbnail Loading..." : "Generating..."}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons - Only show if preview exists */}
        {preview && (
          <div className="flex gap-2">
            <button
              onClick={() => handleSavePreview(preview)}
              disabled={savedPreviews.has(preview.model_id) || savingModel === preview.model_id}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                savedPreviews.has(preview.model_id)
                  ? "bg-green-600/20 border border-green-500/30 text-green-400 cursor-default"
                  : savingModel === preview.model_id
                    ? "bg-yellow-600/20 border border-yellow-500/30 text-yellow-400 cursor-wait"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {savedPreviews.has(preview.model_id) ? (
                <><Star className="w-4 h-4 fill-current" /> Saved</>
              ) : savingModel === preview.model_id ? (
                <>Saving...</>
              ) : (
                <><Star className="w-4 h-4" /> Save</>
              )}
            </button>

            <button
              onClick={() => handleDownload(preview.image_url)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition"
            >
              <Download className="w-4 h-4" /> Download
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel: Create Your Thumbnail Form */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {id ? "Edit Thumbnail" : "Create Your Thumbnail"}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Describe your vision and let AI bring it to life
                  </p>
                  {user && (
                    <div className="mt-2 text-sm">
                      <span className="text-yellow-400">Credits: {user.credits}</span>
                    </div>
                  )}
                </div>

                {user && (
                  <div className="flex-shrink-0">
                    <DropdownChatbot />
                  </div>
                )}
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Generation Mode
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleModeChange("text")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition ${
                      mode === "text"
                        ? "bg-indigo-500/20 border-indigo-500 text-white"
                        : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">From Text</span>
                  </button>
                  <button
                    onClick={() => handleModeChange("youtube")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition ${
                      mode === "youtube"
                        ? "bg-indigo-500/20 border-indigo-500 text-white"
                        : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    <Youtube className="w-4 h-4" />
                    <span className="text-sm font-medium">From YouTube</span>
                  </button>
                </div>
              </div>

              {/* Conditional Input Fields */}
              {mode === "text" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Title or Topic
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., 10 Tips for Better Sleep"
                      maxLength={100}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Upload Photo (optional)
                    </label>
                    {!photoPreview ? (
                      <label className="flex flex-col items-center justify-center w-full h-32 px-4 py-6 border-2 border-dashed border-white/20 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition">
                        <div className="flex flex-col items-center justify-center">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-400">
                            <span className="font-medium text-indigo-400">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                      </label>
                    ) : (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10">
                        <img src={photoPreview} alt="Uploaded photo" className="w-full h-full object-cover" />
                        <button
                          onClick={handleRemovePhoto}
                          className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 rounded-full text-white transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-xs text-white truncate">{uploadedPhoto?.name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      YouTube Video URL
                    </label>
                    <input
                      type="text"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <button
                    onClick={handleAnalyzeYoutube}
                    disabled={!youtubeUrl || analyzing}
                    className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
                  >
                    <Youtube className="w-5 h-5" />
                    {analyzing ? "Analyzing..." : "Analyze YouTube Thumbnail"}
                  </button>
                </>
              )}

              {/* Aspect Ratio */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Aspect Ratio</label>
                <div className="flex gap-3">
                  {aspectRatios.map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition ${
                        aspectRatio === ratio
                          ? "bg-indigo-500/20 border-indigo-500 text-white"
                          : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      {ratio === "16:9" && <Monitor className="w-4 h-4" />}
                      {ratio === "1:1" && <Square className="w-4 h-4" />}
                      {ratio === "9:16" && <RectangleVertical className="w-4 h-4" />}
                      <span className="text-sm font-medium">{ratio}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Thumbnail Style */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">Thumbnail Style</label>
                <button
                  onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white flex items-center justify-between hover:border-white/20 transition"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span>{thumbnailStyle}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isStyleDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                <p className="text-xs text-gray-500 mt-1">{styleDescriptions[thumbnailStyle]}</p>
                {isStyleDropdownOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
                    {thumbnailStyles.map((style) => (
                      <button
                        key={style}
                        onClick={() => {
                          setThumbnailStyle(style);
                          setIsStyleDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4 text-indigo-400" />
                        <span>{style}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Color Scheme */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Color Scheme</label>
                <div className="grid grid-cols-5 gap-3">
                  {colorSchemes.map((scheme) => (
                    <button
                      key={scheme.id}
                      onClick={() => setSelectedColorScheme(scheme)}
                      className={`relative aspect-square rounded-xl border-2 transition hover:scale-105 ${
                        selectedColorScheme.id === scheme.id
                          ? "border-white ring-2 ring-indigo-500"
                          : "border-white/20"
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${scheme.colors[0]} 0%, ${scheme.colors[1]} 50%, ${scheme.colors[2]} 100%)`,
                      }}
                      title={scheme.name}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Selected: {selectedColorScheme.name}</p>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Model</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setModel("basic")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition ${
                      model === "basic"
                        ? "bg-indigo-500/20 border-indigo-500 text-white"
                        : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Basic</div>
                      <div className="text-xs opacity-75">5 credits</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setModel("premium")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition ${
                      model === "premium"
                        ? "bg-indigo-500/20 border-indigo-500 text-white"
                        : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    <Crown className="w-4 h-4" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Premium</div>
                      <div className="text-xs opacity-75">10 credits</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Additional Details (optional)
                  </label>
                  <textarea
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    placeholder="Add any specific elements, mood, or style preferences..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition resize-none"
                  />
                </div>

                {user && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setShowWhatsAppModal(true)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition flex-1"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Connect WhatsApp
                    </button>
                  </div>
                )}

                <WhatsAppConnectModal
                  isOpen={showWhatsAppModal}
                  onClose={() => setShowWhatsAppModal(false)}
                />
              </div>

              {/* Generate Button */}
              <PrimaryButton
                onClick={handleGenerate}
                disabled={(mode === "text" && !title) || (mode === "youtube" && !youtubeUrl) || loading}
                className="w-full"
              >
                {loading ? "Generating..." : id ? "Regenerate Thumbnail" : "Generate Thumbnail"}
              </PrimaryButton>
            </div>

            {/* Right Panel: 3 Separate Preview Sections */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                Preview — 3 AI Models
              </h2>

              {/* Progressive display: show previews that have arrived + placeholders for remaining */}
              <div className="space-y-6">
                {/* Show a status bar when loading */}
                {loading && (
                  <div className="flex items-center gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
                    <p className="text-white text-sm font-medium">
                      Generating... {previews.length}/3 ready
                    </p>
                  </div>
                )}

                {/* Hint when nothing is happening yet */}
                {!loading && previews.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-indigo-400 text-sm">
                      3 AI models will generate different variations
                    </p>
                  </div>
                )}

                {/* Already-arrived previews */}
                {previews.map((preview, index) => (
                  <div key={preview.model_id}>
                    {renderPreviewSection(preview, index)}
                  </div>
                ))}

                {/* Empty placeholder slots for models still generating */}
                {(loading || previews.length === 0) &&
                  Array.from({ length: 3 - previews.length }).map((_, i) => (
                    <div key={`placeholder-${i}`}>
                      {renderPreviewSection(undefined, previews.length + i)}
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS/INSUFFICIENT CREDITS DIALOG */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md w-full space-y-6">
            <div className="text-center">
              {insufficientCredits ? (
                <>
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Insufficient Credits</h3>
                  <p className="text-gray-400">
                    You need {model === "premium" ? "20" : "10"} credits to generate thumbnails.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {previews.length} Thumbnails Generated!
                  </h3>
                  <p className="text-gray-400">
                    Your thumbnails have been created. Save your favorites below!
                  </p>
                </>
              )}
            </div>

            {creditsRemaining !== null && !insufficientCredits && (
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-400">Credits Remaining</p>
                <p className="text-3xl font-bold text-yellow-400">{creditsRemaining}</p>
              </div>
            )}

            <div className="space-y-3">
              {!insufficientCredits && previews.length > 0 && (
                <>
                  <button
                    onClick={() => setShowSuccessDialog(false)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition"
                  >
                    <Star className="w-5 h-5" />
                    View & Save Favorites
                  </button>

                  <button
                    onClick={handleGenerateAnother}
                    className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition"
                  >
                    Generate Another
                  </button>

                  <button
                    onClick={() => navigate("/community")}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition"
                  >
                    View My Thumbnails
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {insufficientCredits && (
                <>
                  <button
                    onClick={() => {
                      setShowSuccessDialog(false);
                      navigate("/#pricing");
                    }}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition"
                  >
                    <Crown className="w-5 h-5" />
                    Get More Credits
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setShowSuccessDialog(false)}
                    className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Generate;