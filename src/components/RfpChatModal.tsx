import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Sparkles, Bot, User, FileText } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { cn } from '@/lib/utils';

interface RfpChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (rfpData: any) => void;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

export function RfpChatModal({ isOpen, onClose, onGenerate }: RfpChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hi! I'm your procurement assistant. What are you looking to buy today? (e.g., '50 Laptops for engineering team')" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(['Laptops', 'Servers', 'Office Furniture', 'Consulting Services']);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        // Scroll to bottom
       const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
       if (scrollArea) {
           scrollArea.scrollTop = scrollArea.scrollHeight;
       }
    }
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setSuggestions([]);

    try {
      // Send to backend
      const res = await axiosInstance.post('rfp/chat/message', {
        history: [...messages, userMsg],
        message: text
      });

      const { message: modelResponse, suggestions: newSuggestions, readyToGenerate } = res.data;

      const newHistory = [...messages, userMsg, { role: 'model', content: modelResponse } as Message];
      setMessages(newHistory);
      setSuggestions(newSuggestions || []);

      if (readyToGenerate) {
          // Auto-trigger generation with the updated history
          await triggerGeneration(newHistory);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I had trouble connecting. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerGeneration = async (finalHistory: Message[]) => {
      setIsGenerating(true);
      try {
        const res = await axiosInstance.post('rfp/chat/generate', {
            history: finalHistory
        });
        onGenerate(res.data);
        onClose();
      } catch (error) {
        console.error(error);
        alert("Failed to generate RFP");
      } finally {
        setIsGenerating(false);
      }
  }

  // Manual generation backup (passes current messages)
  const handleManualGenerate = () => triggerGeneration(messages);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b bg-muted/20">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI RFP Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden relative bg-slate-50 dark:bg-slate-900/50" ref={scrollRef}>
             <ScrollArea className="h-full p-4">
                <div className="space-y-6 pb-4">
                {messages.map((msg, idx) => (
                    <div
                    key={idx}
                    className={cn(
                        "flex w-full gap-3",
                        msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                    >
                    {msg.role === 'model' && (
                        <Avatar className="h-8 w-8 border bg-primary/10">
                            <AvatarFallback><Bot className="h-4 w-4 text-primary" /></AvatarFallback>
                            <AvatarImage src="/bot-avatar.png" />
                        </Avatar>
                    )}

                    <div
                        className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                        msg.role === 'user'
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-background border rounded-bl-none text-foreground"
                        )}
                    >
                        {msg.content}
                    </div>

                    {msg.role === 'user' && (
                        <Avatar className="h-8 w-8 border bg-muted">
                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                    )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex w-full gap-3 justify-start">
                         <Avatar className="h-8 w-8 border bg-primary/10">
                            <AvatarFallback><Bot className="h-4 w-4 text-primary" /></AvatarFallback>
                        </Avatar>
                        <div className="bg-background border rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                            <div className="flex gap-1">
                                <span className="animate-bounce delay-0">.</span>
                                <span className="animate-bounce delay-150">.</span>
                                <span className="animate-bounce delay-300">.</span>
                            </div>
                        </div>
                    </div>
                )}
                </div>
            </ScrollArea>
        </div>

        {/* Suggestions Area */}
        {suggestions.length > 0 && !isLoading && (
            <div className="px-4 py-2 bg-background border-t flex gap-2 overflow-x-auto no-scrollbar">
                {suggestions.map((s, i) => (
                    <Badge
                        key={i}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary/20 whitespace-nowrap px-3 py-1"
                        onClick={() => handleSend(s)}
                    >
                        {s}
                    </Badge>
                ))}
            </div>
        )}

        <div className="p-4 bg-background border-t space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your reply..."
              disabled={isLoading || isGenerating}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" size="icon" disabled={isLoading || isGenerating || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>

          <DialogFooter className="flex-col sm:flex-row gap-2">
             <Button
                variant="outline"
                onClick={onClose}
                disabled={isGenerating}
                className="w-full sm:w-auto"
             >
                Cancel
             </Button>
             <Button
                onClick={handleManualGenerate}
                disabled={messages.length < 3 || isGenerating || isLoading}
                className="w-full sm:w-auto gradient-bg"
             >
                {isGenerating ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating RFP...
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
      </DialogContent>
    </Dialog>
  );
}
