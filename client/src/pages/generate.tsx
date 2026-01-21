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
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { thumbnailAPI } from "../utils/api";

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
  const [title, setTitle] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [thumbnailStyle, setThumbnailStyle] = useState<ThumbnailStyle>("Bold & Graphic");
  const [selectedColorScheme, setSelectedColorScheme] = useState<ColorScheme>(colorSchemes[0]);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<"basic" | "premium">("basic");
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [insufficientCredits, setInsufficientCredits] = useState(false);

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

  const handleGenerate = async () => {
    if (!user) {
      alert("Please login first");
      return;
    }

    const requiredCredits = model === "premium" ? 10 : 5;

    if (user.credits < requiredCredits) {
      setInsufficientCredits(true);
      setShowSuccessDialog(true);
      return;
    }

    setLoading(true);
    setThumbnail(null); // ✅ Clear previous thumbnail
    setInsufficientCredits(false); // ✅ Reset flag
    
    try {
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

      console.log("🚀 Sending generation request...");
      console.log("📝 Title:", title);
      console.log("🎨 Style:", thumbnailStyle);
      console.log("🎨 Color Scheme:", selectedColorScheme.id);
      console.log("📐 Aspect Ratio:", aspectRatio);
      console.log("💳 Model:", model);
      console.log("📸 Has Photo:", !!uploadedPhoto);

      const response = await thumbnailAPI.generate(formData);
      
      console.log("✅ Full Response:", response);
      console.log("✅ Response Data:", response.data);
      
      if (response.data && response.data.thumbnail && response.data.thumbnail.image_url) {
        setThumbnail(response.data.thumbnail.image_url);
        setCreditsRemaining(response.data.creditsRemaining);
        await updateCredits();
        setShowSuccessDialog(true);
        
        console.log("✅ Thumbnail URL:", response.data.thumbnail.image_url);
        console.log("💰 Credits Remaining:", response.data.creditsRemaining);
      } else {
        console.error("❌ Invalid response structure:", response.data);
        throw new Error("Invalid response format - missing thumbnail data");
      }

    } catch (error: any) {
      console.error("❌ Generation Error:", error);
      console.error("❌ Error Response:", error.response);
      console.error("❌ Error Data:", error.response?.data);
      console.error("❌ Error Status:", error.response?.status);
      console.error("❌ Error Headers:", error.response?.headers);
      console.error("❌ Error Message:", error.message);
      
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        "Failed to generate thumbnail. Please try again.";
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (thumbnail) {
      window.open(thumbnail, "_blank");
    }
  };

  const handleGenerateAnother = () => {
    setShowSuccessDialog(false);
    setThumbnail(null);
    setTitle("");
    setAdditionalDetails("");
    setUploadedPhoto(null);
    setPhotoPreview(null);
    setCreditsRemaining(null);
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      const thumbnailData = dummyThumbnails.find(
        (thumbnail) => thumbnail._id === id,
      );

      if (thumbnailData) {
        setThumbnail(thumbnailData.image_url);
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

  return (
    <>
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel: Create Your Thumbnail Form */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {id ? "Edit Thumbnail" : "Create Your Thumbnail"}
                </h2>
                <p className="text-gray-400 text-sm">
                  Describe your vision and let AI bring it to life
                </p>
                {user && (
                  <div className="mt-2 text-sm">
                    <span className="text-yellow-400">
                      Credits: {user.credits}
                    </span>
                  </div>
                )}
              </div>

              {/* Title Input */}
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

              {/* Aspect Ratio Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Aspect Ratio
                </label>
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

              {/* Thumbnail Style Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Thumbnail Style
                </label>
                <button
                  onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white flex items-center justify-between hover:border-white/20 transition"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span>{thumbnailStyle}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isStyleDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  {styleDescriptions[thumbnailStyle]}
                </p>
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

              {/* Color Scheme Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Color Scheme
                </label>
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
                <p className="text-xs text-gray-500 mt-2">
                  Selected: {selectedColorScheme.name}
                </p>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Model
                </label>
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

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Photo (optional)
                </label>
                {!photoPreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 px-4 py-6 border-2 border-dashed border-white/20 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition">
                    <div className="flex flex-col items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-400">
                        <span className="font-medium text-indigo-400">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                ) : (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10">
                    <img
                      src={photoPreview}
                      alt="Uploaded photo"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={handleRemovePhoto}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 rounded-full text-white transition"
                      aria-label="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-xs text-white truncate">
                        {uploadedPhoto?.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Details */}
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

              {/* Generate Button */}
              <PrimaryButton
                onClick={handleGenerate}
                disabled={!title || loading}
                className="w-full"
              >
                {loading
                  ? "Generating..."
                  : id
                    ? "Regenerate Thumbnail"
                    : "Generate Thumbnail"}
              </PrimaryButton>
            </div>

            {/* Right Panel: Preview */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Preview</h2>
              <div
                className={`relative w-full border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center bg-white/5 transition-all duration-300 ${
                  aspectRatio === "16:9"
                    ? "aspect-video"
                    : aspectRatio === "1:1"
                      ? "aspect-square"
                      : "aspect-[9/16]"
                }`}
              >
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt="Generated thumbnail"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Uploaded reference"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="text-center space-y-4">
                    <ImageIcon className="w-16 h-16 text-gray-500 mx-auto" />
                    <div className="space-y-1">
                      <p className="text-white font-medium">
                        Generate your first thumbnail
                      </p>
                      <p className="text-gray-400 text-sm">
                        Fill out the form and click Generate
                      </p>
                    </div>
                  </div>
                )}
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ SUCCESS/INSUFFICIENT CREDITS DIALOG */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md w-full space-y-6">
            <div className="text-center">
              {insufficientCredits ? (
                <>
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Insufficient Credits
                  </h3>
                  <p className="text-gray-400">
                    You need {model === "premium" ? "10" : "5"} credits to generate this thumbnail.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Thumbnail Generated!
                  </h3>
                  <p className="text-gray-400">
                    Your thumbnail has been created successfully.
                  </p>
                </>
              )}
            </div>

            {creditsRemaining !== null && !insufficientCredits && (
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-400">Credits Remaining</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {creditsRemaining}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {!insufficientCredits && thumbnail && (
                <>
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition"
                  >
                    <Download className="w-5 h-5" />
                    Download Thumbnail
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
                    View Community
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