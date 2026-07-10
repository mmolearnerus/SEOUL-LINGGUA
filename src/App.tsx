import React, { useState, useEffect, useRef } from "react";
import { 
  Upload, 
  BookOpen, 
  Trash2, 
  Sparkles, 
  BookMarked, 
  Clock, 
  Volume2, 
  ChevronRight, 
  FileText, 
  HelpCircle, 
  Bookmark, 
  CheckCircle,
  Lightbulb,
  FileDown,
  Info,
  GraduationCap
} from "lucide-react";
import { AnalysisResult, SavedWord, VocabularyItem, DemoTopic } from "./types";
import { PronunciationButton } from "./components/PronunciationButton";
import { SponsorBanner } from "./components/SponsorBanner";

export default function App() {
  // State for original raw text or base64 image
  const [textInput, setTextInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Loading & operational states
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [accent, setAccent] = useState<"US" | "UK">("US");
  const [speechRate, setSpeechRate] = useState<number>(0.9); // Slightly slower for language learners
  
  // Current analysis results
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);
  
  // History of analyzed pieces
  const [history, setHistory] = useState<Array<{ id: string; title: string; timestamp: string; result: AnalysisResult }>>([]);
  
  // Saved vocabulary for personalized review
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [wordNotes, setWordNotes] = useState("");
  
  // Tab control inside history or views
  const [activeTab, setActiveTab] = useState<"analyze" | "notebook">("analyze");
  const [isDragOver, setIsDragOver] = useState(false);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(true);

  // Read entire article state
  const [isReadingArticle, setIsReadingArticle] = useState(false);
  const articleUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load initial data and saved words
  useEffect(() => {
    // Check speech support
    if (typeof window !== "undefined" && !window.speechSynthesis) {
      setSpeechSynthesisSupported(false);
    }

    // Load saved words from localStorage
    const storedWords = localStorage.getItem("seoul_lingua_saved_words");
    if (storedWords) {
      try {
        setSavedWords(JSON.parse(storedWords));
      } catch (e) {
        console.error("Failed to parse saved words", e);
      }
    }

    // Load history from localStorage
    const storedHistory = localStorage.getItem("seoul_lingua_history");
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    // Load demo topics as initial view
    loadDemoTopic("pho_identity");
  }, []);

  // Save words to local storage when state changes
  useEffect(() => {
    localStorage.setItem("seoul_lingua_saved_words", JSON.stringify(savedWords));
  }, [savedWords]);

  // Save history to local storage when state changes
  useEffect(() => {
    localStorage.setItem("seoul_lingua_history", JSON.stringify(history));
  }, [history]);

  // Load a pre-defined demo topic (Pho or Seoul)
  const loadDemoTopic = async (topicKey: "pho_identity" | "seoul_culture") => {
    setLoading(true);
    setLoadingMessage("Đang tải dữ liệu bài mẫu...");
    
    try {
      const response = await fetch("/api/demo-topics");
      if (response.ok) {
        const demoData = await response.json();
        if (demoData[topicKey]) {
          const result: AnalysisResult = {
            ...demoData[topicKey],
            isOfflineMode: true,
          };
          setAnalysis(result);
          
          // Auto-select first vocabulary word if available
          if (result.vocabulary && result.vocabulary.length > 0) {
            setSelectedWord(result.vocabulary[0]);
          }
        }
      }
    } catch (err) {
      console.error("Error loading demo topics:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Drag & Drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn hoặc thả tệp hình ảnh hợp lệ (PNG, JPG, JPEG).");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Main OCR & Image analysis trigger
  const handleAnalyzeImage = async () => {
    if (!imagePreview) return;
    setLoading(true);
    setLoadingMessage("Đang gửi ảnh tới AI để phân tích chữ (OCR), dịch nghĩa và bóc tách từ vựng...");

    try {
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: imageFile?.type || "image/png"
        })
      });

      if (!response.ok) {
        throw new Error("Phản hồi server không thành công");
      }

      const result: AnalysisResult = await response.json();
      setAnalysis(result);
      
      // Auto-select first vocabulary word
      if (result.vocabulary && result.vocabulary.length > 0) {
        setSelectedWord(result.vocabulary[0]);
      }

      // Add to history
      const newHistoryItem = {
        id: Date.now().toString(),
        title: result.titleEnglish || "Bài đọc không tên",
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " - " + new Date().toLocaleDateString("vi-VN"),
        result
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 19)]); // Keep last 20
    } catch (error) {
      console.error("Error analyzing image:", error);
      alert("Không thể phân tích ảnh bằng AI. Vui lòng thử lại hoặc dán đoạn văn bản trực tiếp.");
    } finally {
      setLoading(false);
    }
  };

  // Text-based analysis trigger
  const handleAnalyzeText = async () => {
    if (!textInput.trim()) return;
    setLoading(true);
    setLoadingMessage("Đang phân tích đoạn văn, tạo bản dịch tiếng Việt và bảng từ vựng chuyên sâu...");

    try {
      const response = await fetch("/api/analyze-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textInput })
      });

      if (!response.ok) {
        throw new Error("Phản hồi server không thành công");
      }

      const result: AnalysisResult = await response.json();
      setAnalysis(result);
      
      // Auto-select first vocabulary word
      if (result.vocabulary && result.vocabulary.length > 0) {
        setSelectedWord(result.vocabulary[0]);
      }

      // Add to history
      const newHistoryItem = {
        id: Date.now().toString(),
        title: result.titleEnglish || "Bài viết tự nhập",
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " - " + new Date().toLocaleDateString("vi-VN"),
        result
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 19)]);
    } catch (error) {
      console.error("Error analyzing text:", error);
      alert("Lỗi khi phân tích đoạn văn.");
    } finally {
      setLoading(false);
    }
  };

  // Add word to personal saved words list
  const saveWordToNotebook = (vocab: VocabularyItem) => {
    // Check if already exists
    if (savedWords.some(item => item.word.toLowerCase() === vocab.word.toLowerCase())) {
      alert(`Từ "${vocab.word}" đã tồn tại trong danh sách ghi nhớ của bạn.`);
      return;
    }

    const newSaved: SavedWord = {
      ...vocab,
      id: Date.now().toString(),
      savedAt: new Date().toLocaleDateString("vi-VN"),
      isMemorized: false,
      notes: wordNotes.trim() || undefined
    };

    setSavedWords(prev => [newSaved, ...prev]);
    setWordNotes("");
  };

  // Remove word from personal list
  const deleteSavedWord = (id: string) => {
    setSavedWords(prev => prev.filter(w => w.id !== id));
  };

  // Toggle word as memorized
  const toggleMemorizedStatus = (id: string) => {
    setSavedWords(prev => prev.map(w => w.id === id ? { ...w, isMemorized: !w.isMemorized } : w));
  };

  // Read entire passage
  const handleReadEntireArticle = () => {
    if (!analysis || !analysis.originalText) return;

    if (isReadingArticle) {
      window.speechSynthesis.cancel();
      setIsReadingArticle(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(analysis.originalText);
    
    // Config voice accent
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    if (accent === "UK") {
      selectedVoice = voices.find(v => v.lang.startsWith("en-GB") || v.name.toLowerCase().includes("british"));
    } else {
      selectedVoice = voices.find(v => v.lang.startsWith("en-US") || v.name.toLowerCase().includes("google us") || v.name.toLowerCase().includes("america"));
    }

    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith("en"));
    }

    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = speechRate;
    
    utterance.onend = () => {
      setIsReadingArticle(false);
    };
    utterance.onerror = () => {
      setIsReadingArticle(false);
    };

    articleUtteranceRef.current = utterance;
    setIsReadingArticle(true);
    window.speechSynthesis.speak(utterance);
  };

  // Search/highlight matching word in text when clicking on the text
  const handleTextWordClick = (word: string) => {
    const cleanWord = word.replace(/[^a-zA-Z-]/g, "").toLowerCase();
    
    // Find if the word is in the analysis vocabulary
    const found = analysis?.vocabulary.find(v => v.word.toLowerCase() === cleanWord || cleanWord.includes(v.word.toLowerCase()));
    
    if (found) {
      setSelectedWord(found);
    } else {
      // Create a temporary word preview
      setSelectedWord({
        word: cleanWord,
        partOfSpeech: "word",
        ipa: "Dự đoán",
        englishDefinition: `Clicked word from text: "${cleanWord}"`,
        vietnameseDefinition: "Nhấn nút Nghe để luyện phát âm từ này ngay lập tức.",
        exampleSentence: `You selected "${cleanWord}" from the passage.`,
        exampleTranslation: `Bạn đã chọn từ "${cleanWord}" từ bài đọc.`
      });
    }
  };

  // Helper to split paragraph into clickable words
  const renderInteractiveText = (text: string) => {
    if (!text) return null;
    
    return text.split("\n\n").map((paragraph, pIdx) => (
      <p key={pIdx} className="mb-4 leading-relaxed text-slate-700">
        {paragraph.split(" ").map((word, wIdx) => {
          const cleanWord = word.replace(/[^a-zA-Z-]/g, "").toLowerCase();
          const isSelected = selectedWord && selectedWord.word.toLowerCase() === cleanWord;
          const isKeyVocab = analysis?.vocabulary.some(v => v.word.toLowerCase() === cleanWord);

          return (
            <span
              key={wIdx}
              onClick={() => handleTextWordClick(word)}
              className={`inline-block mr-1 px-0.5 rounded cursor-pointer transition-all duration-150 ${
                isSelected 
                  ? "bg-indigo-600 text-white font-medium shadow-sm scale-105" 
                  : isKeyVocab 
                    ? "bg-indigo-50 border-b-2 border-indigo-500 font-semibold hover:bg-indigo-100" 
                    : "hover:bg-slate-100"
              }`}
              title={isKeyVocab ? "Nhấp để xem từ vựng nổi bật" : "Nhấp để phát âm từ này"}
            >
              {word}
            </span>
          );
        })}
      </p>
    ));
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F8FAFC] font-sans overflow-hidden">
      
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded flex items-center justify-center shadow-md">
            <span className="text-white font-extrabold text-lg tracking-wider">S</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-md md:text-lg font-extrabold text-slate-800 leading-none">SEOUL LINGUA</h1>
              <span className="bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">IELTS PRO</span>
            </div>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-1">TRUNG TÂM NGOẠI NGỮ SEOUL</p>
          </div>
        </div>

        {/* Global Navigation and Interactive Profile Mock */}
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-5 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <button 
              id="nav-learn-btn"
              onClick={() => setActiveTab("analyze")}
              className={`py-5 border-b-2 transition-all ${activeTab === "analyze" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent hover:text-indigo-600"}`}
            >
              Bàn học thông minh
            </button>
            <button 
              id="nav-notebook-btn"
              onClick={() => setActiveTab("notebook")}
              className={`py-5 border-b-2 transition-all relative ${activeTab === "notebook" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent hover:text-indigo-600"}`}
            >
              Sổ tay ghi nhớ
              {savedWords.length > 0 && (
                <span className="absolute top-3 -right-3.5 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {savedWords.length}
                </span>
              )}
            </button>
            <a 
              id="download-source-zip-btn"
              href="/api/download-zip"
              className="ml-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Đóng gói và tải toàn bộ mã nguồn dự án thành tệp ZIP"
            >
              <FileDown className="w-3.5 h-3.5" />
              Tải Toàn Bộ App (.ZIP)
            </a>
          </nav>

          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-extrabold text-slate-800">Cộng Đồng Seoul</p>
              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block pulse-active"></span>
                Đang trực tuyến
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs shadow-inner">
              SL
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-12 gap-6 overflow-hidden">
        
        {/* Left Column: Data Input & History */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-4 overflow-hidden h-full">
          
          {/* File input / Pasting tab panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-4 shadow-sm shrink-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                Nguồn Bài Học
              </h3>
              <div className="flex gap-1">
                <button
                  id="tab-pho-demo-btn"
                  onClick={() => loadDemoTopic("pho_identity")}
                  className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 rounded border border-amber-200 hover:bg-amber-100 transition-all cursor-pointer"
                  title="Nhận dạng nhanh văn bản từ hình ảnh Pho"
                >
                  Mẫu Phở 🍲
                </button>
                <button
                  id="tab-seoul-demo-btn"
                  onClick={() => loadDemoTopic("seoul_culture")}
                  className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded border border-indigo-200 hover:bg-indigo-100 transition-all cursor-pointer"
                  title="Tải bài mẫu về Thủ đô Seoul năng động"
                >
                  Mẫu Seoul 🇰🇷
                </button>
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <div
              id="ocr-drag-drop-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload-input")?.click()}
              className={`aspect-[16/10] sm:aspect-[16/8] lg:aspect-[4/3] rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all duration-200 ${
                isDragOver 
                  ? "border-indigo-600 bg-indigo-50/50" 
                  : imagePreview 
                    ? "border-emerald-400 bg-emerald-50/10" 
                    : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50"
              }`}
            >
              <input
                id="file-upload-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {imagePreview ? (
                <div className="w-full h-full flex flex-col items-center justify-between">
                  <div className="relative w-full flex-1 max-h-[140px] rounded overflow-hidden shadow-sm border border-slate-200 bg-black/5">
                    <img
                      src={imagePreview}
                      alt="Xem trước ảnh chụp bài đọc"
                      className="object-contain w-full h-full"
                    />
                    <button
                      id="remove-uploaded-image"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold mt-2 truncate max-w-full">
                    {imageFile ? imageFile.name : "Đã chọn 1 ảnh"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto shadow-sm border border-slate-200">
                    <Upload className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Tải ảnh chụp tiếng Anh</p>
                    <p className="text-[10px] text-slate-400 mt-1">Kéo thả ảnh hoặc Nhấp để tìm</p>
                  </div>
                </div>
              )}
            </div>

            {imagePreview && (
              <button
                id="trigger-ocr-analysis"
                onClick={handleAnalyzeImage}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-xs font-extrabold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                NHẬN DẠNG & PHÂN TÍCH ẢNH
              </button>
            )}

            {/* Manual text block fallback */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label htmlFor="raw-text-input" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hoặc dán đoạn văn thủ công</label>
              <textarea
                id="raw-text-input"
                rows={3}
                placeholder="Dán hoặc nhập một đoạn văn tiếng Anh cần dịch thuật và học từ vựng..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
              />
              {textInput.trim() && (
                <button
                  id="trigger-text-analysis"
                  onClick={handleAnalyzeText}
                  disabled={loading}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  PHÂN TÍCH VĂN BẢN
                </button>
              )}
            </div>
          </div>

          {/* Scanned History Panel */}
          <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm overflow-hidden flex flex-col">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Clock className="w-4 h-4 text-indigo-500" />
              Lịch sử đã học ({history.length})
            </h3>

            {history.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <p className="text-[11px] text-slate-400 font-medium">Bạn chưa lưu lịch sử quét nào.</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Mọi thao tác dịch & bóc tách từ vựng thành công sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    id={`history-item-${item.id}`}
                    onClick={() => {
                      setAnalysis(item.result);
                      if (item.result.vocabulary && item.result.vocabulary.length > 0) {
                        setSelectedWord(item.result.vocabulary[0]);
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      analysis?.originalText === item.result.originalText
                        ? "border-indigo-200 bg-indigo-50/50 shadow-sm"
                        : "border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-800 truncate" title={item.title}>
                      {item.title}
                    </p>
                    <p className="text-[9px] text-slate-400 font-semibold mt-1">
                      {item.timestamp}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Middle Column: Active Read & Pronounce Arena */}
        <section className="col-span-12 lg:col-span-6 flex flex-col gap-4 overflow-hidden h-full">
          
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-full">
            
            {/* Control Bar */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 pulse-active"></span>
                <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">
                  {analysis?.isOfflineMode ? "Nội dung phân tích (Bản mẫu)" : "Nội dung phân tích"}
                </h2>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Accent selector */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    id="accent-us-selector"
                    onClick={() => setAccent("US")}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${accent === "US" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Mỹ (US)
                  </button>
                  <button
                    id="accent-uk-selector"
                    onClick={() => setAccent("UK")}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${accent === "UK" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Anh (UK)
                  </button>
                </div>

                {analysis && (
                  <button
                    id="read-entire-passage-btn"
                    onClick={handleReadEntireArticle}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm ${
                      isReadingArticle 
                        ? "bg-red-600 text-white hover:bg-red-700" 
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isReadingArticle ? "animate-bounce" : ""}`} />
                    {isReadingArticle ? "Dừng đọc" : "Đọc toàn bài"}
                  </button>
                )}
              </div>
            </div>

            {/* Read & Interactive Workspace */}
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Đang xử lý bằng Trí Tuệ Nhân Tạo...</h4>
                <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">{loadingMessage}</p>
              </div>
            ) : analysis ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Scrollable text container */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
                  {/* Title banner */}
                  <div className="border-l-4 border-indigo-600 pl-4 py-1 space-y-1">
                    <h3 className="text-base md:text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
                      {analysis.titleEnglish}
                    </h3>
                    <p className="text-xs md:text-sm font-bold text-indigo-700">
                      {analysis.titleVietnamese}
                    </p>
                  </div>

                  {/* Interactive Original Text */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 md:p-6 text-sm md:text-base leading-relaxed text-slate-800 font-medium">
                    <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      Gợi ý: Nhấp vào bất kỳ từ nào để tra cứu nhanh & nghe phát âm
                    </div>
                    <div>{renderInteractiveText(analysis.originalText)}</div>
                  </div>

                  {/* Beautiful Translation Panel */}
                  <div className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-5 md:p-6">
                    <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider mb-3 block">
                      BẢN DỊCH TIẾNG VIỆT CHUẨN XÁC
                    </span>
                    <div className="text-xs md:text-sm text-slate-600 leading-relaxed italic space-y-3">
                      {analysis.vietnameseTranslation.split("\n\n").map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Foot Definition Workspace of current clicked / selected word */}
                {selectedWord && (
                  <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50 border-t border-indigo-100 p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 shadow-inner">
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="bg-white px-3 py-2 rounded-lg border border-indigo-200 shadow-sm shrink-0 text-center">
                        <span className="text-indigo-600 text-[10px] font-bold block uppercase tracking-wider leading-none mb-1">
                          {selectedWord.partOfSpeech || "n"}
                        </span>
                        <strong className="text-slate-800 text-sm md:text-base font-bold block">
                          {selectedWord.word}
                        </strong>
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-medium text-slate-500 tracking-wide">
                            {selectedWord.ipa}
                          </span>
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold">
                            Từ khoá bài học
                          </span>
                        </div>
                        <p className="text-xs md:text-sm font-extrabold text-indigo-900 truncate">
                          {selectedWord.vietnameseDefinition}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate" title={selectedWord.englishDefinition}>
                          {selectedWord.englishDefinition}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end shrink-0">
                      <PronunciationButton
                        text={selectedWord.word}
                        accent={accent}
                        rate={speechRate}
                        size="md"
                      />

                      <button
                        id="save-to-notebook-btn"
                        onClick={() => saveWordToNotebook(selectedWord)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-extrabold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                        LƯU TỪ VỰNG
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
                <h4 className="font-bold text-slate-700 text-sm">Chưa có bài đọc hoạt động</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Tải một ảnh lên ở cột bên trái hoặc nhấp tải các "Bài mẫu" để bắt đầu học nghe, đọc tức thì.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Vocabulary Summary & Saved Personal Notebook */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-4 overflow-hidden h-full">
          
          {/* Active Vocabulary Summary list of the active article */}
          <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col overflow-hidden h-[45%] shrink-0">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Tóm tắt từ vựng bài ({analysis?.vocabulary.length || 0})
              </h3>
            </div>

            {!analysis || !analysis.vocabulary || analysis.vocabulary.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-slate-950/40 rounded-lg">
                <p className="text-xs text-slate-500 font-medium">Bảng từ vựng rỗng.</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Hệ thống AI sẽ tự động phân tích và liệt kê từ mới tại đây.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {analysis.vocabulary.map((vocab, index) => {
                  const isSelected = selectedWord?.word === vocab.word;
                  return (
                    <div
                      key={index}
                      id={`vocab-item-${index}`}
                      onClick={() => setSelectedWord(vocab)}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-950/50"
                          : "border-slate-800 bg-slate-950/20 hover:bg-slate-950/40"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <div className="overflow-hidden">
                          <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                            {vocab.word}
                            <span className="text-[9px] text-indigo-400 font-bold lowercase">
                              ({vocab.partOfSpeech})
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400 italic font-mono mt-0.5">
                            {vocab.ipa}
                          </p>
                          <p className="text-[11px] text-indigo-300 font-semibold mt-1 truncate">
                            {vocab.vietnameseDefinition}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                          <PronunciationButton
                            text={vocab.word}
                            accent={accent}
                            rate={speechRate}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sổ tay cá nhân (My Saved Personal Notebook) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col overflow-hidden h-[55%]">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                <BookMarked className="w-4 h-4 text-indigo-600" />
                Sổ tay ghi nhớ ({savedWords.length})
              </h3>
              {savedWords.length > 0 && (
                <button
                  id="clear-all-notebook-btn"
                  onClick={() => {
                    if (confirm("Bạn có chắc chắn muốn xoá toàn bộ sổ tay vựng từ này?")) {
                      setSavedWords([]);
                    }
                  }}
                  className="text-[9px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider"
                >
                  Xoá hết
                </button>
              )}
            </div>

            {savedWords.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mb-2.5 text-indigo-600">
                  <Bookmark className="w-5 h-5" />
                </div>
                <p className="text-[11px] text-slate-600 font-bold">Chưa có từ ôn tập</p>
                <p className="text-[9px] text-slate-400 mt-1 leading-relaxed max-w-[180px] mx-auto">
                  Lưu từ mới từ bài đọc để tạo kho từ vựng ôn tập của riêng bạn.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Scrollable Saved Words List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-2">
                  {savedWords.map((item) => (
                    <div
                      key={item.id}
                      id={`saved-word-card-${item.id}`}
                      className={`p-2.5 rounded-lg border transition-all ${
                        item.isMemorized
                          ? "border-emerald-100 bg-emerald-50/30 opacity-75"
                          : "border-slate-100 bg-white hover:border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <div className="overflow-hidden flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              onClick={() => toggleMemorizedStatus(item.id)}
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                                item.isMemorized
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "border-slate-300 hover:border-emerald-500 bg-white"
                              }`}
                              title={item.isMemorized ? "Đánh dấu chưa thuộc" : "Đánh dấu đã thuộc lòng"}
                            >
                              {item.isMemorized && <CheckCircle className="w-2.5 h-2.5" />}
                            </span>
                            <span className={`text-xs font-extrabold text-slate-800 ${item.isMemorized ? "line-through text-slate-400" : ""}`}>
                              {item.word}
                            </span>
                            <span className="text-[9px] text-slate-400 italic">({item.partOfSpeech})</span>
                          </div>
                          
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">{item.ipa}</p>
                          <p className="text-xs font-bold text-indigo-700 mt-1">{item.vietnameseDefinition}</p>
                          
                          {/* Mini interactive example trigger */}
                          <div className="mt-1.5 p-1 bg-slate-50 rounded border border-slate-100 text-[10px] text-slate-500">
                            <p className="italic font-medium">"{item.exampleSentence}"</p>
                            <p className="text-[9px] text-slate-400 font-semibold">{item.exampleTranslation}</p>
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col items-center gap-1.5 ml-2">
                          <PronunciationButton
                            text={item.word}
                            accent={accent}
                            rate={speechRate}
                            size="sm"
                          />
                          <button
                            id={`delete-saved-${item.id}`}
                            onClick={() => deleteSavedWord(item.id)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                            title="Xoá khỏi sổ tay"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Interactive Study Practice Widget */}
                <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-100 shrink-0 text-center">
                  <div className="flex items-center gap-1 justify-center text-indigo-900 font-bold text-xs">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <span>Luyện Tập Ghi Nhớ Cùng Seoul</span>
                  </div>
                  <p className="text-[9px] text-indigo-700 mt-1">
                    Đã thuộc: <strong>{savedWords.filter(w => w.isMemorized).length}/{savedWords.length} từ</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Persistent Strategic Partner Banner at footer level */}
      <footer className="shrink-0 bg-white border-t border-slate-200 px-6 py-2.5 z-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block animate-pulse"></span>
            <span>Hệ thống được tài trợ đồng hành bởi <strong>TRUNG TÂM NGOẠI NGỮ SEOUL</strong></span>
          </div>
          
          <div className="flex gap-4">
            <a href="#seoul-sponsor-section" className="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition-all flex items-center gap-1">
              Nhận voucher 15% học phí ngay →
            </a>
          </div>
        </div>
      </footer>

      {/* Floating Detailed Sponsor Section & Leads Collector */}
      <div className="overflow-y-auto max-h-[220px] shrink-0 border-t border-indigo-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <SponsorBanner />
        </div>
      </div>
    </div>
  );
}
