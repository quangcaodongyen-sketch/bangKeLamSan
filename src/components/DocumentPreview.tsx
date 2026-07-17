/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Printer, 
  FileDown, 
  FileText,
  MessageSquare
} from 'lucide-react';
import { StatementData } from '../types';
import { formatVietnameseDate, downloadDocx, padZero, quantityToWords, weightToWords } from '../utils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QR_CODE_BASE64 } from '../qrCodeBase64';

interface DocumentPreviewProps {
  data: StatementData;
  isAdmin?: boolean;
}

export default function DocumentPreview({ data, isAdmin = false }: DocumentPreviewProps) {
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const page3Ref = useRef<HTMLDivElement>(null);
  
  const [zoom, setZoom] = useState<number>(100);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  const totalQty = data.maleCount + data.femaleCount + data.unknownCount;
  const totalWeight = parseFloat((totalQty * data.weightPerIndividual).toFixed(2));
  
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 70));
  const handleZoomReset = () => setZoom(100);

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pages = ['preview-page-1', 'preview-page-2', 'preview-page-3'];
      
      for (let i = 0; i < pages.length; i++) {
        const pageEl = document.getElementById(pages[i]);
        if (!pageEl) continue;
        
        const originalTransform = pageEl.style.transform;
        const originalMargin = pageEl.style.marginBottom;
        pageEl.style.transform = 'none';
        pageEl.style.marginBottom = '0px';
        
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
        });
        
        pageEl.style.transform = originalTransform;
        pageEl.style.marginBottom = originalMargin;
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }
      
      const numPart = data.statementNo.split('/')[0].trim();
      pdf.save(`Bảng kê ĐVHD số ${numPart}.pdf`);
    } catch (error) {
      console.error("Lỗi khi xuất PDF:", error);
      alert("Đã xảy ra lỗi khi tạo tệp PDF. Vui lòng thử lại!");
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // 1. Red text (Admin inputs) - NO yellow background
  const AdminHighlight = ({ children }: { children: React.ReactNode }) => (
    <span className="text-red-600 font-bold select-none text-[15px] mx-0.5">
      {children || "..."}
    </span>
  );

  // 2. Blue text (Buyer/User inputs) - NO yellow background
  const BuyerHighlight = ({ children }: { children: React.ReactNode }) => (
    <span className="text-blue-600 font-bold select-none text-[15px] mx-0.5">
      {children || "..."}
    </span>
  );

  // 3. Black text on Yellow background (Auto-calculated/synced fields)
  const AutoHighlight = ({ children }: { children: React.ReactNode }) => (
    <span className="bg-yellow-200/90 text-slate-900 font-bold border border-yellow-300 px-1 py-0.5 rounded text-[15px] inline-block shadow-sm select-none">
      {children || "..."}
    </span>
  );

  const parseDateParts = (dateStr: string) => {
    if (!dateStr) return { day: "...", month: "...", year: "..." };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { day: "...", month: "...", year: "..." };
    return {
      day: padZero(d.getDate()),
      month: padZero(d.getMonth() + 1),
      year: d.getFullYear().toString()
    };
  };

  const issueDateParts = parseDateParts(data.issueDate);
  const fromDateParts = parseDateParts(data.fromDate);
  const toDateParts = parseDateParts(data.toDate);

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-2xl shadow-inner border border-slate-200">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-4 bg-white border-b border-slate-200 rounded-t-2xl gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800 text-sm md:text-base">XEM TRƯỚC BẢNG KÊ (3 TRANG A4)</h3>
        </div>
        
        {/* Zoom controls & Exports */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs mr-1">
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

          {isAdmin && (
            <a
              href="https://zalo.me/0915213717"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer animate-pulse"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>GỬI ZALO (0915.213.717)</span>
            </a>
          )}

          <button
            onClick={() => downloadDocx(data)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>TẢI WORD</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{isExportingPdf ? 'ĐANG TẢI...' : 'TẢI PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>IN NGAY</span>
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
            {/* Headers block */}
            <div className="flex justify-between items-start text-xs select-none">
              <div className="text-left font-serif leading-tight">
                <span className="font-bold text-[14px]">Mẫu số 01</span>
                <p className="text-[10px] mt-0.5 text-slate-400">....................................................</p>
                <p className="text-[10px] text-slate-400">....................................................</p>
              </div>
              
              <div className="text-center">
                <h4 className="font-bold tracking-tight uppercase text-slate-900 text-sm">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
                <p className="font-bold text-slate-800 text-[12px] mt-0.5 underline underline-offset-4 decoration-1">Độc lập – Tự do – Hạnh phúc</p>
              </div>
            </div>

            {/* Document Details Header */}
            <div className="flex justify-between items-center mt-6 text-xs font-serif">
              <div>
                <span className="font-semibold">Số<sup>(1)</sup>:</span> <AdminHighlight>{data.statementNo || "001/26/BKLS"}</AdminHighlight>
              </div>
              <div className="text-right text-slate-500 italic">
                Tờ số<sup>(2)</sup>: .......  Tổng số tờ: .......; ....... trang
              </div>
            </div>

            <div className="text-center mt-6">
              <h2 className="font-bold text-xl text-slate-950 leading-tight uppercase tracking-wide">BẢNG KÊ LÂM SẢN</h2>
              <img src={QR_CODE_BASE64} className="mx-auto mt-2 w-24 h-24 object-contain" alt="QR Code" />
            </div>

            {/* I. General Information */}
            <div className="mt-6 text-[14px] space-y-3.5 text-slate-900 leading-relaxed text-justify">
              <h3 className="font-bold text-[14px] tracking-wide uppercase">I. THÔNG TIN CHUNG</h3>
              
              {/* 1. Seller Info */}
              <div className="space-y-1">
                <h4 className="font-bold">1. Thông tin chủ lâm sản:</h4>
                <p>
                  - Tên chủ lâm sản<sup>(4)</sup>: <span className="font-semibold">Đinh Văn Hùng</span>
                </p>
                <p>
                  - Số GCN/MSDN/GPTL/ĐKHĐ/CCCD/CMND/HC<sup>(5)</sup>: <span className="font-semibold">002093011338</span>
                </p>
                <p>
                  - Địa chỉ<sup>(6)</sup>: <span className="font-semibold">Đội 3 thôn Kè Nhạn, xã Đồng Yên, tỉnh Tuyên Quang.</span>
                </p>
                <p>
                  - Số điện thoại: <span className="font-semibold">0962 313 828</span> <span className="ml-4">, Địa chỉ Email: ................................................................</span>
                </p>
              </div>

              {/* 2. Buyer Info */}
              <div className="space-y-1">
                <h4 className="font-bold">2. Thông tin tổ chức, cá nhân mua/nhận chuyển giao quyền sở hữu:</h4>
                <p>
                  - Tên tổ chức, cá nhân<sup>(4)</sup>: <BuyerHighlight>{data.buyerName || "..................................................."}</BuyerHighlight>
                </p>
                <p>
                  - Số GCN/MSDN/GPTL/ĐKHĐ/CCCD/CMND/HC<sup>(5)</sup>: <BuyerHighlight>{data.buyerCccd || "..................................................."}</BuyerHighlight>
                </p>
                <p>
                  - Địa chỉ<sup>(6)</sup>: <BuyerHighlight>{data.buyerAddress || "......................................................................................................"}</BuyerHighlight>
                </p>
                <p>
                  - Số điện thoại: <BuyerHighlight>{data.buyerPhone || "......................................"}</BuyerHighlight> <span className="ml-2">, Địa chỉ Email: ...............................................................</span>
                </p>
              </div>

              {/* 3. Wildlife info */}
              <div className="space-y-1.5">
                <h4 className="font-bold">3. Thông tin về lâm sản:</h4>
                <p>
                  - Tên loài (tên khoa học, tên tiếng việt hoặc tên thương mại): <AutoHighlight>{data.speciesName || "Chim chào mào"}</AutoHighlight> / <span className="italic"><AutoHighlight>{data.scientificName || "Pycnonotus jocosus"}</AutoHighlight></span>.
                </p>
                <p>
                  - Nhóm loài: <span className="italic text-slate-700">(Thông thường; Nhóm IA, IIA, IB, IIB của danh mục thực vật rừng, động vật rừng nguy cấp, quý, hiếm; Phụ lục I, II, III CITES):</span> <span className="font-bold">Thông thường.</span>
                </p>
                <p>
                  - Nguồn gốc<sup>(7)</sup>: <span className="font-medium"><AutoHighlight>{data.speciesName || "Chim chào mào"}</AutoHighlight> được gây nuôi từ trại nuôi sinh sản ĐVHD thông thường của ông Đinh Văn Hùng, đội 3 thôn Kè Nhạn, xã Đồng Yên, tỉnh Tuyên Quang.</span>
                </p>
                <p>
                  - Mã HS (áp dụng đối với lâm sản nhập khẩu, xuất khẩu): ...........................................................................................................
                </p>
                <p>
                  - Giá trị (nếu có): ..................................................................................................................................................................
                </p>
                <p>
                  - Khối lượng/trọng lượng (bằng số và chữ): Đơn vị tính (m³, kg, ster, lít, mililít): <span className="font-semibold"><AutoHighlight>{data.speciesName || "Chim chào mào"}</AutoHighlight>, trọng lượng: <AutoHighlight>{totalWeight.toLocaleString('vi-VN')}</AutoHighlight> kg (<AutoHighlight>{weightToWords(totalWeight)}</AutoHighlight>).</span>
                </p>
                <p>
                  - Số lượng (bằng số và chữ): Đơn vị tính (lóng, khúc, thanh, tấm, hộp, viên, cây,...): <span className="font-semibold"><AutoHighlight>{data.speciesName || "Chim chào mào"}</AutoHighlight>, số lượng: <AutoHighlight>{padZero(totalQty)}</AutoHighlight> cá thể (<AutoHighlight>{quantityToWords(totalQty)}</AutoHighlight>; <BuyerHighlight>{padZero(data.maleCount)}</BuyerHighlight> đực, <BuyerHighlight>{padZero(data.femaleCount)}</BuyerHighlight> cái).</span>
                </p>
              </div>

            </div>
          </div>

          <div className="text-right text-xs text-slate-400 mt-2 border-t border-dashed border-slate-100 pt-1 font-sans select-none">
            Trang 1 / 3 — Bảng kê lâm sản
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
            <div className="text-xs italic text-slate-500 mb-2 select-none opacity-0">Mẫu số 01 (tiếp)</div>
            
            <div className="text-[14px] space-y-4 text-slate-900 leading-relaxed text-justify">
              <p>
                - Thông tin về lô khai thác: ............................................................................................................................................................
              </p>
              <p>
                - Thông tin khác có liên quan (nếu có): .............................................................................................................................................
              </p>
              
              <p>
                <span className="font-bold">4. Thông tin chi tiết tại Bảng kê khai thác kèm theo:</span> <span className="italic text-slate-700">(Áp dụng đối với gỗ nguyên liệu; sản phẩm gỗ; khai thác từ rừng tự nhiên hoặc nhập khẩu hoặc xử lý tịch thu hoặc động vật và sản phẩm của động vật thuộc loài nguy cấp, quý, hiếm hoặc thuộc Phụ lục CITES)</span>:
              </p>

              <div className="space-y-1.5">
                <h4 className="font-bold">5. Thông tin vận chuyển (nếu có):</h4>
                <p className="leading-loose">
                  Biển kiểm soát/số hiệu phương tiện: <AdminHighlight>{data.vehiclePlate || "...................................."}</AdminHighlight>; thời gian vận chuyển: <span className="font-semibold">05 ngày</span>; từ ngày <AdminHighlight>{issueDateParts.day}</AdminHighlight> tháng <AdminHighlight>{issueDateParts.month}</AdminHighlight> năm <AdminHighlight>{issueDateParts.year}</AdminHighlight> đến hết ngày <AutoHighlight>{toDateParts.day}</AutoHighlight> tháng <AutoHighlight>{toDateParts.month}</AutoHighlight> năm <AutoHighlight>{toDateParts.year}</AutoHighlight>; Vận chuyển từ: <span className="font-semibold">Đội 3 thôn Kè Nhạn, xã Đồng Yên, tỉnh Tuyên Quang</span> đến <AutoHighlight>cơ sở ông {data.buyerName || "........................"}, {data.buyerAddress || "........................................................"}</AutoHighlight>.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold">6. Hồ sơ kèm theo (nếu có):</h4>
                <p className="indent-8 text-justify">
                  Chúng tôi/Tôi cam kết những nội dung kê khai trong bảng kê này là đúng sự thật và chịu trách nhiệm trước pháp luật về sự trung thực của thông tin./.
                </p>
              </div>
            </div>

            {/* Signature Area */}
            <div className="mt-10 grid grid-cols-2 gap-4 text-center text-[13px] leading-relaxed">
              <div>
                <p className="italic text-slate-800">
                  Bắc Quang, ngày &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; tháng &nbsp; &nbsp; &nbsp; &nbsp; năm <AdminHighlight>{issueDateParts.year}</AdminHighlight>
                </p>
                <h5 className="font-bold uppercase text-[13px] mt-1">XAC NHẬN CỦA CƠ QUAN</h5>
                <h5 className="font-bold uppercase text-[13px]">CÓ THẨM QUYỀN</h5>
                <p className="text-[11px] text-slate-500 italic mt-0.5">Vào sổ số: ......../2026<sup>(8)</sup></p>
                <p className="text-[11px] text-slate-400 italic">(Người có thẩm quyền ký, ghi rõ họ tên, đóng dấu)</p>
                <div className="h-20 flex items-center justify-center">
                  <span className="text-slate-400 text-xs italic">Ký xác nhận</span>
                </div>
                <h5 className="font-bold text-[13px] uppercase">HẠT TRƯỞNG</h5>
              </div>

              <div>
                <p className="italic text-slate-800">
                  Đồng Yên, ngày <AdminHighlight>{issueDateParts.day}</AdminHighlight> tháng <AdminHighlight>{issueDateParts.month}</AdminHighlight> năm <AdminHighlight>{issueDateParts.year}</AdminHighlight>
                </p>
                <h5 className="font-bold uppercase text-[13px] mt-1">TỔ CHỨC/CÁ NHÂN</h5>
                <h5 className="font-bold uppercase text-[13px]">LẬP BẢNG KÊ</h5>
                <p className="text-[11px] text-slate-400 italic mt-0.5">(Ký, ghi rõ họ tên, đóng dấu đối với tổ chức)</p>
                
                <div className="h-20 flex items-center justify-center select-none">
                  <div className="border-2 border-red-500 text-red-500 font-serif text-[10px] p-1.5 rounded rotate-[-6deg] uppercase tracking-wider font-bold leading-tight select-none">
                    Đã ký điện tử<br/>Đinh Văn Hùng
                  </div>
                </div>
                
                <h5 className="font-bold text-[13px] text-slate-900 uppercase">Đinh Văn Hùng</h5>
              </div>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400 mt-2 border-t border-dashed border-slate-100 pt-1 font-sans select-none">
            Trang 2 / 3 — Bảng kê lâm sản
          </div>
        </div>

        {/* PAGE 3 */}
        <div 
          ref={page3Ref}
          id="preview-page-3"
          className="bg-white shadow-lg border border-slate-300 rounded-sm p-[20mm] a4-page flex flex-col justify-between animate-fade-in"
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
            {/* Header label */}
            <div className="text-center font-bold text-slate-950 text-base uppercase">
              BẢNG KÊ CHI TIẾT
            </div>
            <div className="text-center text-[12px] italic text-slate-800 mt-1 select-none leading-relaxed">
              (Kèm theo Bảng kê lâm sản số: <AdminHighlight>{data.statementNo || "001/26/BKLS"}</AdminHighlight> ngày <AdminHighlight>{issueDateParts.day}/{issueDateParts.month}/{issueDateParts.year}</AdminHighlight> của cơ sở<br/>nuôi nhốt sinh sản ĐVHD thông thường ông Đinh Văn Hùng)
            </div>
            
            <p className="text-[12px] text-justify font-serif text-slate-800 leading-relaxed mt-4">
              <span className="font-bold">Thông tin chi tiết đối với động vật rừng thông thường, động vật thuộc danh mục nguy cấp, quý, hiếm, động vật thuộc các Phụ lục CITES:</span>
            </p>

            {/* Structured High-Fidelity Table */}
            <table className="w-full border-collapse border border-black text-[12px] text-center mt-3">
              <thead>
                <tr className="bg-slate-50 font-bold">
                  <th className="border border-black px-1 py-3 w-8" rowSpan={2}>TT</th>
                  <th className="border border-black px-2 py-1" colSpan={2}>Tên loài</th>
                  <th className="border border-black px-1 py-1" colSpan={4}>Số lượng cá thể, trứng</th>
                  <th className="border border-black px-1.5 py-1 w-14" rowSpan={2}>Khối lượng<br/>(kg)</th>
                  <th className="border border-black px-1 py-1 w-16" rowSpan={2}>Thế hệ</th>
                  <th className="border border-black px-2 py-1 w-52" rowSpan={2}>Nguồn gốc</th>
                  <th className="border border-black px-1 py-1 w-12" rowSpan={2}>Ghi chú</th>
                </tr>
                <tr className="bg-slate-50 font-bold text-[11px]">
                  <th className="border border-black px-1.5 py-1 w-24">Tên tiếng việt / tên thương mại</th>
                  <th className="border border-black px-1.5 py-1 italic w-24">Tên khoa học</th>
                  <th className="border border-black px-1 py-1 w-8">Đực</th>
                  <th className="border border-black px-1 py-1 w-8">Cái</th>
                  <th className="border border-black px-1 py-1 w-10">Không xác định</th>
                  <th className="border border-black px-1 py-1 w-10">Tổng</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black py-8 font-bold">1</td>
                  <td className="border border-black px-1 text-left font-semibold">
                    <AutoHighlight>{data.speciesName || "Chim chào mào"}</AutoHighlight>
                  </td>
                  <td className="border border-black px-1 text-left italic">
                    <AutoHighlight>{data.scientificName || "Pycnonotus jocosus"}</AutoHighlight>
                  </td>
                  <td className="border border-black px-0.5 font-semibold bg-yellow-50/10">
                    <AutoHighlight>{padZero(data.maleCount)}</AutoHighlight>
                  </td>
                  <td className="border border-black px-0.5 font-semibold bg-yellow-50/10">
                    <AutoHighlight>{padZero(data.femaleCount)}</AutoHighlight>
                  </td>
                  <td className="border border-black px-0.5 font-semibold text-slate-500">
                    <AutoHighlight>{padZero(data.unknownCount)}</AutoHighlight>
                  </td>
                  <td className="border border-black px-1 font-bold bg-slate-50/50">
                    <AutoHighlight>{padZero(totalQty)}</AutoHighlight>
                  </td>
                  <td className="border border-black px-1 font-bold bg-slate-50/50">
                    <AutoHighlight>{totalWeight.toLocaleString('vi-VN')}</AutoHighlight>
                  </td>
                  <td className="border border-black px-1 text-xs">
                    F3 và kế tiếp
                  </td>
                  <td className="border border-black px-1.5 py-3 text-[11px] text-justify leading-tight">
                    <span className="font-semibold"><AutoHighlight>{data.speciesName || "Chim chào mào"}</AutoHighlight></span> được gây nuôi từ trại nuôi sinh sản ĐVHD thông thường của ông Đinh Văn Hùng, đội 3 thôn Kè Nhạn, xã Đồng Yên, tỉnh Tuyên Quang.
                  </td>
                  <td className="border border-black px-1">
                    {/* Empty */}
                  </td>
                </tr>
                
                {/* Footer totals */}
                <tr className="font-bold bg-slate-100 text-[11px]">
                  <td className="border border-black py-2.5 uppercase text-right px-2" colSpan={3}>Tổng:</td>
                  <td className="border border-black px-0.5">{padZero(data.maleCount)}</td>
                  <td className="border border-black px-0.5">{padZero(data.femaleCount)}</td>
                  <td className="border border-black px-0.5">{padZero(data.unknownCount)}</td>
                  <td className="border border-black px-1 bg-slate-200/50">{padZero(totalQty)}</td>
                  <td className="border border-black px-1 bg-slate-200/50">{totalWeight.toLocaleString('vi-VN')} kg</td>
                  <td className="border border-black" colSpan={3}></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-right text-xs text-slate-400 mt-4 border-t border-dashed border-slate-200 pt-2 font-sans select-none">
            Trang 3 / 3 — Bảng kê chi tiết
          </div>
        </div>
      </div>
    </div>
  );
}
