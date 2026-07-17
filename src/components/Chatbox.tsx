/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { MessageSquare, X, Send, User, ChevronDown } from 'lucide-react';

interface ChatboxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export default function Chatbox({ messages, onSendMessage }: ChatboxProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      
      {/* Toggle Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-full shadow-lg shadow-indigo-200 flex items-center justify-center transform hover:scale-110 active:scale-95 transition cursor-pointer relative"
        >
          <MessageSquare className="w-6 h-6 animate-pulse-subtle" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] text-white font-bold rounded-full flex items-center justify-center border-2 border-white">
            1
          </span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="w-[330px] h-[440px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scale-up">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <div>
                <h4 className="font-bold text-xs tracking-wide uppercase">HỖ TRỢ ĐINH VĂN HÙNG</h4>
                <p className="text-[10px] text-indigo-100 font-medium">Hỗ trợ kỹ thuật 24/7</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/15 rounded-lg transition text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages lists */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/70">
            {/* System initial message */}
            <div className="flex gap-2 items-start max-w-[85%]">
              <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold border border-indigo-100 flex-shrink-0">
                AD
              </div>
              <div>
                <div className="bg-white border border-slate-200 p-2.5 rounded-2xl rounded-tl-none text-[11px] text-slate-700 shadow-xs">
                  Chào bạn! Tôi là Đinh Văn Hùng. Bạn cần hỗ trợ gì về thủ tục lập bảng kê động vật hoang dã dã ngoại hợp pháp?
                </div>
                <span className="text-[9px] text-slate-400 mt-1 block ml-1">Đã gửi</span>
              </div>
            </div>

            {/* Render dynamically passed messages */}
            {messages.map(msg => (
              <div 
                key={msg.id}
                className={`flex gap-2 items-start max-w-[85%] ${
                  msg.sender === 'admin' ? '' : 'ml-auto flex-row-reverse'
                }`}
              >
                {msg.sender === 'admin' ? (
                  <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold border border-indigo-100 flex-shrink-0">
                    AD
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    KH
                  </div>
                )}
                <div className={msg.sender === 'admin' ? '' : 'text-right'}>
                  <div 
                    className={`p-2.5 rounded-2xl text-[11px] shadow-xs ${
                      msg.sender === 'admin'
                        ? 'bg-white text-slate-700 border border-slate-200 rounded-tl-none text-left'
                        : 'bg-indigo-600 text-white rounded-tr-none text-left'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 block px-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick options helpers */}
          <div className="p-2 border-t border-slate-100 bg-white flex gap-1 overflow-x-auto whitespace-nowrap scrollbar-none">
            <button
              onClick={() => {
                setInput('Làm thế nào để tải bản kê Word?');
              }}
              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium px-2 py-1 rounded-full transition"
            >
              Tải bản kê Word?
            </button>
            <button
              onClick={() => {
                setInput('Số CCCD người mua có bảo mật không?');
              }}
              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium px-2 py-1 rounded-full transition"
            >
              CCCD bảo mật?
            </button>
            <button
              onClick={() => {
                setInput('Có cần đóng dấu Hạt kiểm lâm không?');
              }}
              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium px-2 py-1 rounded-full transition"
            >
              Có cần đóng dấu Kiểm lâm?
            </button>
          </div>

          {/* Input Sender Form */}
          <div className="p-3 bg-slate-50 border-t border-slate-100">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập nội dung cần hỗ trợ..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white focus:border-indigo-500"
              />
              <button
                type="submit"
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 transition flex items-center justify-center cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
