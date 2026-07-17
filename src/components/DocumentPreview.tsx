/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { StatementData } from '../types';
import { formatVietnameseDate, quantityToWords, weightToWords, padZero, downloadDocx } from '../utils';
import { FileText, FileDown, Printer, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DocumentPreviewProps {
  data: StatementData;
}

export default function DocumentPreview({ data }: DocumentPreviewProps) {
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const page3Ref = useRef<HTMLDivElement>(null);
  
  const [zoom, setZoom] = useState<number>(100);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  const totalQty = data.maleCount + data.femaleCount + data.unknownCount;
  const totalWeight = parseFloat((totalQty * data.weightPerIndividual).toFixed(2));
  
  const formattedDate = formatVietnameseDate(data.issueDate);
  const formattedFromDate = formatVietnameseDate(data.fromDate);
  const formattedToDate = formatVietnameseDate(data.toDate);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 70));
  const handleZoomReset = () => setZoom(100);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Export to PDF using html2canvas & jsPDF
  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const pages = [page1Ref.current, page2Ref.current, page3Ref.current];
      
      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i];
        if (!pageEl) continue;
        
        // Render canvas
        const canvas = await html2canvas(pageEl, {
          scale: 2, // High resolution
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }
      
      const fileName = `Bang_Ke_DVHD_${data.statementNo.replace(/[\/\s]/g, '_')}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Lỗi khi xuất PDF:", error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Highlight wrapper
  const Highlight = ({ children }: { children: React.ReactNode }) => (
    <span className="bg-amber-100/90 text-amber-900 border border-amber-300/60 px-1.5 py-0.5 rounded font-semibold text-[15px] inline-block shadow-sm select-none">
      {children || "..."}
    </span>
  );

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-2xl shadow-inner border border-slate-200">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-4 bg-white border-b border-slate-200 rounded-t-2xl gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800 text-sm md:text-base">XEM TRƯỚC TÀI LIỆU (3 TRANG)</h3>
        </div>
        
        {/* Zoom controls & Exports */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs mr-2">
            <button 
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-white rounded-md text-slate-600 hover:text-indigo-600 transition"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-medium text-slate-700 w-12 text-center">{zoom}%</span>
            <button 
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-white rounded-md text-slate-600 hover:text-indigo-600 transition"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleZoomReset}
              className="p-1.5 hover:bg-white rounded-md text-slate-600 hover:text-indigo-600 transition border-l border-slate-200 ml-1"
              title="Đặt lại zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => downloadDocx(data)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>TẢI WORD</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{isExportingPDF ? 'ĐANG XUẤT...' : 'TẢI PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-900 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>IN BẢNG KÊ</span>
          </button>
        </div>
      </div>

      {/* Pages Container */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center gap-8" id="print-area">
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 0mm;
            }
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            body * {
              visibility: hidden;
            }
            #print-area, #print-area * {
              visibility: visible;
            }
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 210mm;
              padding: 0 !important;
              margin: 0 !important;
              background: white;
            }
            .a4-page {
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 20mm !important;
              width: 210mm !important;
              height: 297mm !important;
              page-break-after: always !important;
              break-after: page !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
            }
          }
        `}</style>

        {/* PAGE 1 */}
        <div 
          ref={page1Ref}
          id="preview-page-1"
          className="bg-white shadow-lg border border-slate-300 rounded-sm p-[20mm] a4-page flex flex-col justify-between"
          style={{ 
            width: '210mm', 
            height: '297mm', 
            fontFamily: '"Times New Roman", Times, serif', 
            lineHeight: '1.4',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            marginBottom: zoom !== 100 ? `${(zoom - 100) * 2.97}mm` : '0px'
          }}
        >
          <div>
            {/* National Header */}
            <div className="flex justify-between items-center text-xs italic text-slate-500 mb-1 select-none">
              <span>Mẫu số 01</span>
              <span className="opacity-0">Form 01</span>
            </div>
            <div className="text-center text-sm">
              <h4 className="font-bold tracking-tight uppercase text-slate-900 text-lg">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
              <p className="font-bold text-slate-800 text-base mt-1">Độc lập - Tự do - Hạnh phúc</p>
              <div className="w-48 h-0.5 bg-black mx-auto mt-2"></div>
            </div>

            {/* Document Details Header */}
            <div className="text-center mt-10">
              <h2 className="font-bold text-2xl text-slate-900 leading-tight uppercase">BẢNG KÊ ĐỘNG VẬT HOANG DÃ DÃ NGOẠI</h2>
              <p className="text-base mt-2 font-bold italic">
                Số bảng kê: <Highlight>{data.statementNo || "..........................."}</Highlight>
              </p>
              <p className="text-sm italic mt-1 text-slate-700">
                Ngày lập: <Highlight>{formattedDate}</Highlight>
              </p>
            </div>

            {/* Owner Section */}
            <div className="mt-8 text-[15px] space-y-1.5 text-slate-800">
              <h3 className="font-bold uppercase text-slate-900 text-[16px] mb-2">1. THÔNG TIN CHỦ CƠ SỞ (NGƯỜI BÁN)</h3>
              <p>
                <span className="font-bold">Họ và tên chủ cơ sở:</span> Đinh Văn Hùng
              </p>
              <p>
                <span className="font-bold">Địa chỉ cư trú:</span> Thôn Lập Thành, Xã Đông Yên, Huyện Quốc Oai, Thành phố Hà Nội
              </p>
              <p>
                <span className="font-bold">Số điện thoại liên hệ:</span> 0987.654.321 <span className="mx-3">|</span> <span className="font-bold">Email:</span> dinhvanhung@gmail.com
              </p>
            </div>

            {/* Buyer Section */}
            <div className="mt-6 text-[15px] space-y-1.5 text-slate-800">
              <h3 className="font-bold uppercase text-slate-900 text-[16px] mb-2">2. THÔNG TIN KHÁCH HÀNG (NGƯỜI MUA)</h3>
              <p>
                <span className="font-bold">Họ và tên người mua:</span> <Highlight>{data.buyerName || "......................................................................"}</Highlight>
              </p>
              <p>
                <span className="font-bold">Số CCCD / Hộ chiếu:</span> <Highlight>{data.buyerCccd || "..................................................."}</Highlight>
              </p>
              <p>
                <span className="font-bold">Địa chỉ thường trú:</span> <Highlight>{data.buyerAddress || "......................................................................................................"}</Highlight>
              </p>
              <p>
                <span className="font-bold">Số điện thoại di động:</span> <Highlight>{data.buyerPhone || "......................................"}</Highlight>
              </p>
            </div>

            {/* Animal Section */}
            <div className="mt-6">
              <h3 className="font-bold uppercase text-slate-900 text-[16px] mb-2">3. THÔNG TIN ĐỘNG VẬT HOANG DÃ KÊ KHAI</h3>
              
              <table className="w-full border-collapse border border-black text-[14px] text-center mt-3">
                <thead>
                  <tr className="bg-slate-50 font-bold">
                    <th className="border border-black px-1.5 py-2 w-10">STT</th>
                    <th className="border border-black px-2 py-2">Tên loài thông thường</th>
                    <th className="border border-black px-2 py-2 italic">Tên khoa học (Scientific Name)</th>
                    <th className="border border-black px-1.5 py-2 w-14">Đực (M)</th>
                    <th className="border border-black px-1.5 py-2 w-14">Cái (F)</th>
                    <th className="border border-black px-1.5 py-2 w-14">KXĐ (U)</th>
                    <th className="border border-black px-2 py-2 w-20">KL/cá thể (kg)</th>
                    <th className="border border-black px-2 py-2 w-18">Tổng SL (Con)</th>
                    <th className="border border-black px-2 py-2 w-24">Tổng KL (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-1.5 py-2.5 font-bold">01</td>
                    <td className="border border-black px-2 py-2.5 text-left font-semibold">
                      <Highlight>{data.speciesName || "...................................."}</Highlight>
                    </td>
                    <td className="border border-black px-2 py-2.5 text-left italic">
                      <Highlight>{data.scientificName || "...................................."}</Highlight>
                    </td>
                    <td className="border border-black px-1.5 py-2.5 font-semibold">
                      <Highlight>{padZero(data.maleCount)}</Highlight>
                    </td>
                    <td className="border border-black px-1.5 py-2.5 font-semibold">
                      <Highlight>{padZero(data.femaleCount)}</Highlight>
                    </td>
                    <td className="border border-black px-1.5 py-2.5 font-semibold">
                      <Highlight>{padZero(data.unknownCount)}</Highlight>
                    </td>
                    <td className="border border-black px-2 py-2.5">
                      <Highlight>{data.weightPerIndividual || "..."}</Highlight>
                    </td>
                    <td className="border border-black px-2 py-2.5 font-bold bg-slate-50">
                      {padZero(totalQty)}
                    </td>
                    <td className="border border-black px-2 py-2.5 font-bold bg-slate-50">
                      {totalWeight.toLocaleString('vi-VN')}
                    </td>
                  </tr>
                  
                  {/* Totals Row */}
                  <tr className="font-bold bg-slate-100">
                    <td className="border border-black px-2 py-2.5 uppercase" colSpan={3}>Tổng cộng cuối bảng</td>
                    <td className="border border-black px-1.5 py-2.5">{padZero(data.maleCount)}</td>
                    <td className="border border-black px-1.5 py-2.5">{padZero(data.femaleCount)}</td>
                    <td className="border border-black px-1.5 py-2.5">{padZero(data.unknownCount)}</td>
                    <td className="border border-black px-2 py-2.5">-</td>
                    <td className="border border-black px-2 py-2.5">{padZero(totalQty)}</td>
                    <td className="border border-black px-2 py-2.5">{totalWeight.toLocaleString('vi-VN')}</td>
                  </tr>
                </tbody>
              </table>

              {/* Spell-out block */}
              <div className="mt-4 space-y-1.5 text-[15px] italic text-slate-800">
                <p>
                  <span className="font-bold not-italic">Tổng số lượng (bằng chữ):</span> {quantityToWords(totalQty)}.
                </p>
                <p>
                  <span className="font-bold not-italic">Tổng khối lượng (bằng chữ):</span> {weightToWords(Math.round(totalWeight))}.
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-right text-xs text-slate-400 mt-4 border-t border-dashed border-slate-200 pt-2 font-sans">
            Trang 1 / 3 — Bảng kê động vật rừng dã ngoại hợp pháp
          </div>
        </div>

        {/* PAGE 2 */}
        <div 
          ref={page2Ref}
          id="preview-page-2"
          className="bg-white shadow-lg border border-slate-300 rounded-sm p-[20mm] a4-page flex flex-col justify-between"
          style={{ 
            width: '210mm', 
            height: '297mm', 
            fontFamily: '"Times New Roman", Times, serif', 
            lineHeight: '1.4',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            marginBottom: zoom !== 100 ? `${(zoom - 100) * 2.97}mm` : '0px'
          }}
        >
          <div>
            {/* National Header */}
            <div className="flex justify-between items-center text-xs italic text-slate-500 mb-1 select-none">
              <span>Mẫu số 141</span>
              <span>Kèm theo Bảng kê lâm sản số: <Highlight>{data.statementNo || "..........."}</Highlight></span>
            </div>
            <div className="text-center text-sm">
              <h4 className="font-bold tracking-tight uppercase text-slate-900 text-lg">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
              <p className="font-bold text-slate-800 text-base mt-1">Độc lập - Tự do - Hạnh phúc</p>
              <div className="w-48 h-0.5 bg-black mx-auto mt-2"></div>
            </div>

            {/* Transport Section */}
            <div className="mt-10 text-[15px] space-y-2.5 text-slate-800">
              <h3 className="font-bold uppercase text-slate-900 text-[16px] mb-3">4. PHƯƠNG THỨC VÀ HÀNH TRÌNH VẬN CHUYỂN</h3>
              
              <p>
                <span className="font-bold">Phương tiện vận chuyển:</span> Xe ô tô mang biển kiểm soát: <Highlight>{data.vehiclePlate || "...................................."}</Highlight>
              </p>
              <p>
                <span className="font-bold">Thời gian vận chuyển dự kiến:</span> Từ <Highlight>{formattedFromDate}</Highlight> đến hết <Highlight>{formattedToDate}</Highlight>
              </p>
              <p className="font-bold">Hành trình tuyến đường di chuyển:</p>
              <div className="pl-4 space-y-1.5">
                <p>
                  <span className="font-semibold">- Địa điểm đi (Xuất phát):</span> <Highlight>{data.fromAddress || "......................................................................................................"}</Highlight>
                </p>
                <p>
                  <span className="font-semibold">- Địa điểm đến (Giao nhận):</span> <Highlight>{data.toAddress || "......................................................................................................"}</Highlight>
                </p>
              </div>
            </div>

            {/* Certification Section */}
            <div className="mt-8 border-t border-double border-slate-400 pt-6">
              <h3 className="font-bold uppercase text-center text-slate-900 text-[16px] mb-4">XÁC NHẬN CỦA HẠT KIỂM LÂM SỞ TẠI</h3>
              
              <div className="text-[15px] space-y-3.5 text-slate-800 leading-relaxed text-justify">
                <p>
                  Hạt Kiểm lâm huyện Quốc Oai thuộc Chi cục Kiểm lâm thành phố Hà Nội tiến hành xác nhận bảng kê lâm sản (động vật hoang dã dã ngoại) số: <Highlight>{data.statementNo || "..........."}</Highlight> này đối với chủ cơ sở là ông <span className="font-bold">Đinh Văn Hùng</span>.
                </p>
                <p>
                  Căn cứ hồ sơ xin xác nhận vận chuyển lâm sản và biên bản kiểm tra thực tế nguồn gốc lâm sản ngày <span className="italic">...... tháng ...... năm 2026</span> của Kiểm lâm viên phụ trách địa bàn.
                </p>
                <p>
                  <span className="font-bold">KẾT QUẢ KIỂM TRA XÁC MINH:</span>
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Lâm sản đề nghị xác nhận vận chuyển gồm có: <span className="font-bold">{totalQty} cá thể</span> loài <span className="font-bold">{data.speciesName || "..............."}</span> (<span className="italic font-semibold">{data.scientificName || "........."}</span>).</li>
                  <li>Nguồn gốc động vật hoang dã: Sinh sản, nuôi dưỡng thế hệ F2 hợp pháp tại trang trại nuôi sinh sản của ông Đinh Văn Hùng được cơ quan nhà nước có thẩm quyền cấp phép hoạt động, đăng ký mã số cơ sở nuôi đúng quy chuẩn kỹ thuật.</li>
                  <li>Tình trạng sức khỏe cá thể tại thời điểm kiểm tra: Hoàn toàn khỏe mạnh, không mang mầm bệnh nguy hiểm, phù hợp các tiêu chuẩn kiểm dịch thú y hiện hành.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400 mt-4 border-t border-dashed border-slate-200 pt-2 font-sans">
            Trang 2 / 3 — Bảng kê động vật rừng dã ngoại hợp pháp
          </div>
        </div>

        {/* PAGE 3 */}
        <div 
          ref={page3Ref}
          id="preview-page-3"
          className="bg-white shadow-lg border border-slate-300 rounded-sm p-[20mm] a4-page flex flex-col justify-between"
          style={{ 
            width: '210mm', 
            height: '297mm', 
            fontFamily: '"Times New Roman", Times, serif', 
            lineHeight: '1.4',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            marginBottom: zoom !== 100 ? `${(zoom - 100) * 2.97}mm` : '0px'
          }}
        >
          <div>
            {/* Certification continued */}
            <div className="flex justify-between items-center text-xs italic text-slate-500 mb-4 border-b border-slate-100 pb-2 select-none">
              <span>Mẫu số 141 (tiếp theo)</span>
              <span>Kèm theo Bảng kê lâm sản số: <Highlight>{data.statementNo || "..........."}</Highlight></span>
            </div>
            <div className="text-[15px] space-y-3 text-slate-800 leading-relaxed text-justify">
              <p>
                Các thông tin về phương tiện vận chuyển mang biển số <span className="font-bold">{data.vehiclePlate || "............"}</span>, thời gian vận chuyển di chuyển từ <span className="font-bold">{formattedFromDate}</span> đến <span className="font-bold">{formattedToDate}</span> từ địa chỉ thôn Lập Thành, Đông Yên, Quốc Oai, Hà Nội đến địa chỉ <span className="font-semibold">{data.toAddress || "..................."}</span> là hoàn toàn chính xác và trùng khớp với hiện trạng thực tế.
              </p>
              <p>
                Hạt Kiểm lâm huyện Quốc Oai xác nhận số lượng lâm sản trên có nguồn gốc hợp pháp, đủ điều kiện để lưu hành, vận chuyển thương mại trong nước theo quy định pháp luật hiện hành về quản lý thực vật rừng, động vật rừng nguy cấp, quý, hiếm.
              </p>
              <p>
                Bảng kê này được lập thành 03 bản chính có giá trị pháp lý như nhau: 01 bản lưu tại cơ quan kiểm lâm sở tại, 01 bản giao cho chủ lâm sản (người bán), 01 bản đồng hành cùng phương tiện vận chuyển bàn giao cho người mua lưu giữ.
              </p>
            </div>

            {/* Signature Area */}
            <div className="mt-14 grid grid-cols-2 gap-4 text-center text-[14px]">
              <div>
                <h5 className="font-bold uppercase text-[15px]">KIỂM LÂM VIÊN KIỂM TRA</h5>
                <p className="italic text-slate-500 mt-1">(Ký, ghi rõ họ tên)</p>
                <div className="h-24"></div>
                <p className="font-semibold text-slate-800">......................................................</p>
              </div>

              <div>
                <h5 className="font-bold uppercase text-[15px]">HẠT TRƯỞNG HẠT KIỂM LÂM</h5>
                <p className="italic text-slate-500 mt-1">(Ký tên, đóng dấu, ghi rõ họ tên)</p>
                <div className="h-24"></div>
                <p className="font-bold text-slate-900">......................................................</p>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-4 text-center text-[14px] border-t border-slate-100 pt-8">
              <div>
                <h5 className="font-bold uppercase text-[15px]">CHỦ CƠ SỞ (NGƯỜI BÁN)</h5>
                <p className="italic text-slate-500 mt-1">(Đinh Văn Hùng - Ký và ghi rõ họ tên)</p>
                <div className="h-24 flex items-center justify-center">
                  <div className="border border-red-200 text-red-500 font-serif text-[10px] p-1.5 rounded rotate-[-6deg] uppercase tracking-wider font-bold">
                    Đã ký điện tử<br/>Đinh Văn Hùng
                  </div>
                </div>
                <p className="font-bold text-slate-800">Đinh Văn Hùng</p>
              </div>

              <div>
                <h5 className="font-bold uppercase text-[15px]">KHÁCH HÀNG (NGƯỜI MUA)</h5>
                <p className="italic text-slate-500 mt-1">(Ký và ghi rõ họ tên)</p>
                <div className="h-24"></div>
                <p className="font-bold text-slate-900">{data.buyerName || "......................................................"}</p>
              </div>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400 mt-4 border-t border-dashed border-slate-200 pt-2 font-sans">
            Trang 3 / 3 — Bảng kê động vật rừng dã ngoại hợp pháp
          </div>
        </div>
      </div>
    </div>
  );
}
