import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Sparkles, ChevronDown, Copy, Check } from 'lucide-react';
import { chatAPI } from '../utils/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  options?: {
    type: string;
    question: string;
    options: Array<{ value: string; label: string }>;
  };
}

interface DropdownChatbotProps {
  onPromptGenerated?: (prompt: string, data: any) => void;
}

export default function DropdownChatbot({ onPromptGenerated }: DropdownChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! 👋 I\'m your Thumbify AI assistant!\n\nI\'ll help you create the perfect thumbnail by asking you some questions about your channel.\n\n**Let\'s start!** What\'s your YouTube channel name?',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('initial');
  const [thumbnailData, setThumbnailData] = useState({});
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const sendMessage = async (messageText?: string, isOptionClick = false) => {
    const messageToSend = messageText || inputMessage;
    if (!messageToSend.trim() || isLoading) return;

    // Only add user message to chat if it's not an option click or if it's text input
    if (!isOptionClick) {
      const userMessage: Message = {
        role: 'user',
        content: messageToSend,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
    }

    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await chatAPI.sendMessage(messageToSend, [], currentStep, thumbnailData);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        options: response.data.showOptions || undefined,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (response.data.nextStep) {
        setCurrentStep(response.data.nextStep);
      }
      
      if (response.data.thumbnailData) {
        setThumbnailData(response.data.thumbnailData);
      }

      if (response.data.generatedPrompt) {
        setGeneratedPrompt(response.data.generatedPrompt);
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: error.response?.data?.error || error.response?.data?.message || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = (optionValue: string, optionLabel: string) => {
    // Add user's selection as a message
    const userMessage: Message = {
      role: 'user',
      content: optionLabel,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Send the value to backend
    sendMessage(optionValue, true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyPrompt = () => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const usePrompt = () => {
    if (generatedPrompt && onPromptGenerated) {
      onPromptGenerated(generatedPrompt, thumbnailData);
      setIsOpen(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hi! 👋 I\'m your Thumbify AI assistant!\n\nI\'ll help you create the perfect thumbnail by asking you some questions about your channel.\n\n**Let\'s start!** What\'s your YouTube channel name?',
        timestamp: new Date(),
      }
    ]);
    setCurrentStep('initial');
    setThumbnailData({});
    setGeneratedPrompt(null);
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-indigo-500/50 transition-all text-sm"
      >
        <Sparkles className="w-4 h-4" />
        <span>AI Assistant</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* Dropdown Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 right-0 w-96 bg-gray-900/95 backdrop-blur-xl border-2 border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-white" />
                <div>
                  <h3 className="font-bold text-white text-sm">AI Thumbnail Helper</h3>
                  <p className="text-xs text-white/80">Answer questions to get perfect prompt</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetChat}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors text-xs text-white/80 hover:text-white"
                  title="Start Over"
                >
                  Reset
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Messages Container */}
            <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-950/50">
              {messages.map((message, index) => (
                <div key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                        message.role === 'user'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-white/10 text-gray-100'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </motion.div>

                  {/* Show option buttons if available */}
                  {message.options && message.role === 'assistant' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 space-y-2"
                    >
                      <p className="text-xs text-gray-400 font-medium px-1">
                        {message.options.question}
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {message.options.options.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleOptionClick(option.value, option.label)}
                            disabled={isLoading}
                            className="px-4 py-2.5 bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/50 rounded-xl text-left text-sm text-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span className="text-sm text-gray-300">Thinking...</span>
                  </div>
                </motion.div>
              )}

              {/* Show generated prompt actions */}
              {generatedPrompt && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-green-400 uppercase">✨ Prompt Generated!</p>
                    <button
                      onClick={copyPrompt}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      {copiedPrompt ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={usePrompt}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      Use This Prompt
                    </button>
                    <button
                      onClick={copyPrompt}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg text-sm font-medium transition-all"
                    >
                      Copy
                    </button>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-gray-900/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your answer..."
                  disabled={isLoading}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition disabled:opacity-50 text-sm"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-colors flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {currentStep === 'complete' ? 'Chat complete! Start a new one to create another.' : 'Press Enter to send'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}