/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StatementData, ChatMessage } from './types';
import { getSampleStatement, padZero } from './utils';
import InputForm from './components/InputForm';
import DocumentPreview from './components/DocumentPreview';
import AdminPortal from './components/AdminPortal';
import Chatbox from './components/Chatbox';
import { 
  Users, 
  Shield, 
  Layers, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Printer, 
  X,
  Sparkles,
  Bookmark,
  FileText,
  PlusCircle,
  MessageSquare
} from 'lucide-react';

export default function App() {
  // Global Role: 'user' | 'admin'
  const [activePortal, setActivePortal] = useState<'user' | 'admin'>('user');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'input' | 'preview'>('input');

  // Currently active statement being edited/viewed
  const [formData, setFormData] = useState<StatementData>(() => {
    const savedDraft = localStorage.getItem('hunghong_draft_statement');
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (e) {
        // ignore and fallback
      }
    }
    return getSampleStatement();
  });

  // All saved statements (drafts, submitted, archived)
  const [statements, setStatements] = useState<StatementData[]>(() => {
    const saved = localStorage.getItem('hunghong_statements_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    
    // Default pre-seeded statements for beautiful admin display
    const sample = getSampleStatement();
    const otherSample1: StatementData = {
      ...sample,
      id: "ST-MOCK1",
      statementNo: "141/2026/BKLS",
      issueDate: "2026-07-15",
      buyerName: "Nguyễn Văn A",
      buyerCccd: "01234560123456",
      buyerAddress: "Tổ 20, Phường Ngọc Hà, TP Hà Giang",
      buyerPhone: "0915 123 456",
      speciesName: "Chim chào mào",
      scientificName: "Pycnonotus jocosus",
      maleCount: 2,
      femaleCount: 2,
      unknownCount: 0,
      weightPerIndividual: 0.03, // 4 * 0.03 = 0.12 kg total
      vehiclePlate: "Xe máy",
      toAddress: "Hộ kinh doanh Nguyễn Văn A, Tổ 20, Phường Ngọc Hà, TP Hà Giang",
      status: 'submitted',
      createdAt: "2026-07-15T14:30:00.000Z"
    };

    const otherSample2: StatementData = {
      ...sample,
      id: "ST-MOCK2",
      statementNo: "002/2026/BKLS",
      issueDate: "2026-07-16",
      buyerName: "Lê Văn B",
      buyerCccd: "030096001234",
      buyerAddress: "789 Trần Hưng Đạo, Hải Phòng",
      buyerPhone: "0904.555.666",
      speciesName: "Chim chào mào",
      scientificName: "Pycnonotus jocosus",
      maleCount: 10,
      femaleCount: 15,
      unknownCount: 0,
      weightPerIndividual: 0.01,
      vehiclePlate: "Tự vận chuyển",
      toAddress: "Hộ kinh doanh Lê Văn B, 789 Trần Hưng Đạo, Hải Phòng",
      status: 'submitted',
      createdAt: "2026-07-16T09:15:00.000Z"
    };

    return [otherSample1, otherSample2];
  });

  // Chat message state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('hunghong_chat_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Submitted Thank-you Popup State
  const [showThankYouPopup, setShowThankYouPopup] = useState<boolean>(false);
  const [submittedId, setSubmittedId] = useState<string>('');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('hunghong_statements_list', JSON.stringify(statements));
  }, [statements]);

  useEffect(() => {
    localStorage.setItem('hunghong_chat_messages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Actions
  const handleFillSample = () => {
    const sample = getSampleStatement();
    setFormData(sample);
  };

  const handleSaveDraft = () => {
    const draft: StatementData = {
      ...formData,
      status: 'draft',
      updatedAt: new Date().toISOString()
    };
    
    // Save to active state and localStorage
    setFormData(draft);
    localStorage.setItem('hunghong_draft_statement', JSON.stringify(draft));
    
    // Also save to global list if not already there, or update it
    setStatements(prev => {
      const exists = prev.find(s => s.id === draft.id);
      if (exists) {
        return prev.map(s => s.id === draft.id ? draft : s);
      } else {
        return [draft, ...prev];
      }
    });

    alert("Đã lưu bản nháp thành công vào hệ thống!");
  };

  const getFiveDaysLaterStr = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  };

  const getNextStatementNo = (currentNo: string): string => {
    if (!currentNo) return "001";
    const match = currentNo.match(/^(\d+)(.*)$/);
    if (match) {
      const numStr = match[1];
      const suffix = match[2];
      const nextNum = parseInt(numStr, 10) + 1;
      const paddedNum = nextNum.toString().padStart(numStr.length, '0');
      return paddedNum + suffix;
    }
    if (/^\d+$/.test(currentNo)) {
      const nextNum = parseInt(currentNo, 10) + 1;
      return nextNum.toString().padStart(currentNo.length, '0');
    }
    return currentNo;
  };

  const handleResetForm = (force = false) => {
    const shouldReset = force || formData.status === 'submitted' || formData.status === 'archived' || window.confirm("Bạn có muốn xóa toàn bộ nội dung đã nhập để làm mới?");
    if (shouldReset) {
      const nextNo = getNextStatementNo(formData.statementNo);
      const cleared: StatementData = {
        id: "ST-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        statementNo: nextNo,
        issueDate: new Date().toISOString().split('T')[0],
        buyerName: "",
        buyerCccd: "",
        buyerAddress: "",
        buyerPhone: "",
        buyerEmail: "",
        speciesName: formData.speciesName || "",
        scientificName: formData.scientificName || "",
        maleCount: 0,
        femaleCount: 0,
        unknownCount: 0,
        weightPerIndividual: formData.weightPerIndividual || 1,
        vehiclePlate: formData.vehiclePlate || "",
        fromDate: new Date().toISOString().split('T')[0],
        toDate: getFiveDaysLaterStr(new Date().toISOString().split('T')[0]),
        fromAddress: formData.fromAddress || "Trại nuôi Đinh Văn Hùng, Thôn Lập Thành, Đông Yên, Quốc Oai, Hà Nội",
        toAddress: "",
        status: 'draft',
        createdAt: new Date().toISOString()
      };
      setFormData(cleared);
      localStorage.removeItem('hunghong_draft_statement');
    }
  };

  const handleSubmitStatement = () => {
    // Basic validation
    if (!formData.statementNo || !formData.buyerName || !formData.buyerCccd || !formData.speciesName || !formData.vehiclePlate) {
      alert("Vui lòng nhập đầy đủ các trường thông tin bắt buộc (được đánh dấu dấu sao đỏ * ) trước khi gửi!");
      return;
    }

    const submission: StatementData = {
      ...formData,
      status: 'submitted',
      createdAt: new Date().toISOString()
    };

    // Save to list
    setStatements(prev => {
      const exists = prev.find(s => s.id === submission.id);
      if (exists) {
        return prev.map(s => s.id === submission.id ? submission : s);
      } else {
        return [submission, ...prev];
      }
    });

    // Lock active form data state
    setFormData(submission);
    setSubmittedId(submission.id);
    setShowThankYouPopup(true);
    
    // Clear draft storage
    localStorage.removeItem('hunghong_draft_statement');
  };

  // User sends a chat message
  const handleUserSendMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);

    // Simulated reply from Đinh Văn Hùng after 1.5 seconds
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'admin',
        text: `Chào bạn, tôi đã nhận được thông tin: "${text}". Đội ngũ của Đinh Văn Hùng đang kiểm tra và sẽ phản hồi trực tiếp cho bạn ngay!`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, replyMsg]);
    }, 1500);
  };

  // Admin replies to chat
  const handleAdminReplyMessage = (text: string) => {
    const adminMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'admin',
      text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, adminMsg]);
  };

  // When admin selects a statement from list, load it in view
  const handleSelectActiveStatement = (statement: StatementData) => {
    setFormData(statement);
    setActivePortal('user'); // switch back to user portal to view document
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* GLOBAL TOP NAVIGATION */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Branding */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-indigo-100 flex-shrink-0">
                VH
              </div>
              <div>
                <h1 className="font-extrabold text-slate-900 text-sm md:text-base leading-tight">
                  BẢNG KÊ ĐVHD – ĐINH VĂN HÙNG
                </h1>
                <p className="text-[10px] md:text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  Trại nuôi sinh sản động vật hoang dã dã ngoại hợp pháp
                </p>
              </div>
            </div>

            {/* Portal Switcher */}
            <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs font-bold shadow-inner">
              <button
                onClick={() => setActivePortal('user')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition cursor-pointer ${
                  activePortal === 'user' 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CỔNG NGƯỜI DÙNG</span>
                <span className="sm:hidden">USER</span>
              </button>
              
              <button
                onClick={() => setActivePortal('admin')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition cursor-pointer ${
                  activePortal === 'admin' 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CỔNG QUẢN TRỊ (ADMIN)</span>
                <span className="sm:hidden">ADMIN</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* PORTAL MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-h-0">
        {activePortal === 'user' ? (
          /* USER PORTAL: Left input, Right preview */
          <div className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-6 flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 overflow-hidden">
            
            {/* Mobile-only Tab Switcher */}
            <div className="lg:hidden flex p-1 bg-slate-200/80 rounded-xl mx-2 border border-slate-300/40">
              <button
                onClick={() => setMobileTab('input')}
                className={`flex-1 py-2 px-3 text-center text-xs font-black rounded-lg transition-all ${
                  mobileTab === 'input'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 font-semibold'
                }`}
              >
                1. NHẬP THÔNG TIN
              </button>
              <button
                onClick={() => setMobileTab('preview')}
                className={`flex-1 py-2 px-3 text-center text-xs font-black rounded-lg transition-all ${
                  mobileTab === 'preview'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 font-semibold'
                }`}
              >
                2. XEM TRƯỚC BẢNG KÊ
              </button>
            </div>

            {/* Left Side: Inputs */}
            <div className={`lg:col-span-5 h-[calc(100vh-210px)] lg:h-[calc(100vh-160px)] min-h-[450px] ${mobileTab === 'input' ? 'block' : 'hidden lg:block'}`}>
              <InputForm 
                formData={formData}
                setFormData={setFormData}
                onFillSample={handleFillSample}
                onSaveDraft={handleSaveDraft}
                onSubmit={handleSubmitStatement}
                onReset={handleResetForm}
                isAdmin={isAdminLoggedIn}
              />
            </div>

            {/* Right Side: High-fidelity document rendering */}
            <div className={`lg:col-span-7 h-[calc(100vh-210px)] lg:h-[calc(100vh-160px)] min-h-[450px] ${mobileTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
              <DocumentPreview data={formData} isAdmin={isAdminLoggedIn} />
            </div>

          </div>
        ) : (
          /* ADMIN PORTAL */
          <AdminPortal 
            statements={statements}
            setStatements={setStatements}
            chatMessages={chatMessages}
            onReplyToChat={handleAdminReplyMessage}
            onSelectActiveStatement={handleSelectActiveStatement}
            isAdminLoggedIn={isAdminLoggedIn}
            setIsAdminLoggedIn={setIsAdminLoggedIn}
          />
        )}
      </main>

      {/* FLOATING CLIENT CHATBOX */}
      <Chatbox 
        messages={chatMessages}
        onSendMessage={handleUserSendMessage}
      />

      {/* --- THANK YOU / POPUP CẢM ƠN SAU KHI GỬI --- */}
      {showThankYouPopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 max-w-md w-full text-center shadow-2xl relative overflow-hidden animate-scale-up">
            
            {/* Background sparkle accents */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-tr from-indigo-50 to-violet-50 rounded-full blur-2xl -z-10" />

            <button 
              onClick={() => setShowThankYouPopup(false)}
              className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Animated Celebration Icon */}
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100 transform hover:rotate-12 transition">
              <CheckCircle className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-black text-slate-800 tracking-tight leading-snug">
              CƠ SỞ ĐINH VĂN HÙNG<br/>XIN CHÂN THÀNH CẢM ƠN QUÝ KHÁCH!
            </h3>
            
            <p className="text-slate-500 text-xs md:text-sm mt-3 leading-relaxed">
              Hệ thống đã lưu trữ thành công và sinh bảng kê của bạn dưới số hồ sơ chính thức:
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 py-2.5 px-6 rounded-2xl font-mono text-base font-bold text-amber-700 mt-4 inline-block tracking-wider">
              {formData.statementNo || "001/26/BKLS"}
            </div>

            <div className="border-t border-slate-100 mt-6 pt-5 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    setShowThankYouPopup(false);
                    const doc = statements.find(s => s.id === submittedId);
                    if (doc) downloadDocx(doc);
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>TẢI WORD</span>
                </button>

                <button
                  onClick={() => {
                    setShowThankYouPopup(false);
                    window.print();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>IN BẢNG KÊ</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setShowThankYouPopup(false);
                  handleResetForm(true); // force reset to start new
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <PlusCircle className="w-4.5 h-4.5" />
                <span>TẠO BẢNG KÊ MỚI TIẾP THEO</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-400 font-medium mt-4">
              * Bản kê này được khóa tự động sau khi gửi để bảo vệ tính pháp lý của hồ sơ.
            </p>

          </div>
        </div>
      )}

    </div>
  );
}
