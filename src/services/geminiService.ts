export const geminiService = {
  /**
   * Calls Gemini REST API using standard fetch to avoid dependencies.
   */
  async autoMapFields(
    apiKey: string,
    wordText: string,
    excelColumns: string[]
  ): Promise<Record<string, string>> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
Bạn là một AI phân tích dữ liệu văn bản. Dưới đây là nội dung văn bản bóc tách từ một file Word (Document Text), và danh sách các cột trong một file Excel (Excel Columns).
Nhiệm vụ của bạn là: Lùng sục trong "Document Text" để tìm ra những "chuỗi ký tự / chữ mẫu" nhỏ mà người dùng đã gõ đại diện cho từng cột "Excel Columns".
Ví dụ: Nếu trong Word có chữ "Tuổi: 25" và Excel có cột "Tuổi", thì chữ mẫu cần thay thế cho cột "Tuổi" chính là "25".

Quy tắc bắt buộc:
1. Bạn BẮT BUỘC trả về kết quả dưới định dạng JSON object chuẩn, KHÔNG có thêm bất kỳ chữ nào khác, KHÔNG markdown \`\`\`json.
2. Các "key" của JSON chính là chính xác tên của các "Excel Columns".
3. Các "value" của JSON là đoạn chữ mẫu tương ứng TÌM THẤY TRONG WORD. Nếu không tìm thấy chữ mẫu nào phù hợp cho cột đó, để chuỗi rỗng "". Value phải là đoạn text khớp TỪNG KÝ TỰ trong đoạn Word gốc (để có thể Find & Replace). Đừng bao gồm các nhãn như "Tuổi:", chỉ lấy giá trị "25".

Document Text:
"""
${wordText}
"""

Excel Columns:
${JSON.stringify(excelColumns)}

Trả về JSON:
`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1, // Low temperature for factual extraction
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          (errorData?.error?.message) || "Lỗi khi gọi API Gemini. Vui lòng kiểm tra lại API Key."
        );
      }

      const data = await response.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!resultText) {
        throw new Error("Gemini không trả về kết quả.");
      }

      // Parse JSON from text, strip possible markdown
      const cleanedText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);

    } catch (err: any) {
      console.error("Gemini Error:", err);
      throw new Error(err.message || "Lỗi xử lý API Gemini");
    }
  }
};
