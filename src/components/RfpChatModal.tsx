import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Sparkles, Bot, User, FileText } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/useApi';

interface RfpChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (rfpData: any) => void;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

const INITIAL_MESSAGE: Message = {
    role: 'model',
    content: "Hi! I'm your procurement assistant. What are you looking to buy today? (e.g., '50 Laptops for engineering team')"
};

export function RfpChatModal({ isOpen, onClose, onGenerate }: RfpChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>(['Laptops', 'Servers', 'Office Furniture', 'Consulting Services']);
  const scrollRef = useRef<HTMLDivElement>(null);

  // API Hooks
  const sendMessageApi = useCallback(async (data: { history: Message[], message: string }) => {
    const res = await axiosInstance.post('rfp/chat/message', data);
    return res.data;
  }, []);

  const generateRfpApi = useCallback(async (data: { history: Message[] }) => {
    const res = await axiosInstance.post('rfp/chat/generate', data);
    return res.data;
  }, []);

  const { execute: sendMessage, loading: isSending } = useApi(sendMessageApi);
  const { execute: generateRfp, loading: isGenerating } = useApi(generateRfpApi);

  // Clear chat on close
  useEffect(() => {
    if (!isOpen) {
      // Small timeout to not flash empty state while closing animation plays
      const timer = setTimeout(() => {
          setMessages([INITIAL_MESSAGE]);
          setSuggestions(['Laptops', 'Servers', 'Office Furniture', 'Consulting Services']);
          setInput('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
       const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
       if (scrollArea) {
           scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: 'smooth' });
       }
    }
  }, [messages, isSending]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    // Add user message immediately
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSuggestions([]);

    try {
      const result = await sendMessage({
        history: [...messages, userMsg],
        message: text
      });

      const { message: modelResponse, suggestions: newSuggestions, readyToGenerate } = result;

      const newHistory = [...messages, userMsg, { role: 'model', content: modelResponse } as Message];
      setMessages(newHistory);
      setSuggestions(newSuggestions || []);

      if (readyToGenerate) {
          triggerGeneration(newHistory);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I had trouble connecting. Please try again." }]);
    }
  };

  const triggerGeneration = async (finalHistory: Message[]) => {
      try {
        const result = await generateRfp({ history: finalHistory });
        onGenerate(result);
        onClose();
      } catch (error) {
        console.error(error);
        // Error handling is managed by the hook somewhat, but we can alert specific msg
        alert("Failed to generate RFP");
      }
  }

  const handleManualGenerate = () => triggerGeneration(messages);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden border-none shadow-2xl bg-white">

        {/* Header */}
        <DialogHeader className="p-4 border-b bg-gradient-to-r from-indigo-50 to-white flex flex-row items-center justify-between shrink-0">
          <DialogTitle className="flex items-center gap-2.5 text-xl font-semibold text-indigo-950">
            <div className="p-2 bg-indigo-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-indigo-600" />
            </div>
            AI Procurement Assistant
          </DialogTitle>

        </DialogHeader>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden relative bg-slate-50/50" ref={scrollRef}>
             <ScrollArea className="h-full p-6">
                <div className="space-y-6 pb-4 max-w-3xl mx-auto">
                {messages.map((msg, idx) => (
                    <div
                    key={idx}
                    className={cn(
                        "flex w-full gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                        msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                    >
                    {msg.role === 'model' && (
                        <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-indigo-100">
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                                <Bot className="h-5 w-5" />
                            </AvatarFallback>
                        </Avatar>
                    )}

                    <div
                        className={cn(
                        "max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm",
                        msg.role === 'user'
                            ? "bg-indigo-600 text-white rounded-br-none shadow-indigo-200"
                            : "bg-white border border-slate-200 rounded-bl-none text-slate-800"
                        )}
                    >
                        {msg.content}
                    </div>

                    {msg.role === 'user' && (
                        <Avatar className="h-9 w-9 border-2 border-white shadow-sm bg-slate-200">
                            <AvatarFallback><User className="h-5 w-5 text-slate-600" /></AvatarFallback>
                        </Avatar>
                    )}
                    </div>
                ))}

                {/* Loading Indicator */}
                {isSending && (
                    <div className="flex w-full gap-4 justify-start animate-in fade-in duration-300">
                         <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-indigo-100">
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                                <Bot className="h-5 w-5" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm">
                            <div className="flex gap-1.5 items-center h-full">
                                <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    </div>
                )}
                </div>
            </ScrollArea>
        </div>

        {/* Suggestions & Input Area */}
        <div className="bg-white border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
            {suggestions.length > 0 && !isSending && (
                <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar mask-gradient-x">
                    {suggestions.map((s, i) => (
                        <Badge
                            key={i}
                            variant="secondary"
                            className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 border-indigo-100 px-3 py-1.5 transition-all active:scale-95 whitespace-nowrap"
                            onClick={() => handleSend(s)}
                        >
                            {s}
                        </Badge>
                    ))}
                </div>
            )}

            <div className="p-4 space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-3 items-center relative"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your reply..."
                  disabled={isSending || isGenerating}
                  className="flex-1 pl-4 pr-12 py-6 rounded-xl border-slate-200 focus-visible:ring-indigo-500 bg-slate-50 focus:bg-white transition-all shadow-inner"
                  autoFocus
                />
                <Button
                    type="submit"
                    disabled={isSending || isGenerating || !input.trim()}
                    className={cn(
                        "absolute right-2 rounded-lg h-9 w-9 p-0 transition-all duration-300",
                        input.trim() ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-200 text-slate-400 hover:bg-slate-200"
                    )}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>

              <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t border-dashed border-slate-100">
                 <Button
                    variant="ghost"
                    onClick={onClose}
                    disabled={isGenerating}
                    className="w-full sm:w-auto text-slate-500 hover:text-slate-800"
                 >
                    Cancel
                 </Button>
                 <Button
                    onClick={handleManualGenerate}
                    disabled={messages.length < 3 || isGenerating || isSending}
                    className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02]"
                 >
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generatiing RFP...
                        </>
                    ) : (
                        <>
                            <FileText className="mr-2 h-4 w-4" />
                            Generate & Review Form
                        </>
                    )}
                 </Button>
              </DialogFooter>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
