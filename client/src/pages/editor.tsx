import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Sliders, Wind, Crop, Check, Wand2, Image as ImageIcon } from 'lucide-react';
import ImageEditor from 'tui-image-editor';
import 'tui-image-editor/dist/tui-image-editor.css';

const ThumbnailEditor = () => {
  const canvasRef = useRef(null);
  const tuiEditorRef = useRef(null);
  const tuiContainerRef = useRef(null);
  
  const [imageState, setImageState] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [showTuiEditor, setShowTuiEditor] = useState(false);
  const [tuiResult, setTuiResult] = useState(null);
  
  const [adjust, setAdjust] = useState({
    brightness: 100,
    contrast: 100,
    temperature: 0,
    blur: 0,
  });

  const [filter, setFilter] = useState('none');
  const [watermark] = useState('THUMBLIFY AI');
  const [cropArea, setCropArea] = useState({ x: 50, y: 50, width: 400, height: 300 });

  const filters = {
    none: '',
    fresh: 'saturate(1.2) brightness(1.1)',
    clear: 'contrast(1.1) brightness(1.1)',
    warm: 'sepia(0.3) saturate(1.4) hue-rotate(-10deg)',
    film: 'contrast(0.8) brightness(1.1) saturate(0.8) sepia(0.2)',
    modern: 'contrast(1.2) saturate(0.5) brightness(1.1)',
    gold: 'sepia(0.5) brightness(1.1) saturate(2) hue-rotate(-15deg)',
    'B & W': 'grayscale(1) contrast(1.2)',
    cool: 'hue-rotate(180deg) saturate(1.2) brightness(1.1)'
  };

  // Initialize TUI Image Editor when modal opens
  useEffect(() => {
    if (showTuiEditor && tuiContainerRef.current && !tuiEditorRef.current) {
      tuiEditorRef.current = new ImageEditor(tuiContainerRef.current, {
        includeUI: {
          loadImage: {
            path: imageState,
            name: 'Thumbnail',
          },
          theme: {
            'common.bi.image': '',
            'common.bisize.width': '0px',
            'common.bisize.height': '0px',
            'common.backgroundColor': '#1e293b',
          },
          menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'icon', 'text', 'mask', 'filter'],
          initMenu: 'filter',
          uiSize: {
            width: '100%',
            height: '600px',
          },
          menuBarPosition: 'bottom',
        },
        cssMaxWidth: 1000,
        cssMaxHeight: 600,
        selectionStyle: {
          cornerSize: 20,
          rotatingPointOffset: 70,
        },
      });
    }

    return () => {
      if (tuiEditorRef.current && !showTuiEditor) {
        tuiEditorRef.current.destroy();
        tuiEditorRef.current = null;
      }
    };
  }, [showTuiEditor, imageState]);

  useEffect(() => {
    applyAllChanges();
  }, [imageState, adjust, filter, isCropping, cropArea, tuiResult]);

  const applyAllChanges = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageState) return;
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.filter = `brightness(${adjust.brightness}%) contrast(${adjust.contrast}%) blur(${adjust.blur}px) ${filters[filter]}`;
      ctx.drawImage(img, 0, 0);

      if (adjust.temperature !== 0) {
        ctx.globalCompositeOperation = adjust.temperature > 0 ? 'overlay' : 'soft-light';
        ctx.fillStyle = adjust.temperature > 0 ? `rgba(255, 150, 0, ${Math.abs(adjust.temperature)/200})` : `rgba(0, 150, 255, ${Math.abs(adjust.temperature)/200})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
      }

      // Watermark
      ctx.font = "20px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.textAlign = "right";
      ctx.fillText(watermark, canvas.width - 20, canvas.height - 20);

      // Crop overlay
      if (isCropping) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, canvas.width, cropArea.y);
        ctx.fillRect(0, cropArea.y + cropArea.height, canvas.width, canvas.height);
        ctx.fillRect(0, cropArea.y, cropArea.x, cropArea.height);
        ctx.fillRect(cropArea.x + cropArea.width, cropArea.y, canvas.width, cropArea.height);
        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 4;
        ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
      }
    };
    img.src = tuiResult || imageState;
  };

  const applyCrop = () => {
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = cropArea.width;
    tempCanvas.height = cropArea.height;
    tempCtx.drawImage(canvas, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 0, 0, cropArea.width, cropArea.height);
    setImageState(tempCanvas.toDataURL());
    setIsCropping(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setImageState(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleTuiSave = () => {
    if (tuiEditorRef.current) {
      const editedImageData = tuiEditorRef.current.toDataURL();
      setTuiResult(editedImageData);
      setImageState(editedImageData);
      setShowTuiEditor(false);
    }
  };

  const handleTuiCancel = () => {
    setShowTuiEditor(false);
    if (tuiEditorRef.current) {
      tuiEditorRef.current.destroy();
      tuiEditorRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex overflow-hidden">
      {/* TUI Editor Modal */}
      {showTuiEditor && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-white/10">
            <h2 className="text-xl font-bold text-indigo-400">Advanced Editor @Thumblify</h2>
            <div className="flex gap-2">
              <button
                onClick={handleTuiSave}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold"
              >
                Save Changes
              </button>
              <button
                onClick={handleTuiCancel}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
          <div className="flex-1 p-6 overflow-auto">
            <div ref={tuiContainerRef} className="w-full h-full"></div>
          </div>
        </div>
      )}

      {/* Sidebar Controls */}
      <div className="w-80 bg-slate-900 border-r border-white/10 p-6 space-y-6 overflow-y-auto h-screen scrollbar-hide shrink-0">
        <h2 className="text-xl font-bold text-indigo-400">Thumbnail Studio</h2>
        
        <label className="block p-4 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-white/5 text-center transition">
          <Upload size={20} className="mx-auto mb-2 text-indigo-400"/>
          <span className="text-sm">Upload Source</span>
          <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
        </label>

        {/* Advanced Editor Button - Always Show */}
        <button 
          onClick={() => setShowTuiEditor(true)}
          disabled={!imageState}
          className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg ${
            imageState 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
              : 'bg-gray-700 cursor-not-allowed opacity-50'
          }`}
        >
          Advanced Editor
        </button>

        <div className="space-y-2">
          <button 
            onClick={() => setIsCropping(!isCropping)} 
            disabled={!imageState}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border transition ${
              !imageState 
                ? 'bg-gray-700 border-gray-600 cursor-not-allowed opacity-50'
                : isCropping 
                  ? 'bg-red-500/20 border-red-500 text-red-300' 
                  : 'bg-white/5 border-white/10'
            }`}
          >
            <Crop size={18}/> {isCropping ? 'Cancel Crop' : 'Crop Mode'}
          </button>
          {isCropping && (
            <button onClick={applyCrop} className="w-full bg-green-600 py-2 rounded-lg flex items-center justify-center gap-2 font-bold transition">
              <Check size={18}/> Finalize Crop
            </button>
          )}
        </div>

        <div className="space-y-3 pt-4 border-t border-white/10">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-indigo-400"><Wind size={16}/> Filters</h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(filters).map((f) => (
              <button 
                key={f} 
                onClick={() => setFilter(f)} 
                disabled={!imageState}
                className={`py-2 text-[10px] uppercase rounded border transition ${
                  !imageState
                    ? 'bg-gray-700 border-gray-600 cursor-not-allowed opacity-50'
                    : filter === f 
                      ? 'bg-indigo-600 border-indigo-400' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/10">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-indigo-400"><Sliders size={16}/> Adjustments</h3>
          {['brightness', 'temperature', 'blur'].map((adj) => (
            <div key={adj} className="space-y-1">
              <label className="text-[10px] uppercase text-gray-400">{adj}</label>
              <input 
                type="range" 
                min={adj === 'temperature' ? -100 : 0} 
                max={200} 
                value={adjust[adj]} 
                onChange={(e) => setAdjust({...adjust, [adj]: e.target.value})} 
                disabled={!imageState}
                className={`w-full h-1 bg-white/10 appearance-none rounded ${!imageState ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
          ))}
        </div>

        <button 
          onClick={() => {
            const link = document.createElement('a');
            link.download = 'thumb-export.png';
            link.href = canvasRef.current.toDataURL();
            link.click();
          }}
          disabled={!imageState}
          className={`w-full py-3 rounded-xl font-bold mt-4 transition shadow-lg ${
            imageState
              ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
              : 'bg-gray-700 cursor-not-allowed opacity-50'
          }`}
        >
          <Download size={18} className="inline mr-2"/> Download HD
        </button>
      </div>

      {/* Workspace */}
      <div className="flex-1 bg-black flex items-center justify-center p-8">
        <div className="relative aspect-square w-full max-w-[600px] bg-slate-900/50 border border-white/5 rounded-2xl flex items-center justify-center overflow-hidden">
          {!imageState && (
            <div className="text-center opacity-40">
              <ImageIcon size={64} className="mx-auto mb-4"/>
              <p>Upload an image to start</p>
            </div>
          )}
          <canvas 
            ref={canvasRef}
            className="max-w-full max-h-full object-contain shadow-2xl"
            style={{ display: imageState ? 'block' : 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

export default ThumbnailEditor;