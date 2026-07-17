/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StatementData } from './types';
import { Document, Paragraph, TextRun, Packer, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, ImageRun } from 'docx';
import { QR_CODE_BASE64 } from './qrCodeBase64';

function base64ToUint8Array(base64Str: string): Uint8Array {
  const base64WithoutHeader = base64Str.split(',')[1] || base64Str;
  const binaryString = atob(base64WithoutHeader);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}


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
    words += " phảy " + decimalWords;
  }
  
  return words + " kilogam";
}

// Common wildlife species in Vietnam
export const SPECIES_LIST = [
  { name: "Chim chào mào", sci: "Pycnonotus jocosus" },
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
    statementNo: "001/26/BKLS",
    issueDate: "2026-07-15",
    
    // Buyer
    buyerName: "Nguyễn Mậu Thìn",
    buyerCccd: "038089028305",
    buyerAddress: "Tổ 20, Khu phố Hương Phước, Phường Phước Tân, TP Đồng Nai.",
    buyerPhone: "0976 528 945",

    // Animal
    speciesName: "Chim chào mào",
    scientificName: "Pycnonotus jocosus",
    maleCount: 2,
    femaleCount: 2,
    unknownCount: 0,
    weightPerIndividual: 0.03,

    // Transport
    vehiclePlate: "",
    fromDate: "2026-07-15",
    toDate: "2026-07-20",
    fromAddress: "Đội 3 thôn Kè Nhạn, xã Đồng Yên, tỉnh Tuyên Quang.",
    toAddress: "cơ sở ông Nguyễn Mậu Thìn, Tổ 20, Khu phố Hương Phước, Phường Phước Tân, TP Đồng Nai.",

    status: 'draft',
    createdAt: new Date().toISOString()
  };
}

// Export the statement to Word document (.docx) using 'docx' library
export async function downloadDocx(data: StatementData) {
  const totalQty = data.maleCount + data.femaleCount + data.unknownCount;
  const totalWeight = parseFloat((totalQty * data.weightPerIndividual).toFixed(2));
  const qtyWords = quantityToWords(totalQty);
  const textQtyWords = qtyWords.charAt(0).toUpperCase() + qtyWords.slice(1);
  const weightWords = weightToWords(totalWeight);
  const textWeightWords = weightWords.charAt(0).toUpperCase() + weightWords.slice(1);

  // Helper for admin text (Red, no highlight, no bold)
  const adminRun = (text: string) => new TextRun({
    text,
    color: "FF0000",
    bold: false,
    size: 24,
    font: "Times New Roman"
  });

  // Helper for buyer text (Blue, no highlight, no bold)
  const buyerRun = (text: string) => new TextRun({
    text,
    color: "0000FF",
    bold: false,
    size: 24,
    font: "Times New Roman"
  });

  // Helper for automatic text (Highlighted in yellow, no bold)
  const autoRun = (text: string) => new TextRun({
    text,
    highlight: "yellow",
    bold: false,
    size: 24,
    font: "Times New Roman"
  });

  // Convert base64 QR code to Uint8Array for docx
  let qrCodeImageRun: ImageRun | null = null;
  try {
    const qrBytes = base64ToUint8Array(QR_CODE_BASE64);
    qrCodeImageRun = new ImageRun({
      data: qrBytes,
      transformation: {
        width: 80,
        height: 80,
      },
    } as any);
  } catch (err) {
    console.error("Failed to load QR code image for DOCX:", err);
  }

  // Helper for normal template text
  const normalRun = (text: string, bold: boolean = false, italic: boolean = false, size: number = 24) => new TextRun({
    text,
    bold,
    italics: italic,
    size,
    font: "Times New Roman"
  });

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

  const issueParts = parseDateParts(data.issueDate);
  const toParts = parseDateParts(data.toDate);

  // Helper for cells
  const createCell = (
    text: string | TextRun[], 
    bold: boolean = false, 
    align: any = AlignmentType.LEFT, 
    width: number = 10,
    colSpan: number = 1,
    rowSpan: number = 1
  ) => {
    const children = typeof text === 'string' 
      ? [new Paragraph({
          children: [new TextRun({ text, bold, size: 20, font: "Times New Roman" })],
          alignment: align
        })]
      : [new Paragraph({
          children: text,
          alignment: align
        })];

    return new TableCell({
      children,
      width: { size: width, type: WidthType.PERCENTAGE },
      columnSpan: colSpan > 1 ? colSpan : undefined,
      rowSpan: rowSpan > 1 ? rowSpan : undefined,
    });
  };

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // ================= PAGE 1 =================
          // Header Label
          new Paragraph({
            children: [
              normalRun("Mẫu số 01", true, false, 24)
            ],
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({
            children: [
              normalRun(".....................................", false, false, 20)
            ],
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({
            children: [
              normalRun(".....................................", false, false, 20)
            ],
            alignment: AlignmentType.LEFT,
          }),

          // National Header
          new Paragraph({
            children: [
              normalRun("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", true, false, 26)
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              normalRun("Độc lập – Tự do – Hạnh phúc", true, false, 24)
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              normalRun("-----------------------", false, false, 24)
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ children: [] }), // spacer

          // Details line
          new Paragraph({
            children: [
              normalRun("Số(1): ", true),
              adminRun(data.statementNo || "001/26/BKLS"),
              normalRun("\t\t\t\t\tTờ số(2): ...... Tổng số tờ: ......; ...... trang", false, true)
            ],
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({ children: [] }), // spacer

          // Title
          new Paragraph({
            children: [
              normalRun("BẢNG KÊ LÂM SẢN", true, false, 32)
            ],
            alignment: AlignmentType.CENTER,
          }),
          // QR Code Image
          new Paragraph({
            children: qrCodeImageRun ? [qrCodeImageRun] : [normalRun("[Mã QR]", false, false, 18)],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ children: [] }), // spacer

          // I. General Info
          new Paragraph({
            children: [
              normalRun("I. THÔNG TIN CHUNG", true, false, 24)
            ]
          }),

          // 1. Owner
          new Paragraph({
            children: [
              normalRun("1. Thông tin chủ lâm sản:", true)
            ]
          }),
          new Paragraph({
            children: [
              normalRun("- Tên chủ lâm sản(4): Đinh Văn Hùng", false)
            ]
          }),
          new Paragraph({
            children: [
              normalRun("- Số GCN/MSDN/GPTL/ĐKHĐ/CCCD/CMND/HC(5): 002093011338", false)
            ]
          }),
          new Paragraph({
            children: [
              normalRun("- Địa chỉ(6): Đội 3 thôn Kè Nhạn, xã Đồng Yên, tỉnh Tuyên Quang.", false)
            ]
          }),
          new Paragraph({
            children: [
              normalRun("- Số điện thoại: 0962 313 828 , Địa chi Email: ................................................................", false)
            ]
          }),
          new Paragraph({ children: [] }), // spacer

          // 2. Buyer
          new Paragraph({
            children: [
              normalRun("2. Thông tin tổ chức, cá nhân mua/nhận chuyển giao quyền sở hữu:", true)
            ]
          }),
          new Paragraph({
            children: [
              normalRun("- Tên tổ chức, cá nhân(4): "),
              buyerRun(data.buyerName || "...................................................")
            ]
          }),
          new Paragraph({
            children: [
              normalRun("- Số GCN/MSDN/GPTL/ĐKHĐ/CCCD/CMND/HC(5): "),
              buyerRun(data.buyerCccd || "...................................................")
            ]
          }),
          new Paragraph({
            children: [
              normalRun("- Địa chỉ(6): "),
              buyerRun(data.buyerAddress || "......................................................................................................")
            ]
          }),
          new Paragraph({
            children: [
              normalRun("- Số điện thoại: "),
              buyerRun(data.buyerPhone || "......................................"),
              normalRun(" , Địa chi Email: ...............................................................")
            ]
          }),
          new Paragraph({ children: [] }), // spacer

          // 3. Wildlife Info
          new Paragraph({
            children: [
              normalRun("3. Thông tin về lâm sản", true)
            ]
          }),
          new Paragraph({
            children: [
              normalRun("- Tên loài (tên khoa học, tên tiếng việt hoặc tên thương mại): "),
              autoRun(data.speciesName || "Chim chào mào"),
              normalRun("/"),
              autoRun(data.scientificName || "Pycnonotus jocosus"),
              normalRun(".")
            ]
          }),
          new Paragraph({
            children: [
              normalRun("- Nhóm loài: (Thông thường; Nhóm IA, IIA, IB, IIB của danh mục thực vật rừng, động vật rừng nguy cấp, quý, hiếm; Phụ lục I, II, III CITES): ", false, true),
              normalRun("Thông thường.", true)
            ]
          }),
          new Paragraph({
            children: [
              normalRun("- Nguồn gốc(7): "),
              autoRun(data.speciesName || "Chim chào mào"),
              normalRun(" được gây nuôi từ trại nuôi sinh sản ĐVHD thông thường của ông Đinh Văn Hùng, đội 3 thôn Kè Nhạn, xã Đồng Yên, tỉnh Tuyên Quang.")
            ]
          }),
          new Paragraph({
            children: [
              normalRun("- Mã HS (áp dụng đối với lâm sản nhập khẩu, xuất khẩu): .............................................................................................")
            ]
          }),
          new Paragraph({
            children: [
              normalRun("- Giá trị (nếu có): ..................................................................................................................................................")
            ]
          }),
          new Paragraph({
            children: [
              normalRun("- Khối lượng/trọng lượng (bằng số và chữ): Đơn vị tính (m³, kg, ster, lít, mililít): "),
              autoRun((data.speciesName || "Chim chào mào") + ", trọng lượng: " + totalWeight.toLocaleString('vi-VN') + " kg (" + textWeightWords + ").")
            ]
          }),
          new Paragraph({
            children: [
              normalRun("- Số lượng (bằng số và chữ): Đơn vị tính (lóng, khúc, thanh, tấm, hộp, viên, cây,...): "),
              autoRun((data.speciesName || "Chim chào mào") + ", số lượng: " + padZero(totalQty) + " cá thể (" + textQtyWords + "; "),
              buyerRun(padZero(data.maleCount) + " đực, " + padZero(data.femaleCount) + " cái"),
              autoRun(").")
            ]
          }),

          // ================= PAGE 2 =================
          new Paragraph({
            children: [
              normalRun("- Thông tin về lô khai thác: ............................................................................................................................................................")
            ],
            pageBreakBefore: true
          }),
          new Paragraph({
            children: [
              normalRun("- Thông tin khác có liên quan (nếu có): .............................................................................................................................................")
            ]
          }),
          new Paragraph({
            children: [
              normalRun("4. Thông tin chi tiết tại Bảng kê khai thác kèm theo: ", true),
              normalRun("(Áp dụng đối với gỗ nguyên liệu; sản phẩm gỗ; khai thác từ rừng tự nhiên hoặc nhập khẩu hoặc xử lý tịch thu hoặc động vật và sản phẩm của động vật thuộc loài nguy cấp, quý, hiếm hoặc thuộc Phụ lục CITES)", false, true),
              normalRun(":")
            ]
          }),
          new Paragraph({ children: [] }), // spacer

          new Paragraph({
            children: [
              normalRun("5. Thông tin vận chuyển (nếu có):", true)
            ]
          }),
          new Paragraph({
            children: [
              normalRun("Biển kiểm soát/số hiệu phương tiện: "),
              data.vehiclePlate ? adminRun(data.vehiclePlate) : normalRun("................................................................................................."),
              normalRun("; thời gian vận chuyển: 05 ngày; từ ngày "),
              adminRun(issueParts.day),
              normalRun(" tháng "),
              adminRun(issueParts.month),
              normalRun(" năm "),
              adminRun(issueParts.year),
              normalRun(" đến hết ngày "),
              autoRun(toParts.day),
              normalRun(" tháng "),
              autoRun(toParts.month),
              normalRun(" năm "),
              autoRun(toParts.year),
              normalRun("; Vận chuyển từ: "),
              normalRun("Đội 3 thôn Kè Nhạn, xã Đồng Yên, tỉnh Tuyên Quang", true),
              normalRun(" đến "),
              autoRun("cơ sở ông " + (data.buyerName || "........................") + ", " + (data.buyerAddress || "........................................................")),
              normalRun(".")
            ]
          }),
          new Paragraph({ children: [] }), // spacer

          new Paragraph({
            children: [
              normalRun("6. Hồ sơ kèm theo (nếu có):", true)
            ]
          }),
          new Paragraph({
            children: [
              normalRun("\tChúng tôi/Tôi cam kết những nội dung kê khai trong bảng kê này là đúng sự thật và chịu trách nhiệm trước pháp luật về sự trung thực của thông tin./.")
            ]
          }),
          new Paragraph({ children: [] }), // spacer
          new Paragraph({ children: [] }), // spacer

          // Page 2 Signatures
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "auto" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
              left: { style: BorderStyle.NONE, size: 0, color: "auto" },
              right: { style: BorderStyle.NONE, size: 0, color: "auto" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" }
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          normalRun("Bắc Quang, ngày        tháng     năm " + (issueParts.year || "2026")),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                      new Paragraph({
                        children: [normalRun("XÁC NHẬN CỦA CƠ QUAN", true)],
                        alignment: AlignmentType.CENTER,
                      }),
                      new Paragraph({
                        children: [normalRun("CÓ THẨM QUYỀN", true)],
                        alignment: AlignmentType.CENTER,
                      }),
                      new Paragraph({
                        children: [normalRun("Vào sổ số: ......../2026(8)", false, true, 20)],
                        alignment: AlignmentType.CENTER,
                      }),
                      new Paragraph({
                        children: [normalRun("(Người có thẩm quyền ký, ghi rõ họ tên, đóng dấu)", false, true, 18)],
                        alignment: AlignmentType.CENTER,
                      }),
                      new Paragraph({ children: [] }),
                      new Paragraph({ children: [] }),
                      new Paragraph({ children: [] }),
                      new Paragraph({
                        children: [normalRun("HẠT TRƯỞNG", true)],
                        alignment: AlignmentType.CENTER,
                      }),
                    ]
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          normalRun("Đồng Yên, ngày "),
                          adminRun(issueParts.day),
                          normalRun(" tháng "),
                          adminRun(issueParts.month),
                          normalRun(" năm "),
                          adminRun(issueParts.year)
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                      new Paragraph({
                        children: [normalRun("TỔ CHỨC/CÁ NHÂN LẬP BẢNG KÊ", true)],
                        alignment: AlignmentType.CENTER,
                      }),
                      new Paragraph({
                        children: [normalRun("(Ký, ghi rõ họ tên, đóng dấu đối với tổ chức)", false, true, 18)],
                        alignment: AlignmentType.CENTER,
                      }),
                      new Paragraph({ children: [] }),
                      new Paragraph({ children: [] }),
                      new Paragraph({ children: [] }),
                      new Paragraph({ children: [] }),
                      new Paragraph({
                        children: [normalRun("Đinh Văn Hùng", true)],
                        alignment: AlignmentType.CENTER,
                      }),
                    ]
                  })
                ]
              })
            ]
          }),

          // ================= PAGE 3 =================
          new Paragraph({
            children: [
              normalRun("BẢNG KÊ CHI TIẾT", true, false, 28)
            ],
            alignment: AlignmentType.CENTER,
            pageBreakBefore: true
          }),
          new Paragraph({
            children: [
              normalRun("(Kèm theo Bảng kê lâm sản số: ", false, true, 22),
              adminRun(data.statementNo || "001/26/BKLS"),
              normalRun(" ngày ", false, true, 22),
              adminRun(issueParts.day + "/" + issueParts.month + "/" + issueParts.year),
              normalRun(" của cơ sở nuôi nhốt sinh sản ĐVHD thông thường ông Đinh Văn Hùng)", false, true, 22)
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ children: [] }), // spacer

          new Paragraph({
            children: [
              normalRun("Thông tin chi tiết đối với động vật rừng thông thường, động vật thuộc danh mục loài nguy cấp, quý, hiếm, động vật thuộc các Phụ lục CITES:", true, false, 22)
            ]
          }),
          new Paragraph({ children: [] }), // spacer

          // Structured high-fidelity Page 3 table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              // Row 1 Header
              new TableRow({
                children: [
                  createCell("TT", true, AlignmentType.CENTER, 5, 1, 2),
                  createCell("Tên loài", true, AlignmentType.CENTER, 20, 2, 1),
                  createCell("Số lượng cá thể, trứng", true, AlignmentType.CENTER, 25, 4, 1),
                  createCell("Khối lượng\n(kg)", true, AlignmentType.CENTER, 10, 1, 2),
                  createCell("Thế hệ", true, AlignmentType.CENTER, 10, 1, 2),
                  createCell("Nguồn gốc", true, AlignmentType.CENTER, 25, 1, 2),
                  createCell("Ghi chú", true, AlignmentType.CENTER, 5, 1, 2),
                ]
              }),
              // Row 2 Header
              new TableRow({
                children: [
                  createCell("Tên tiếng việt / tên thương mại", true, AlignmentType.CENTER, 10),
                  createCell("Tên khoa học", true, AlignmentType.CENTER, 10),
                  createCell("Đực", true, AlignmentType.CENTER, 5),
                  createCell("Cái", true, AlignmentType.CENTER, 5),
                  createCell("Không xác định", true, AlignmentType.CENTER, 7),
                  createCell("Tổng", true, AlignmentType.CENTER, 8),
                ]
              }),
              // Row 3 Data
              new TableRow({
                children: [
                  createCell("1", false, AlignmentType.CENTER, 5),
                  createCell([autoRun(data.speciesName || "Chim chào mào")], false, AlignmentType.LEFT, 10),
                  createCell([autoRun(data.scientificName || "Pycnonotus jocosus")], false, AlignmentType.LEFT, 10),
                  createCell([autoRun(padZero(data.maleCount))], false, AlignmentType.CENTER, 5),
                  createCell([autoRun(padZero(data.femaleCount))], false, AlignmentType.CENTER, 5),
                  createCell([autoRun(padZero(data.unknownCount))], false, AlignmentType.CENTER, 7),
                  createCell([autoRun(padZero(totalQty))], false, AlignmentType.CENTER, 8),
                  createCell([autoRun(totalWeight.toLocaleString('vi-VN'))], false, AlignmentType.CENTER, 10),
                  createCell("F3 và kế tiếp", false, AlignmentType.CENTER, 10),
                  createCell([autoRun(data.speciesName || "Chim chào mào"), normalRun(" được gây nuôi từ trại nuôi sinh sản ĐVHD thông thường của ông Đinh Văn Hùng, đội 3 thôn Kè Nhạn, xã Đồng Yên, tỉnh Tuyên Quang.")], false, AlignmentType.LEFT, 25),
                  createCell("", false, AlignmentType.CENTER, 5),
                ]
              }),
              // Row 4 Totals
              new TableRow({
                children: [
                  createCell("Tổng:", true, AlignmentType.RIGHT, 25, 3, 1),
                  createCell([autoRun(padZero(data.maleCount))], false, AlignmentType.CENTER, 5),
                  createCell([autoRun(padZero(data.femaleCount))], false, AlignmentType.CENTER, 5),
                  createCell([autoRun(padZero(data.unknownCount))], false, AlignmentType.CENTER, 7),
                  createCell([autoRun(padZero(totalQty))], false, AlignmentType.CENTER, 8),
                  createCell([autoRun(totalWeight.toLocaleString('vi-VN') + " kg")], false, AlignmentType.CENTER, 10),
                  createCell("", false, AlignmentType.CENTER, 40, 3, 1),
                ]
              })
            ]
          })
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // File name follows the template "Bảng kê ĐVHD số"
  const numPart = data.statementNo.split('/')[0].trim();
  a.download = `Bảng kê ĐVHD số ${numPart}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
