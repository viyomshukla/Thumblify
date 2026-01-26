import React, { useState, useRef, useEffect } from 'react';
import { Upload, Type, Download, Sliders, Image as ImageIcon, Wind, Crop, Check } from 'lucide-react';

const ThumbnailEditor = () => {
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  
  const [adjust, setAdjust] = useState({
    brightness: 100,
    exposure: 100,
    contrast: 100,
    temperature: 0,
    blur: 0,
  });

  const [filter, setFilter] = useState('none');
  const [text, setText] = useState('YOUR TITLE HERE');
  const [textPos, setTextPos] = useState({ x: 150, y: 150 });
  const [fontSize, setFontSize] = useState(60);
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

  useEffect(() => {
    applyAllChanges();
  }, [image, adjust, filter, text, textPos, fontSize, isCropping, cropArea]);

  const applyAllChanges = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
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

      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = "#000000"; 
      ctx.textAlign = "left";
      ctx.shadowColor = "rgba(255,255,255,0.8)";
      ctx.shadowBlur = 15;
      ctx.fillText(text, textPos.x, textPos.y);
      ctx.shadowBlur = 0;

      ctx.font = "20px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.textAlign = "right";
      ctx.fillText(watermark, canvas.width - 20, canvas.height - 20);

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
    img.src = image;
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);
    if (Math.abs(x - textPos.x) < 200 && Math.abs(y - textPos.y) < 60) {
      setIsDraggingText(true);
    }
  };

  const handleMouseMove = (e) => {
    if (isDraggingText) {
      const rect = canvasRef.current.getBoundingClientRect();
      setTextPos({
        x: (e.clientX - rect.left) * (canvasRef.current.width / rect.width),
        y: (e.clientY - rect.top) * (canvasRef.current.height / rect.height)
      });
    }
  };

  const applyCrop = () => {
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = cropArea.width;
    tempCanvas.height = cropArea.height;
    tempCtx.drawImage(canvas, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 0, 0, cropArea.width, cropArea.height);
    setImage(tempCanvas.toDataURL());
    setIsCropping(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex overflow-hidden">
      {/* Sidebar Controls */}
      <div className="w-80 bg-slate-900 border-r border-white/10 p-6 space-y-6 overflow-y-auto h-screen scrollbar-hide shrink-0">
        <h2 className="text-xl font-bold text-indigo-400">Thumbnail Studio</h2>
        
        <label className="block p-4 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-white/5 text-center transition">
          <Upload size={20} className="mx-auto mb-2 text-indigo-400"/>
          <span className="text-sm">Upload Source</span>
          <input type="file" className="hidden" onChange={handleImageUpload} />
        </label>

        <div className="space-y-2">
          <button onClick={() => setIsCropping(!isCropping)} className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border transition ${isCropping ? 'bg-red-500/20 border-red-500 text-red-300' : 'bg-white/5 border-white/10'}`}>
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
              <button key={f} onClick={() => setFilter(f)} className={`py-2 text-[10px] uppercase rounded border transition ${filter === f ? 'bg-indigo-600 border-indigo-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-white/10">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-indigo-400"><Type size={16}/> Text Overlay</h3>
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} className="w-full bg-black/40 border border-white/10 p-2 rounded text-sm text-white" placeholder="Your Title..." />
          <input type="range" min="20" max="250" value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-full" />
        </div>

        <div className="space-y-4 pt-4 border-t border-white/10">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-indigo-400"><Sliders size={16}/> Adjustments</h3>
          {['brightness', 'temperature', 'blur'].map((adj) => (
            <div key={adj} className="space-y-1">
              <label className="text-[10px] uppercase text-gray-400">{adj}</label>
              <input type="range" min={adj === 'temperature' ? -100 : 0} max={200} value={adjust[adj]} onChange={(e) => setAdjust({...adjust, [adj]: e.target.value})} className="w-full h-1 bg-white/10 appearance-none rounded" />
            </div>
          ))}
        </div>

        <button onClick={() => {
            const link = document.createElement('a');
            link.download = 'thumb-export.png';
            link.href = canvasRef.current.toDataURL();
            link.click();
          }}
          className="w-full bg-indigo-600 py-3 rounded-xl font-bold mt-4 hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20"
        >
          <Download size={18} className="inline mr-2"/> Download HD
        </button>
      </div>

      {/* ✅ Workspace with 9X9 (1:1) Proportional View Area */}
      <div className="flex-1 bg-black flex items-center justify-center p-8">
        <div className="relative aspect-square w-full max-w-[600px] bg-slate-900/50 border border-white/5 rounded-2xl flex items-center justify-center overflow-hidden">
          {!image && (
            <div className="text-center opacity-40">
              <ImageIcon size={64} className="mx-auto mb-4"/>
              <p>Upload an image to start</p>
            </div>
          )}
          {/* Canvas will fit comfortably within the 1:1 workspace */}
          <canvas 
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsDraggingText(false)}
            onMouseLeave={() => setIsDraggingText(false)}
            className={`max-w-full max-h-full object-contain shadow-2xl ${isDraggingText ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ display: image ? 'block' : 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

export default ThumbnailEditor;