/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StatementData, ChatMessage } from '../types';
import { padZero, formatVietnameseDate, downloadDocx } from '../utils';
import { 
  Lock, 
  LogIn, 
  Search, 
  Archive, 
  Trash2, 
  Edit3, 
  Printer, 
  FileDown, 
  MessageSquare, 
  Shield, 
  User, 
  CheckCircle,
  Eye,
  LogOut,
  X,
  Send,
  Calendar,
  Layers
} from 'lucide-react';

interface AdminPortalProps {
  statements: StatementData[];
  setStatements: React.Dispatch<React.SetStateAction<StatementData[]>>;
  chatMessages: ChatMessage[];
  onReplyToChat: (text: string) => void;
  onSelectActiveStatement: (statement: StatementData) => void;
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function AdminPortal({
  statements,
  setStatements,
  chatMessages,
  onReplyToChat,
  onSelectActiveStatement,
  isAdminLoggedIn,
  setIsAdminLoggedIn
}: AdminPortalProps) {
  // Login State
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Dashboard Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Edit Modal State
  const [editingStatement, setEditingStatement] = useState<StatementData | null>(null);

  // Admin Chat Reply Input
  const [replyText, setReplyText] = useState<string>('');

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'dinhhai' && password === '123') {
      setIsAdminLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Sai tài khoản hoặc mật khẩu quản trị!');
    }
  };

  // Archive Statement
  const handleArchive = (id: string) => {
    setStatements(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'archived' } : item
    ));
  };

  // Delete Statement
  const handleDelete = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bản kê này khỏi hệ thống?")) {
      setStatements(prev => prev.filter(item => item.id !== id));
    }
  };

  // Quick edit save
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStatement) return;
    setStatements(prev => prev.map(item => 
      item.id === editingStatement.id ? editingStatement : item
    ));
    setEditingStatement(null);
  };

  // Log out
  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  // Filtered statements
  const filteredStatements = statements.filter(item => {
    const matchesSearch = 
      item.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.statementNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.speciesName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Totals calculations
  const totalStatements = statements.length;
  const submittedCount = statements.filter(s => s.status === 'submitted').length;
  const archivedCount = statements.filter(s => s.status === 'archived').length;
  
  const totalAnimalCount = statements.reduce((acc, curr) => {
    return acc + curr.maleCount + curr.femaleCount + curr.unknownCount;
  }, 0);

  // --- LOGIN PANEL ---
  if (!isAdminLoggedIn) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-indigo-100">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">ĐĂNG NHẬP ADMIN</h2>
            <p className="text-slate-500 text-sm mt-1">Truy cập bảng điều khiển quản lý bảng kê</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Tên đăng nhập</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  placeholder="Nhập tên đăng nhập"
                  required
                />
                <User className="absolute left-3 top-3.5 w-4.5 h-4.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  placeholder="Nhập mật khẩu"
                  required
                />
                <Lock className="absolute left-3 top-3.5 w-4.5 h-4.5 text-slate-400" />
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold text-center">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-50 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>ĐĂNG NHẬP</span>
            </button>
          </form>

          {/* Credentials suggestions removed for security */}
        </div>
      </div>
    );
  }

  // --- MAIN ADMIN DASHBOARD ---
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">QUẢN TRỊ BẢNG KÊ ĐVHD</h2>
            <p className="text-xs text-slate-500 font-medium">Xin chào, Quản trị viên Đinh Văn Hùng</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 rounded-lg text-xs font-bold transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>ĐĂNG XUẤT</span>
        </button>
      </div>

      {/* Admin Content Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng bảng kê</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{padZero(totalStatements)}</h3>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đã sinh bảng kê</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{padZero(submittedCount)}</h3>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lưu trữ</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{padZero(archivedCount)}</h3>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <Archive className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng cá thể xuất</p>
              <h3 className="text-2xl font-black text-indigo-600 mt-1">{padZero(totalAnimalCount)}</h3>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Dynamic Split Area: left (Statements management), right (Live chat console) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Main List Column (take 2 cols) */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col h-[520px]">
            {/* Table Header Filter */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="font-bold text-slate-700 text-sm uppercase">DANH SÁCH HỒ SƠ BẢNG KÊ</h3>
              
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm số BK, người mua..."
                    className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 bg-white"
                  />
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Status selector */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white font-medium text-slate-700"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="submitted">Đã gửi (Submitted)</option>
                  <option value="draft">Bản nháp (Draft)</option>
                  <option value="archived">Lưu trữ (Archived)</option>
                </select>
              </div>
            </div>

            {/* Table body (scrollable) */}
            <div className="flex-1 overflow-x-auto overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Số bảng kê</th>
                    <th className="px-4 py-3">Người mua</th>
                    <th className="px-4 py-3">Loài</th>
                    <th className="px-4 py-3 text-center">SL</th>
                    <th className="px-4 py-3 text-center">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredStatements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                        Không tìm thấy hồ sơ bảng kê nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredStatements.map(item => {
                      const totalCount = item.maleCount + item.femaleCount + item.unknownCount;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-800">{item.statementNo}</span>
                            <div className="text-[10px] text-slate-400 font-normal">{formatVietnameseDate(item.issueDate)}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-bold">{item.buyerName}</td>
                          <td className="px-4 py-3">
                            <span className="text-indigo-600 font-bold">{item.speciesName}</span>
                            <div className="text-[10px] text-slate-400 font-normal italic">{item.scientificName}</div>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-800">{padZero(totalCount)}</td>
                          <td className="px-4 py-3 text-center">
                            {item.status === 'submitted' && (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">Đã gửi</span>
                            )}
                            {item.status === 'draft' && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full font-bold text-[10px]">Bản nháp</span>
                            )}
                            {item.status === 'archived' && (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px]">Lưu trữ</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => onSelectActiveStatement(item)}
                              className="p-1 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 rounded transition"
                              title="Xem tài liệu gốc"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingStatement(item)}
                              className="p-1 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 rounded transition"
                              title="Sửa nhanh hồ sơ"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {item.status !== 'archived' && (
                              <button
                                onClick={() => handleArchive(item.id)}
                                className="p-1 hover:bg-slate-100 text-slate-600 hover:text-amber-600 rounded transition"
                                title="Đưa vào Lưu trữ"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => downloadDocx(item)}
                              className="p-1 hover:bg-slate-100 text-slate-600 hover:text-sky-600 rounded transition"
                              title="Tải Word"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 hover:bg-slate-100 text-slate-600 hover:text-rose-600 rounded transition"
                              title="Xóa vĩnh viễn"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Admin Chat box console (takes 1 col) */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col h-[520px]">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-indigo-600">
                <MessageSquare className="w-4 h-4" />
                <h3 className="font-bold text-slate-700 text-sm uppercase">QUẢN LÝ CHATBOX</h3>
              </div>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            </div>

            {/* Messages box list */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                  <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold">Chưa có tin nhắn nào từ người dùng.</p>
                </div>
              ) : (
                chatMessages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[85%] ${
                      msg.sender === 'admin' ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div className="text-[10px] text-slate-400 mb-0.5 font-semibold">
                      {msg.sender === 'admin' ? 'Bạn (Admin)' : 'Khách hàng'}
                    </div>
                    <div 
                      className={`px-3 py-2 rounded-2xl text-xs shadow-xs ${
                        msg.sender === 'admin' 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      {msg.timestamp}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Admin chat reply form */}
            <div className="p-3 bg-white border-t border-slate-200">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!replyText.trim()) return;
                  onReplyToChat(replyText);
                  setReplyText('');
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Nhập nội dung phản hồi khách..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* --- QUICK EDIT MODAL --- */}
      {editingStatement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600">
                <Edit3 className="w-5 h-5" />
                <h3 className="font-bold text-slate-800 text-base">CHỈNH SỬA NHANH BẢNG KÊ</h3>
              </div>
              <button 
                onClick={() => setEditingStatement(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable form) */}
            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Section 1 */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wide">1. Thông tin chung</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Số bảng kê</label>
                    <input
                      type="text"
                      value={editingStatement.statementNo}
                      onChange={(e) => setEditingStatement({ ...editingStatement, statementNo: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày lập</label>
                    <input
                      type="date"
                      value={editingStatement.issueDate}
                      onChange={(e) => setEditingStatement({ ...editingStatement, issueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wide">2. Người mua</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Họ tên người mua</label>
                    <input
                      type="text"
                      value={editingStatement.buyerName}
                      onChange={(e) => setEditingStatement({ ...editingStatement, buyerName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">CCCD</label>
                    <input
                      type="text"
                      value={editingStatement.buyerCccd}
                      onChange={(e) => setEditingStatement({ ...editingStatement, buyerCccd: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Số điện thoại</label>
                    <input
                      type="text"
                      value={editingStatement.buyerPhone}
                      onChange={(e) => setEditingStatement({ ...editingStatement, buyerPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Địa chỉ</label>
                    <input
                      type="text"
                      value={editingStatement.buyerAddress}
                      onChange={(e) => setEditingStatement({ ...editingStatement, buyerAddress: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 3 */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wide">3. Loài & Trọng lượng</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tên thông thường</label>
                    <input
                      type="text"
                      value={editingStatement.speciesName}
                      onChange={(e) => setEditingStatement({ ...editingStatement, speciesName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tên khoa học</label>
                    <input
                      type="text"
                      value={editingStatement.scientificName}
                      onChange={(e) => setEditingStatement({ ...editingStatement, scientificName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm italic outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 col-span-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Đực</label>
                      <input
                        type="number"
                        value={editingStatement.maleCount}
                        onChange={(e) => setEditingStatement({ ...editingStatement, maleCount: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-center text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Cái</label>
                      <input
                        type="number"
                        value={editingStatement.femaleCount}
                        onChange={(e) => setEditingStatement({ ...editingStatement, femaleCount: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-center text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">KXĐ</label>
                      <input
                        type="number"
                        value={editingStatement.unknownCount}
                        onChange={(e) => setEditingStatement({ ...editingStatement, unknownCount: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-center text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">KL/Con</label>
                      <input
                        type="number"
                        value={editingStatement.weightPerIndividual}
                        onChange={(e) => setEditingStatement({ ...editingStatement, weightPerIndividual: Math.max(0.1, parseFloat(e.target.value) || 0.1) })}
                        step="0.1"
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-center text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4 */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wide">4. Vận chuyển</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Biển số xe</label>
                    <input
                      type="text"
                      value={editingStatement.vehiclePlate}
                      onChange={(e) => setEditingStatement({ ...editingStatement, vehiclePlate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Từ ngày</label>
                    <input
                      type="date"
                      value={editingStatement.fromDate}
                      onChange={(e) => setEditingStatement({ ...editingStatement, fromDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Đến ngày</label>
                    <input
                      type="date"
                      value={editingStatement.toDate}
                      onChange={(e) => setEditingStatement({ ...editingStatement, toDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>

            </form>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingStatement(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition cursor-pointer"
              >
                HỦY BỎ
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
              >
                LƯU THAY ĐỔI
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
