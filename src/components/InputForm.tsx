/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StatementData } from '../types';
import { 
  User, 
  Hash, 
  Calendar, 
  MapPin, 
  Truck, 
  Sparkles, 
  Save, 
  Send, 
  Trash2,
  Squirrel,
  Lock,
  PlusCircle
} from 'lucide-react';
import { padZero, SPECIES_LIST, weightToWords, quantityToWords } from '../utils';

interface InputFormProps {
  formData: StatementData;
  setFormData: React.Dispatch<React.SetStateAction<StatementData>>;
  onFillSample: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onReset: () => void;
  isAdmin?: boolean;
}

export default function InputForm({
  formData,
  setFormData,
  onFillSample,
  onSaveDraft,
  onSubmit,
  onReset,
  isAdmin = false
}: InputFormProps) {

  const isReadOnly = formData.status === 'submitted' || formData.status === 'archived';

  const getFiveDaysLaterStr = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  };

  // Enforce buyer defaults for species, weight, transport details if they are hidden
  React.useEffect(() => {
    if (!isAdmin) {
      setFormData(prev => {
        let changed = false;
        const updated = { ...prev };
        
        if (!updated.speciesName) {
          updated.speciesName = "Chim chào mào";
          updated.scientificName = "Pycnonotus jocosus";
          changed = true;
        }
        if (!updated.weightPerIndividual || updated.weightPerIndividual === 1.2) {
          updated.weightPerIndividual = 0.01; // default weight for bird
          changed = true;
        }
        if (!updated.vehiclePlate) {
          updated.vehiclePlate = "Tự vận chuyển";
          changed = true;
        }
        if (!updated.fromAddress) {
          updated.fromAddress = "Đội 3 thôn Kè Nhạn, xã Đồng Yên, tỉnh Tuyên Quang.";
          changed = true;
        }
        if (!updated.fromDate) {
          updated.fromDate = new Date().toISOString().split('T')[0];
          changed = true;
        }
        if (!updated.toDate) {
          updated.toDate = getFiveDaysLaterStr(updated.fromDate);
          changed = true;
        }
        if (!updated.statementNo) {
          updated.statementNo = "001/26/BKLS";
          changed = true;
        }
        
        // Sync default toAddress
        const defaultToAddress = `Hộ kinh doanh ${updated.buyerName}, ${updated.buyerAddress}`.replace(/,\s*$/, '').trim();
        if (updated.buyerName && updated.buyerAddress && (!updated.toAddress || updated.toAddress === `Hộ kinh doanh ${prev.buyerName}, ${prev.buyerAddress}`.replace(/,\s*$/, '').trim())) {
          updated.toAddress = defaultToAddress;
          changed = true;
        }
        
        return changed ? updated : prev;
      });
    }
  }, [isAdmin, setFormData, formData.buyerName, formData.buyerAddress]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // 1. Auto-fill species scientific name
      if (name === 'speciesName') {
        const found = SPECIES_LIST.find(s => s.name.toLowerCase() === value.trim().toLowerCase());
        if (found) {
          updated.scientificName = found.sci;
        }
      }
      
      // 2. Auto-fill buyer details copying down to shipment destinations
      if (name === 'buyerName' || name === 'buyerAddress') {
        const defaultToAddress = `Hộ kinh doanh ${updated.buyerName}, ${updated.buyerAddress}`.replace(/,\s*$/, '').trim();
        const oldDefault = `Hộ kinh doanh ${prev.buyerName}, ${prev.buyerAddress}`.replace(/,\s*$/, '').trim();
        if (prev.toAddress === '' || prev.toAddress === oldDefault || prev.toAddress === prev.buyerAddress) {
          updated.toAddress = defaultToAddress;
        }
      }
      
      // 3. Auto-fill shipping dates
      if (name === 'issueDate') {
        if (prev.fromDate === '' || prev.fromDate === prev.issueDate) {
          updated.fromDate = value;
          const d = new Date(value);
          if (!isNaN(d.getTime())) {
            d.setDate(d.getDate() + 5);
            const nextWeekStr = d.toISOString().split('T')[0];
            if (prev.toDate === '' || prev.toDate === getFiveDaysLaterStr(prev.fromDate)) {
              updated.toDate = nextWeekStr;
            }
          }
        }
      }
      
      if (name === 'fromDate') {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + 5);
          const nextWeekStr = d.toISOString().split('T')[0];
          if (prev.toDate === '' || prev.toDate === getFiveDaysLaterStr(prev.fromDate)) {
            updated.toDate = nextWeekStr;
          }
        }
      }

      return updated;
    });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const num = value === '' ? 0 : Math.max(0, parseFloat(value) || 0);
    setFormData(prev => ({
      ...prev,
      [name]: num
    }));
  };

  const totalQty = formData.maleCount + formData.femaleCount + formData.unknownCount;
  const totalWeight = parseFloat((totalQty * formData.weightPerIndividual).toFixed(2));

  // Yellow Input Field Class Style
  const inputClass = "w-full px-3 py-2 border border-yellow-200 rounded-lg text-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100/50 outline-none transition bg-yellow-50/50 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed";
  const textareaClass = "w-full px-3 py-2 border border-yellow-200 rounded-lg text-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100/50 outline-none transition bg-yellow-50/50 resize-none disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Form Action Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 rounded-t-2xl flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-yellow-50 text-yellow-600 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm md:text-base">
            {isAdmin ? "NHẬP LIỆU BIỂU MẪU (ADMIN)" : "ĐĂNG KÝ MUA CHIM TRĨ"}
          </h3>
        </div>
        
        {/* Quick Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={onReset}
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
            title="Tạo mới bảng kê trắng"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>TẠO MỚI</span>
          </button>

          {!isReadOnly && (
            <>
              <button
                onClick={onFillSample}
                type="button"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 rounded-lg transition cursor-pointer"
                title="Tự động điền dữ liệu thực tế mẫu"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>MẪU</span>
              </button>

              {isAdmin && (
                <button
                  onClick={onSaveDraft}
                  type="button"
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold rounded-lg transition cursor-pointer"
                  title="Lưu bản nháp tạm thời"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>LƯU TẠM</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Warning block if locked */}
      {isReadOnly && (
        <div className="p-3.5 bg-rose-50 border-b border-rose-100 flex items-center justify-center gap-2 text-xs font-bold text-rose-700 select-none animate-pulse-subtle">
          <Lock className="w-4 h-4 text-rose-600" />
          <span>BẢNG KÊ ĐÃ GỬI (ĐÃ KHÓA) – CHỈ XEM, KHÔNG THỂ CHỈNH SỬA</span>
        </div>
      )}

      {/* Input Fields container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Helper Banner */}
        <div className="p-3 bg-yellow-50/40 border border-yellow-100 rounded-xl text-[11px] text-slate-500 font-medium">
          💡 <span className="font-semibold text-amber-800">Ghi chú:</span> Các ô nhập liệu có <span className="font-bold text-amber-700 underline decoration-yellow-400">màu vàng</span> tương ứng với thông tin sẽ được tô màu vàng nổi bật trên bảng kê chính thức.
        </div>

        {/* Category 1: Số bảng kê & Ngày lập (Admin Only) */}
        {isAdmin && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <Hash className="w-4.5 h-4.5 text-yellow-600" />
              <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">1. Thông tin chung bảng kê</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Số bảng kê <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="statementNo"
                  value={formData.statementNo}
                  onChange={handleChange}
                  disabled={isReadOnly}
                  placeholder="Ví dụ: 189/2026/BK-ĐVH"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ngày lập bảng kê <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="issueDate"
                  value={formData.issueDate}
                  onChange={handleChange}
                  disabled={isReadOnly}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        {/* Category 2: Người mua */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
            <User className="w-4.5 h-4.5 text-yellow-600" />
            <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">
              {isAdmin ? "2. Thông tin khách hàng (Người mua)" : "1. Thông tin người mua chim"}
            </h4>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Họ và tên người mua <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="buyerName"
                value={formData.buyerName}
                onChange={handleChange}
                disabled={isReadOnly}
                placeholder="Nhập họ và tên đầy đủ"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Số CCCD / Hộ chiếu <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="buyerCccd"
                  value={formData.buyerCccd}
                  onChange={handleChange}
                  disabled={isReadOnly}
                  placeholder="Nhập 12 số CCCD"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Số điện thoại liên hệ <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="buyerPhone"
                  value={formData.buyerPhone}
                  onChange={handleChange}
                  disabled={isReadOnly}
                  placeholder="Ví dụ: 0912.345.678"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Địa chỉ thường trú <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="buyerAddress"
                value={formData.buyerAddress}
                onChange={handleChange}
                disabled={isReadOnly}
                placeholder="Số nhà, đường phố, phường/xã, quận/huyện, tỉnh thành"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Category 3: Thông tin loài & số lượng */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
            <Squirrel className="w-4.5 h-4.5 text-yellow-600" />
            <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">
              {isAdmin ? "3. Thông tin loài & số lượng" : "2. Số lượng chim mua"}
            </h4>
          </div>

          <div className="space-y-3">
            {isAdmin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tên loài động vật <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="speciesName"
                    list="species-options"
                    value={formData.speciesName}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    placeholder="Ví dụ: Trĩ đỏ khoang cổ"
                    className={inputClass}
                  />
                  <datalist id="species-options">
                    {SPECIES_LIST.map((s, idx) => (
                      <option key={idx} value={s.name}>{s.sci}</option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tên khoa học <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="scientificName"
                    value={formData.scientificName}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    placeholder="Phasianus colchicus"
                    className={`${inputClass} italic`}
                  />
                </div>
              </div>
            )}

            <div className={isAdmin ? "grid grid-cols-4 gap-2.5" : "grid grid-cols-2 gap-4"}>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Trĩ trống (Đực) <span className="text-slate-400 font-normal">(Con)</span></label>
                <input
                  type="number"
                  name="maleCount"
                  value={formData.maleCount || ''}
                  onChange={handleNumberChange}
                  disabled={isReadOnly}
                  min="0"
                  className="w-full px-3 py-2 border border-yellow-200 rounded-lg text-center text-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100/50 outline-none transition bg-yellow-50/50 disabled:bg-slate-100 disabled:border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Trĩ mái (Cái) <span className="text-slate-400 font-normal">(Con)</span></label>
                <input
                  type="number"
                  name="femaleCount"
                  value={formData.femaleCount || ''}
                  onChange={handleNumberChange}
                  disabled={isReadOnly}
                  min="0"
                  className="w-full px-3 py-2 border border-yellow-200 rounded-lg text-center text-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100/50 outline-none transition bg-yellow-50/50 disabled:bg-slate-100 disabled:border-slate-200"
                />
              </div>
              {isAdmin && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">KXĐ <span className="text-slate-400 font-normal">(Con)</span></label>
                    <input
                      type="number"
                      name="unknownCount"
                      value={formData.unknownCount || ''}
                      onChange={handleNumberChange}
                      disabled={isReadOnly}
                      min="0"
                      className="w-full px-2 py-2 border border-yellow-200 rounded-lg text-center text-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100/50 outline-none transition bg-yellow-50/50 disabled:bg-slate-100 disabled:border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">KL/Con <span className="text-slate-400 font-normal">(kg)</span> <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      name="weightPerIndividual"
                      value={formData.weightPerIndividual || ''}
                      onChange={handleNumberChange}
                      disabled={isReadOnly}
                      step="0.1"
                      min="0.1"
                      className="w-full px-2 py-2 border border-yellow-200 rounded-lg text-center text-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100/50 outline-none transition bg-yellow-50/50 disabled:bg-slate-100 disabled:border-slate-200"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Live calculation banner inside form */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-500">TỔNG SỐ LƯỢNG:</span>{' '}
                  <span className="text-indigo-700 font-bold text-sm bg-indigo-50 px-1.5 py-0.5 rounded">{padZero(totalQty)} con</span>
                </div>
                <div className="h-4 w-px bg-slate-200"></div>
                <div>
                  <span className="font-semibold text-slate-500">TỔNG TRỌNG LƯỢNG:</span>{' '}
                  <span className="text-indigo-700 font-bold text-sm bg-indigo-50 px-1.5 py-0.5 rounded">
                    {totalWeight.toLocaleString('vi-VN')} kg
                  </span>
                </div>
              </div>
              <div className="border-t border-slate-200/60 pt-2 space-y-1 text-[11px] text-slate-500 italic">
                <p>
                  <span className="font-semibold not-italic text-slate-600">Số lượng bằng chữ:</span> {quantityToWords(totalQty)}
                </p>
                <p>
                  <span className="font-semibold not-italic text-slate-600">Trọng lượng bằng chữ:</span> {weightToWords(totalWeight)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category 4: Vận chuyển (Admin Only) */}
        {isAdmin && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <Truck className="w-4.5 h-4.5 text-yellow-600" />
              <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">4. Thông tin vận chuyển</h4>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Biển số xe vận chuyển <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="vehiclePlate"
                  value={formData.vehiclePlate}
                  onChange={handleChange}
                  disabled={isReadOnly}
                  placeholder="Ví dụ: 29C-789.45"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Từ ngày vận chuyển <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="fromDate"
                    value={formData.fromDate}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Đến ngày vận chuyển <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="toDate"
                    value={formData.toDate}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Địa điểm đi (Xuất phát) <span className="text-red-500">*</span></label>
                <textarea
                  name="fromAddress"
                  value={formData.fromAddress}
                  onChange={handleChange}
                  disabled={isReadOnly}
                  rows={2}
                  placeholder="Nhập địa chỉ cơ sở bốc xếp lên phương tiện"
                  className={textareaClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Địa điểm đến (Giao nhận) <span className="text-red-500">*</span></label>
                <textarea
                  name="toAddress"
                  value={formData.toAddress}
                  onChange={handleChange}
                  disabled={isReadOnly}
                  rows={2}
                  placeholder="Nhập địa chỉ giao hàng, trả hàng"
                  className={textareaClass}
                />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Main Send Button Area */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
        {isReadOnly ? (
          <button
            onClick={onReset}
            type="button"
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="tracking-wide">TẠO MỚI BẢNG KÊ TIẾP THEO</span>
          </button>
        ) : (
          <button
            onClick={onSubmit}
            type="button"
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Send className="w-5 h-5" />
            <span className="tracking-wide">SINH BẢNG KÊ & GỬI</span>
          </button>
        )}
      </div>
    </div>
  );
}
