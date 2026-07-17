/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StatementData } from './types';
import { Document, Paragraph, TextRun, Packer, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle } from 'docx';

// Pad single digit numbers with a leading zero (e.g. 5 -> "05")
export function padZero(num: number | string): string {
  const n = typeof num === 'number' ? num : parseInt(num, 10);
  if (isNaN(n)) return typeof num === 'string' ? num : '';
  return n < 10 ? `0${n}` : `${n}`;
}

// Convert a number into Vietnamese words
export function numberToVietnameseWords(num: number): string {
  if (num === 0) return "không";
  const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const tens = ["", "mười", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"];
  
  function readThreeDigits(n: number, showZeroHundred: boolean): string {
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const unit = n % 10;
    let res = "";
    
    if (hundred > 0 || showZeroHundred) {
      res += units[hundred] + " trăm ";
    }
    
    if (ten > 0) {
      if (ten === 1) {
        res += "mười ";
      } else {
        res += units[ten] + " mươi ";
      }
    } else if (hundred > 0 && unit > 0) {
      res += "lẻ ";
    }
    
    if (unit > 0) {
      if (unit === 1 && ten > 1) {
        res += "mốt";
      } else if (unit === 5 && ten > 0) {
        res += "lăm";
      } else if (unit === 5 && ten === 0) {
        res += "năm";
      } else {
        res += units[unit];
      }
    }
    return res.trim();
  }

  let result = "";
  let temp = num;
  const million = Math.floor(temp / 1000000);
  temp %= 1000000;
  const thousand = Math.floor(temp / 1000);
  const remaining = temp % 1000;

  if (million > 0) {
    result += readThreeDigits(million, false) + " triệu ";
  }
  if (thousand > 0) {
    result += readThreeDigits(thousand, million > 0) + " nghìn ";
  }
  if (remaining > 0) {
    result += readThreeDigits(remaining, million > 0 || thousand > 0);
  }

  return result.trim().replace(/\s+/g, " ");
}

// Convert quantity to formal sentence
export function quantityToWords(quantity: number): string {
  const words = numberToVietnameseWords(quantity);
  // Capitalize first letter
  return words.charAt(0).toUpperCase() + words.slice(1) + " cá thể";
}

// Convert weight to formal sentence
// Convert weight to formal sentence
export function weightToWords(weight: number): string {
  const roundedWeight = parseFloat(weight.toFixed(2));
  const integerPart = Math.floor(roundedWeight);
  const decimalPart = Math.round((roundedWeight - integerPart) * 100);
  
  const integerWords = numberToVietnameseWords(integerPart);
  let words = integerWords.charAt(0).toUpperCase() + integerWords.slice(1);
  
  if (decimalPart > 0) {
    let decVal = decimalPart;
    if (decVal % 10 === 0) {
      decVal = decVal / 10;
    }
    const decimalWords = numberToVietnameseWords(decVal);
    words += " phẩy " + decimalWords;
  }
  
  return words + " kilôgam";
}

// Common wildlife species in Vietnam
export const SPECIES_LIST = [
  { name: "Trĩ đỏ khoang cổ", sci: "Phasianus colchicus" },
  { name: "Trĩ xanh", sci: "Phasianus versicolor" },
  { name: "Cầy vòi hương", sci: "Paradoxurus hermaphroditus" },
  { name: "Rùa Trung Bộ", sci: "Mauremys annamensis" },
  { name: "Voi Châu Á", sci: "Elephas maximus" },
  { name: "Tê tê Java", sci: "Manis javanica" },
  { name: "Tê tê vàng", sci: "Manis pentadactyla" },
  { name: "Gấu ngựa", sci: "Ursus thibetanus" },
  { name: "Gấu chó", sci: "Helarctos malayanus" },
  { name: "Cầy giông sọc", sci: "Viverra megaspila" },
  { name: "Rùa hộp ba vạch", sci: "Cuora trifasciata" },
  { name: "Rùa hộp lưng đen", sci: "Cuora amboinensis" },
  { name: "Rùa núi vàng", sci: "Indotestudo elongata" },
  { name: "Rắn hổ mang chúa", sci: "Ophiophagus hannah" },
  { name: "Rắn hổ mang đất", sci: "Naja kaouthia" },
  { name: "Kỳ đà vân", sci: "Varanus nebulosus" },
  { name: "Kỳ đà hoa", sci: "Varanus salvator" },
  { name: "Khỉ vàng", sci: "Macaca mulatta" },
  { name: "Khỉ đuôi dài", sci: "Macaca fascicularis" },
  { name: "Hoẵng Nam Bộ", sci: "Muntiacus muntjak" },
  { name: "Sơn dương", sci: "Capricornis milneedwardsii" },
  { name: "Hươu sao", sci: "Cervus nippon" }
];

// Vietnamese date string formatter
export function formatVietnameseDate(dateStr: string): string {
  if (!dateStr) return "ngày ... tháng ... năm ...";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = padZero(d.getDate());
  const month = padZero(d.getMonth() + 1);
  const year = d.getFullYear();
  return `ngày ${day} tháng ${month} năm ${year}`;
}

// Return prefilled Vietnamese animal inventory statement
export function getSampleStatement(): StatementData {
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 5);
  
  const todayStr = today.toISOString().split('T')[0];
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  return {
    id: "ST-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
    statementNo: "189/2026/BK-ĐVH",
    issueDate: todayStr,
    
    // Buyer
    buyerName: "Nguyễn Văn Hùng",
    buyerCccd: "037095004123",
    buyerAddress: "Số 24 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội",
    buyerPhone: "0912.345.678",
    buyerEmail: "",

    // Animal
    speciesName: "Trĩ đỏ khoang cổ",
    scientificName: "Phasianus colchicus",
    maleCount: 15,
    femaleCount: 20,
    unknownCount: 0,
    weightPerIndividual: 1.2,

    // Transport
    vehiclePlate: "29C-789.45",
    fromDate: todayStr,
    toDate: nextWeekStr,
    fromAddress: "Trại nuôi Đinh Văn Hùng, Thôn Lập Thành, Đông Yên, Quốc Oai, Hà Nội",
    toAddress: "Hộ kinh doanh Nguyễn Văn Hùng, Số 24 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội",

    status: 'draft',
    createdAt: new Date().toISOString()
  };
}

// Export the statement to Word document (.docx) using 'docx' library
export async function downloadDocx(data: StatementData) {
  const totalQty = data.maleCount + data.femaleCount + data.unknownCount;
  const totalWeight = parseFloat((totalQty * data.weightPerIndividual).toFixed(2));
  const qtyWords = quantityToWords(totalQty);
  const weightWords = weightToWords(totalWeight);
  const dateFormatted = formatVietnameseDate(data.issueDate);
  const fromDateFormatted = formatVietnameseDate(data.fromDate);
  const toDateFormatted = formatVietnameseDate(data.toDate);

  // Helper for cells
  const createCell = (text: string, bold: boolean = false, align: AlignmentType = AlignmentType.LEFT, width: number = 100) => {
    return new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text, bold, size: 22, font: "Times New Roman" })],
          alignment: align,
        }),
      ],
      width: { size: width, type: WidthType.PERCENTAGE },
    });
  };

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // ================= PAGE 1 =================
          // Form 01 header label
          new Paragraph({
            children: [
              new TextRun({ text: "Mẫu số 01", italic: true, size: 20, font: "Times New Roman" })
            ],
            alignment: AlignmentType.LEFT,
          }),
          
          // National Header
          new Paragraph({
            children: [
              new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true, size: 26, font: "Times New Roman" })
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", bold: true, size: 24, font: "Times New Roman" })
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "-----------------------", size: 24, font: "Times New Roman" })
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ children: [] }), // spacer

          // Title
          new Paragraph({
            children: [
              new TextRun({ text: "BẢNG KÊ ĐỘNG VẬT HOANG DÃ DÃ NGOẠI", bold: true, size: 32, font: "Times New Roman" })
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Số: ${data.statementNo || "..............."}`, bold: true, italic: true, size: 24, font: "Times New Roman" })
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Lập ngày: ${dateFormatted}`, italic: true, size: 24, font: "Times New Roman" })
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ children: [] }), // spacer

          // Exporter Info
          new Paragraph({
            children: [
              new TextRun({ text: "1. THÔNG TIN CHỦ CƠ SỞ (NGƯỜI BÁN):", bold: true, size: 24, font: "Times New Roman" })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Họ và tên: ", bold: true, size: 24, font: "Times New Roman" }),
              new TextRun({ text: "Đinh Văn Hùng", size: 24, font: "Times New Roman" })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Địa chỉ: ", bold: true, size: 24, font: "Times New Roman" }),
              new TextRun({ text: "Thôn Lập Thành, Xã Đông Yên, Huyện Quốc Oai, Thành phố Hà Nội", size: 24, font: "Times New Roman" })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Số điện thoại: ", bold: true, size: 24, font: "Times New Roman" }),
              new TextRun({ text: "0987.654.321", size: 24, font: "Times New Roman" }),
              new TextRun({ text: "   |   Email: ", bold: true, size: 24, font: "Times New Roman" }),
              new TextRun({ text: "dinhvanhung@gmail.com", size: 24, font: "Times New Roman" })
            ]
          }),
          new Paragraph({ children: [] }), // spacer

          // Buyer Info
          new Paragraph({
            children: [
              new TextRun({ text: "2. THÔNG TIN KHÁCH HÀNG (NGƯỜI MUA):", bold: true, size: 24, font: "Times New Roman" })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Họ và tên: ", bold: true, size: 24, font: "Times New Roman" }),
              new TextRun({ text: data.buyerName, size: 24, font: "Times New Roman" })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Số CCCD/Hộ chiếu: ", bold: true, size: 24, font: "Times New Roman" }),
              new TextRun({ text: data.buyerCccd, size: 24, font: "Times New Roman" })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Địa chỉ: ", bold: true, size: 24, font: "Times New Roman" }),
              new TextRun({ text: data.buyerAddress, size: 24, font: "Times New Roman" })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Số điện thoại: ", bold: true, size: 24, font: "Times New Roman" }),
              new TextRun({ text: data.buyerPhone, size: 24, font: "Times New Roman" })
            ]
          }),
          new Paragraph({ children: [] }), // spacer

          // Animal Table Heading
          new Paragraph({
            children: [
              new TextRun({ text: "3. DANH SÁCH ĐỘNG VẬT HOANG DÃ KÊ KHAI:", bold: true, size: 24, font: "Times New Roman" })
            ]
          }),
          new Paragraph({ children: [] }),

          // Table
          new Table({
            rows: [
              // Header Row
              new TableRow({
                children: [
                  createCell("STT", true, AlignmentType.CENTER, 5),
                  createCell("Tên thông thường", true, AlignmentType.CENTER, 20),
                  createCell("Tên khoa học", true, AlignmentType.CENTER, 25),
                  createCell("Đực (con)", true, AlignmentType.CENTER, 10),
                  createCell("Cái (con)", true, AlignmentType.CENTER, 10),
                  createCell("KXĐ (con)", true, AlignmentType.CENTER, 10),
                  createCell("KL/cá thể (kg)", true, AlignmentType.CENTER, 10),
                  createCell("Tổng SL", true, AlignmentType.CENTER, 10),
                  createCell("Tổng KL (kg)", true, AlignmentType.CENTER, 10),
                ],
              }),
              // Data Row
              new TableRow({
                children: [
                  createCell("01", false, AlignmentType.CENTER, 5),
                  createCell(data.speciesName, false, AlignmentType.LEFT, 20),
                  createCell(data.scientificName, false, AlignmentType.LEFT, 25),
                  createCell(padZero(data.maleCount), false, AlignmentType.CENTER, 10),
                  createCell(padZero(data.femaleCount), false, AlignmentType.CENTER, 10),
                  createCell(padZero(data.unknownCount), false, AlignmentType.CENTER, 10),
                  createCell(data.weightPerIndividual.toString(), false, AlignmentType.CENTER, 10),
                  createCell(padZero(totalQty), true, AlignmentType.CENTER, 10),
                  createCell(totalWeight.toString(), true, AlignmentType.CENTER, 10),
                ],
              }),
              // Totals Row
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "TỔNG CỘNG", bold: true, size: 22, font: "Times New Roman" })],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    columnSpan: 3,
                  }),
                  createCell(padZero(data.maleCount), true, AlignmentType.CENTER, 10),
                  createCell(padZero(data.femaleCount), true, AlignmentType.CENTER, 10),
                  createCell(padZero(data.unknownCount), true, AlignmentType.CENTER, 10),
                  createCell("-", false, AlignmentType.CENTER, 10),
                  createCell(padZero(totalQty), true, AlignmentType.CENTER, 10),
                  createCell(totalWeight.toString(), true, AlignmentType.CENTER, 10),
                ],
              }),
            ],
          }),
          new Paragraph({ children: [] }),

          // Summary Text
          new Paragraph({
            children: [
              new TextRun({ text: "Tổng số lượng bằng chữ: ", bold: true, size: 24, font: "Times New Roman" }),
              new TextRun({ text: qtyWords + ".", italic: true, size: 24, font: "Times New Roman" })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Tổng khối lượng bằng chữ: ", bold: true, size: 24, font: "Times New Roman" }),
              new TextRun({ text: weightWords + ".", italic: true, size: 24, font: "Times New Roman" })
            ]
          }),

          // ================= PAGE 2 =================
          // Form 141 Header Label
          new Paragraph({
            children: [
              new TextRun({ text: "Mẫu số 141", italic: true, size: 20, font: "Times New Roman" })
            ],
            alignment: AlignmentType.LEFT,
            pageBreakBefore: true, // hard page break to start Page 2
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Kèm theo Bảng kê lâm sản số: ${data.statementNo || "..............."}`, italic: true, size: 20, font: "Times New Roman" })
            ],
            alignment: AlignmentType.RIGHT,
          }),
          
          // National Header
          new Paragraph({
            children: [
              new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true, size: 26, font: "Times New Roman" })
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", bold: true, size: 24, font: "Times New Roman" })
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "-----------------------", size: 24, font: "Times New Roman" })
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ children: [] }), // spacer

          // Title Page 2
          new Paragraph({
            children: [
              new TextRun({ text: "XÁC NHẬN CỦA HẠT KIỂM LÂM SỞ TẠI", bold: true, size: 30, font: "Times New Roman" })
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ children: [] }), // spacer

          // Transport Details Section
          new Paragraph({
            children: [
              new TextRun({ text: "4. PHƯƠNG THỨC VÀ HÀNH TRÌNH VẬN CHUYỂN:", bold: true, size: 24, font: "Times New Roman" })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Phương tiện vận chuyển: ", bold: true, size: 24, font: "Times New Roman" }),
              new TextRun({ text: `Xe ô tô mang biển số: ${data.vehiclePlate || "...................."}`, size: 24, font: "Times New Roman" })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Thời gian vận chuyển: ", bold: true, size: 24, font: "Times New Roman" }),
              new TextRun({ text: `Từ ngày ${fromDateFormatted} đến hết ngày ${toDateFormatted}`, size: 24, font: "Times New Roman" })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Tuyến đường vận chuyển: ", bold: true, size: 24, font: "Times New Roman" })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "  + Điểm đi (Xuất phát): ", bold: true, size: 24, font: "Times New Roman" }),
              new TextRun({ text: data.fromAddress, size: 24, font: "Times New Roman" })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "  + Điểm đến (Giao nhận): ", bold: true, size: 24, font: "Times New Roman" }),
              new TextRun({ text: data.toAddress, size: 24, font: "Times New Roman" })
            ]
          }),
          new Paragraph({ children: [] }), // spacer
          new Paragraph({ children: [] }),

          // Certification paragraphs
          new Paragraph({
            children: [
              new TextRun({ text: "XÁC NHẬN CỦA HẠT KIỂM LÂM HUYỆN QUỐC OAI:", bold: true, size: 24, font: "Times New Roman" })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ 
                text: `Hạt Kiểm lâm huyện Quốc Oai thuộc Chi cục Kiểm lâm thành phố Hà Nội tiến hành xác nhận bảng kê lâm sản (động vật hoang dã dã ngoại) số: ${data.statementNo || '................'} này đối với chủ cơ sở là ông Đinh Văn Hùng.`, 
                size: 24, 
                font: "Times New Roman" 
              })
            ],
            alignment: AlignmentType.JUSTIFY,
          }),
          new Paragraph({
            children: [
              new TextRun({ 
                text: "Căn cứ hồ sơ xin xác nhận vận chuyển lâm sản và biên bản kiểm tra thực tế nguồn gốc lâm sản ngày ...... tháng ...... năm 2026 của Kiểm lâm viên phụ trách địa bàn.", 
                size: 24, 
                font: "Times New Roman" 
              })
            ],
            alignment: AlignmentType.JUSTIFY,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "KẾT QUẢ KIỂM TRA XÁC MINH:", bold: true, size: 24, font: "Times New Roman" })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ 
                text: `- Lâm sản đề nghị xác nhận vận chuyển gồm có: ${totalQty} cá thể loài ${data.speciesName || "..............."} (${data.scientificName || "........."}).`, 
                size: 24, 
                font: "Times New Roman" 
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ 
                text: "- Nguồn gốc động vật hoang dã: Sinh sản, nuôi dưỡng thế hệ F2 hợp pháp tại trang trại nuôi sinh sản của ông Đinh Văn Hùng được cơ quan nhà nước có thẩm quyền cấp phép hoạt động, đăng ký mã số cơ sở nuôi đúng quy chuẩn kỹ thuật.", 
                size: 24, 
                font: "Times New Roman" 
              })
            ],
            alignment: AlignmentType.JUSTIFY,
          }),
          new Paragraph({
            children: [
              new TextRun({ 
                text: "- Tình trạng sức khỏe cá thể tại thời điểm kiểm tra: Hoàn toàn khỏe mạnh, không mang mầm bệnh nguy hiểm, phù hợp các tiêu chuẩn kiểm dịch thú y hiện hành.", 
                size: 24, 
                font: "Times New Roman" 
              })
            ],
            alignment: AlignmentType.JUSTIFY,
          }),

          // ================= PAGE 3 =================
          // Form 141 Page 3 Header Label
          new Paragraph({
            children: [
              new TextRun({ text: "Mẫu số 141 (tiếp theo)", italic: true, size: 20, font: "Times New Roman" })
            ],
            alignment: AlignmentType.LEFT,
            pageBreakBefore: true, // hard page break to start Page 3
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Kèm theo Bảng kê lâm sản số: ${data.statementNo || "..............."}`, italic: true, size: 20, font: "Times New Roman" })
            ],
            alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({ children: [] }), // spacer

          // Certification continuation
          new Paragraph({
            children: [
              new TextRun({ 
                text: `Các thông tin về phương tiện vận chuyển mang biển số ${data.vehiclePlate || "............"}, thời gian vận chuyển di chuyển từ ${fromDateFormatted} đến ${toDateFormatted} từ địa chỉ thôn Lập Thành, Đông Yên, Quốc Oai, Hà Nội đến địa chỉ ${data.toAddress || "..................."} là hoàn toàn chính xác và trùng khớp với hiện trạng thực tế.`, 
                size: 24, 
                font: "Times New Roman" 
              })
            ],
            alignment: AlignmentType.JUSTIFY,
          }),
          new Paragraph({
            children: [
              new TextRun({ 
                text: "Hạt Kiểm lâm huyện Quốc Oai xác nhận số lượng lâm sản trên có nguồn gốc hợp pháp, đủ điều kiện để lưu hành, vận chuyển thương mại trong nước theo quy định pháp luật hiện hành về quản lý thực thực vật rừng, động vật rừng nguy cấp, quý, hiếm.", 
                size: 24, 
                font: "Times New Roman" 
              })
            ],
            alignment: AlignmentType.JUSTIFY,
          }),
          new Paragraph({
            children: [
              new TextRun({ 
                text: "Bảng kê này được lập thành 03 bản chính có giá trị pháp lý như nhau: 01 bản lưu tại cơ quan kiểm lâm sở tại, 01 bản giao cho chủ lâm sản (người bán), 01 bản đồng hành cùng phương tiện vận chuyển bàn giao cho người mua lưu giữ.", 
                size: 24, 
                font: "Times New Roman" 
              })
            ],
            alignment: AlignmentType.JUSTIFY,
          }),
          new Paragraph({ children: [] }), // spacer
          new Paragraph({ children: [] }),

          // Signature Block Table (2 columns, transparent borders)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "auto" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
              left: { style: BorderStyle.NONE, size: 0, color: "auto" },
              right: { style: BorderStyle.NONE, size: 0, color: "auto" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "KIỂM LÂM VIÊN KIỂM TRA", bold: true, size: 24, font: "Times New Roman" })],
                        alignment: AlignmentType.CENTER,
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: "(Ký, ghi rõ họ tên)", italic: true, size: 20, font: "Times New Roman" })],
                        alignment: AlignmentType.CENTER,
                      }),
                      new Paragraph({ children: [] }),
                      new Paragraph({ children: [] }),
                      new Paragraph({ children: [] }),
                      new Paragraph({
                        children: [new TextRun({ text: "......................................................", size: 24, font: "Times New Roman" })],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "HẠT TRƯỞNG HẠT KIỂM LÂM", bold: true, size: 24, font: "Times New Roman" })],
                        alignment: AlignmentType.CENTER,
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: "(Ký tên, đóng dấu, ghi rõ họ tên)", italic: true, size: 20, font: "Times New Roman" })],
                        alignment: AlignmentType.CENTER,
                      }),
                      new Paragraph({ children: [] }),
                      new Paragraph({ children: [] }),
                      new Paragraph({ children: [] }),
                      new Paragraph({
                        children: [new TextRun({ text: "......................................................", size: 24, font: "Times New Roman" })],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [] }), // spacer
                      new Paragraph({ children: [] }),
                    ]
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [] }),
                      new Paragraph({ children: [] }),
                    ]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "CHỦ CƠ SỞ (NGƯỜI BÁN)", bold: true, size: 24, font: "Times New Roman" })],
                        alignment: AlignmentType.CENTER,
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: "(Đinh Văn Hùng - Ký và ghi rõ họ tên)", italic: true, size: 20, font: "Times New Roman" })],
                        alignment: AlignmentType.CENTER,
                      }),
                      new Paragraph({ children: [] }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "ĐÃ KÝ ĐIỆN TỬ\nĐinh Văn Hùng",
                            bold: true,
                            size: 18,
                            font: "Times New Roman",
                            color: "FF0000"
                          })
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                      new Paragraph({ children: [] }),
                      new Paragraph({
                        children: [new TextRun({ text: "Đinh Văn Hùng", bold: true, size: 24, font: "Times New Roman" })],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "KHÁCH HÀNG (NGƯỜI MUA)", bold: true, size: 24, font: "Times New Roman" })],
                        alignment: AlignmentType.CENTER,
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: "(Ký và ghi rõ họ tên)", italic: true, size: 20, font: "Times New Roman" })],
                        alignment: AlignmentType.CENTER,
                      }),
                      new Paragraph({ children: [] }),
                      new Paragraph({ children: [] }),
                      new Paragraph({ children: [] }),
                      new Paragraph({
                        children: [new TextRun({ text: data.buyerName || "......................................................", bold: true, size: 24, font: "Times New Roman" })],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bang_Ke_DVHD_${data.statementNo.replace(/\//g, '_')}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

