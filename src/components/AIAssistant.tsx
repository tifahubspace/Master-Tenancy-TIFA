import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User, Sparkles, X, ChevronDown, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getApiUrl } from "../lib/api";

interface AIAssistantProps {
  buildings: any[];
  units: any[];
  leases: any[];
  payments: any[];
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAssistant({ 
  buildings, 
  units, 
  leases, 
  payments, 
  isOpen, 
  onClose 
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "### 👋 Selamat Datang di TPMS AI Enterprise Assistant!\n\nSaya adalah asisten pintar Anda yang terintegrasi secara real-time dengan seluruh data operasional gedung. Anda dapat menanyakan laporan okupansi, mencari unit kosong, memantau sewa berakhir, atau memverifikasi pembayaran menggunakan bahasa alami.\n\n**Silakan coba klik contoh pertanyaan di bawah atau ketik langsung!**",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleQuestions = [
    { label: "Cari Unit Kosong", query: "Tunjukkan daftar unit kosong yang tersedia saat ini di seluruh gedung" },
    { label: "Kontrak Segera Habis", query: "Adakah kontrak sewa tenant yang segera berakhir dalam waktu dekat?" },
    { label: "Analisis Okupansi", query: "Berikan laporan okupansi rata-rata portofolio dan estimasi pendapatan sewa bulanan" },
    { label: "Alert Overdue", query: "Apakah ada tagihan sewa yang terlambat dibayar (overdue)?" }
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim() || loading) return;

    // Add user message
    const userMsg: Message = {
      role: 'user',
      content: queryText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(getApiUrl("/api/gemini/assistant-chat"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: queryText,
          dataContext: {
            buildings,
            units,
            leases,
            payments
          }
        })
      });

      if (!response.ok) {
        throw new Error("Gagal terhubung ke AI server.");
      }

      const result = await response.json();
      
      const assistantMsg: Message = {
        role: 'assistant',
        content: result.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ **Gagal memproses pesan**: ${error.message || "Pastikan server Anda berjalan dengan benar."}`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Safe markdown-ish parser for basic headings, bold text, lists, and tables
  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith("### ")) {
        return <h4 key={idx} className="font-sans font-bold text-sm text-slate-100 mt-4 mb-2">{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("#### ")) {
        return <h5 key={idx} className="font-sans font-semibold text-xs text-cyan-300 mt-3 mb-1 uppercase tracking-wider">{line.replace("#### ", "")}</h5>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={idx} className="font-sans font-bold text-base text-cyan-400 mt-4 mb-2">{line.replace("## ", "")}</h3>;
      }
      
      // Bullet list
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        const cleanLine = line.trim().replace(/^[\*\-]\s+/, "");
        return (
          <ul key={idx} className="list-disc pl-5 my-1 text-slate-300 font-sans text-xs">
            <li>{parseInlineBold(cleanLine)}</li>
          </ul>
        );
      }

      // Ordered list
      if (/^\d+\.\s+/.test(line.trim())) {
        const cleanLine = line.trim().replace(/^\d+\.\s+/, "");
        return (
          <ol key={idx} className="list-decimal pl-5 my-1 text-slate-300 font-sans text-xs">
            <li>{parseInlineBold(cleanLine)}</li>
          </ol>
        );
      }

      // Empty space
      if (!line.trim()) {
        return <div key={idx} className="h-2"></div>;
      }

      // Standalone text
      return <p key={idx} className="my-1 text-slate-300 font-sans text-xs leading-relaxed">{parseInlineBold(line)}</p>;
    });
  };

  // Basic regex parser for inline **bolding** and colors
  const parseInlineBold = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const text = part.slice(2, -2);
        // Add color coding to status highlights
        if (text.includes("kosong") || text.includes("empty") || text.includes("Available")) {
          return <span key={i} className="font-semibold text-emerald-400 bg-emerald-950/40 px-1 rounded">{text}</span>;
        }
        if (text.includes("overdue") || text.includes("terlambat") || text.includes("terlewat")) {
          return <span key={i} className="font-semibold text-rose-400 bg-rose-950/40 px-1 rounded">{text}</span>;
        }
        if (text.includes("active") || text.includes("leased") || text.includes("aktif")) {
          return <span key={i} className="font-semibold text-cyan-400 bg-cyan-950/40 px-1 rounded">{text}</span>;
        }
        return <strong key={i} className="font-bold text-white">{text}</strong>;
      }
      return part;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            id="assistant-backdrop"
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity"
          />

          {/* Drawer Panel */}
          <motion.div
            id="assistant-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-110 bg-slate-900 border-l border-slate-800 z-50 flex flex-col shadow-2xl h-screen"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-cyan-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-sm text-white flex items-center gap-1.5">
                    TPMS AI Assistant
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  </h3>
                  <p className="font-sans text-[10px] text-slate-400">
                    Konteks data aktif: {buildings.length} Gedung, {units.length} Unit
                  </p>
                </div>
              </div>
              <button 
                id="btn-close-assistant"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/40 scrollbar-thin">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-cyan-400" />
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 shadow-sm font-sans ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white rounded-br-none' 
                      : 'bg-slate-950 border border-slate-800 text-slate-100 rounded-bl-none'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-xs leading-relaxed">{msg.content}</p>
                    ) : (
                      renderFormattedText(msg.content)
                    )}
                    <span className="block text-[9px] text-slate-500 mt-1.5 text-right font-mono">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-cyan-400 font-bold text-xs uppercase font-sans">
                      ME
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0 animate-spin">
                    <RefreshCw className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl rounded-bl-none px-4 py-2.5 text-xs text-slate-400 font-sans flex items-center gap-2">
                    <span>Sedang mengolah basis data operasional...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions (Sample Questions) */}
            {messages.length < 3 && !loading && (
              <div className="p-3 border-t border-slate-800/60 bg-slate-950/20">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-sans px-1">
                  💡 Pintasan Pertanyaan Cepat:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {sampleQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      id={`sample-question-${idx}`}
                      onClick={() => handleSend(q.query)}
                      className="text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white p-2 rounded-lg text-[11px] font-sans transition-all duration-150 flex flex-col justify-between"
                    >
                      <span className="font-semibold text-cyan-400 mb-0.5">{q.label}</span>
                      <span className="text-slate-500 truncate text-[10px]">{q.query}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex gap-2">
              <input
                id="assistant-chat-input"
                type="text"
                placeholder="Tanyakan unit kosong, status sewa, tagihan..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-lg px-3 py-2 text-xs font-sans outline-hidden placeholder-slate-500"
              />
              <button
                id="btn-send-assistant-chat"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 p-2 rounded-lg transition shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
