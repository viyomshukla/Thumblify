import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { type IThumbnail } from "../assets/assets";
import SoftBackdrop from "../components/SoftBackdrop";
import { useAuth } from "../contexts/AuthContext";
import { userAPI, thumbnailAPI } from "../utils/api";
import { Trash2, Download } from "lucide-react";

const Community = () => {
    const { user } = useAuth();
    const [thumbnails, setThumbnails] = useState<IThumbnail[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchThumbnails = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const response = await userAPI.getThumbnails();
                setThumbnails(response.data.thumbnails);
            } catch (error) {
                console.error('Failed to fetch thumbnails:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchThumbnails();
    }, [user]);

 const handleDownload = async (imageUrl: string | undefined, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!imageUrl) return;

    try {
        console.log("Starting download...");
        
        // 1. Fetch the image data
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        // 2. Create a temporary local URL for the blob
        const url = window.URL.createObjectURL(blob);

        // 3. Create a hidden anchor element
        const link = document.createElement("a");
        link.href = url;
        
        // 4. Set the filename (extract from URL or use a default)
        const filename = imageUrl.split('/').pop() || "downloaded-image.png";
        link.setAttribute("download", filename);

        // 5. Append, click, and cleanup
        document.body.appendChild(link);
        link.click();
        
        // Cleanup to prevent memory leaks
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log("✅ Download successful");
    } catch (error) {
        console.error("❌ Download failed:", error);
        // Fallback: if fetch fails (CORS), try opening in a new tab as a last resort
        window.open(imageUrl, "_blank");
    }
};

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Confirm before deleting
        const confirmed = window.confirm("Are you sure you want to delete this thumbnail?");
        if (!confirmed) return;

        setDeletingId(id);
        try {
            const response = await thumbnailAPI.delete(id);
            if (response.data.success) {
                // Remove from UI
                setThumbnails(thumbnails.filter(thumb => thumb._id !== id));
                console.log('✅ Thumbnail deleted successfully');
            }
        } catch (error) {
            console.error('❌ Failed to delete thumbnail:', error);
            alert('Failed to delete thumbnail. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <SoftBackdrop />
            <div className="mt-32 min-h-screen px-6 md:px-6 lg:px-24 xl:px-32">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-white">My Generated Thumbnails</h1>
                    <br />
                    <p className="text-gray-400 text-xl">View and manage all the thumbnails you have generated.</p>
                </div>
                <br />
                <br />

                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="w-full h-48 bg-gray-800 rounded-lg animate-pulse"></div>
                        ))}
                    </div>
                )}

                {!loading && thumbnails.length === 0 && (
                    <div className="text-center py-24">
                        <h3 className="text-lg font-semibold text-zinc-200">Create your First Thumbnail</h3>
                        <p className="text-sm text-zinc-400 mt-2">Generate your First Thumbnail To see it</p>
                    </div>
                )}

                {!loading && thumbnails.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                        {thumbnails.map((thumbnail) => (
                            <Link
                                key={thumbnail._id}
                                to={`/generate/${thumbnail._id}`}
                                className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:scale-105 cursor-pointer"
                            >
                                {/* Delete Button - Top Right */}
                                <button
                                    onClick={(e) => handleDelete(thumbnail._id, e)}
                                    disabled={deletingId === thumbnail._id}
                                    className="absolute top-3 right-3 z-10 bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-lg backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                    title="Delete thumbnail"
                                >
                                    {deletingId === thumbnail._id ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 size={16} />
                                    )}
                                </button>

                                <div className="relative aspect-video w-full overflow-hidden">
                                    {thumbnail.image_url ? (
                                        <img
                                            src={thumbnail.image_url}
                                            alt={thumbnail.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                            <span className="text-gray-500">No Image</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="absolute bottom-0 left-0 right-0 p-4">
                                            <p className="text-white text-sm font-medium line-clamp-2">{thumbnail.title}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs text-gray-300 bg-white/10 px-2 py-1 rounded">
                                                    {thumbnail.style}
                                                </span>
                                                {thumbnail.aspect_ratio && (
                                                    <span className="text-xs text-gray-300 bg-white/10 px-2 py-1 rounded">
                                                        {thumbnail.aspect_ratio}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <h3 className="text-white font-medium text-sm line-clamp-1 group-hover:text-indigo-400 transition-colors">
                                        {thumbnail.title}
                                    </h3>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-gray-400">
                                            {thumbnail.style}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => handleDownload(thumbnail.image_url || "", e)}
                                                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                            >
                                                <Download size={14} />
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default Community;