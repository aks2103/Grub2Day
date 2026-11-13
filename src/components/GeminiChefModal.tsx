import React, { useState } from 'react';
import { X, Sparkles, Send, ChefHat } from 'lucide-react';
import { askGeminiChef } from '../services/geminiAiService';

interface GeminiChefModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDishName: string;
}

export const GeminiChefModal: React.FC<GeminiChefModalProps> = ({
  isOpen,
  onClose,
  currentDishName,
}) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'gemini'; text: string }>>([
    {
      sender: 'gemini',
      text: `Namaste! I'm your Gemini Sous Chef. Looking at "${currentDishName || 'today’s menu'}", how can I help you today? Need a quick ingredient substitute, toddler spice tweak, or 15-minute shortcut?`,
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (qText?: string) => {
    const textToSend = qText || question;
    if (!textToSend.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    setQuestion('');
    setIsThinking(true);

    try {
      const response = await askGeminiChef(textToSend, currentDishName);
      setMessages(prev => [...prev, { sender: 'gemini', text: response }]);
    } catch {
      setMessages(prev => [...prev, { 
        sender: 'gemini', 
        text: 'Keep it gentle and simple! A fresh tadka of cumin and ghee adds instant love.' 
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const QUICK_QUESTIONS = [
    `How to make ${currentDishName.split(' ')[0]} in 15 mins?`,
    `What raita or salad pairs best with this?`,
    `Substitute if I run out of tomatoes?`,
    `How to feed this to my 3-year-old?`,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden"
        role="dialog"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <ChefHat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Gemini Desi Sous Chef
              </h3>
              <p className="text-[11px] text-amber-800 font-medium">
                Dish: {currentDishName || "Today's Meal"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Stream */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-white text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-amber-500 text-white rounded-br-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-xs'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-2xl flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Gemini Chef is crafting culinary advice...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar">
          {QUICK_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] text-slate-600 font-medium whitespace-nowrap hover:bg-amber-50 hover:border-amber-300 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-100 bg-white flex gap-2">
          <input
            type="text"
            placeholder="Ask anything (e.g. quick substitute, kid spice tweak)..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white"
          />
          <button
            onClick={() => handleSend()}
            disabled={!question.trim() || isThinking}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
