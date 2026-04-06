/**
 * AIService - Gemini 2.5 (2026 Stable) Migration
 * Exclusively uses 2.5 series (Flash, Pro, Lite) with dynamic model discovery.
 */

const FALLBACK_2_5_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.5-flash-lite'
];

export const aiService = {
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  },

  async listAvailableModels(apiKey: string): Promise<string[]> {
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (!resp.ok) return [];
      const data = await resp.json();
      return (data.models || []).map((m: any) => m.name.replace('models/', ''));
    } catch (e) {
      return [];
    }
  },

  async extractTableFromImages(imageFiles: File[], apiKey: string, onModelSwitch?: (model: string) => void): Promise<{ data: any[], modelUsed: string }> {
    if (!apiKey) throw new Error("Vui lòng cấu hình Gemini API Key (VITE_GEMINI_API_KEY) trong file .env");

    const imageParts = await Promise.all(
      imageFiles.map(async (file) => ({
        inlineData: {
          mimeType: file.type || 'image/jpeg',
          data: await this.fileToBase64(file),
        },
      }))
    );

    const prompt = `
      Nhiệm vụ: Chuyển đổi toàn bộ nội dung từ các hình ảnh bảng biểu được cung cấp thành định dạng bảng dữ liệu có cấu trúc (JSON array).
      
      QUY TẮC PHÂN TÍCH:
      1. Trích xuất chính xác các tiêu đề cột có trong ảnh. Nếu không có tiêu đề, tự tạo tiêu đề hợp lý.
      2. Đối với các ô bị mờ, chữ viết tay hoặc KHÔNG chắc chắn 100%, hãy thêm hậu tố " [?]" vào sau giá trị (ví dụ: "Nguyễn Văn A [?]").
      3. Nếu có nhiều ảnh, hãy kết hợp tất cả các hàng vào một danh sách liên tục duy nhất.
      4. CHỈ trả về mảng JSON thô. KHÔNG bao gồm các khối mã markdown ( \`\`\`json ) hoặc bất kỳ giải thích nào khác.
      5. Kết quả PHẢI là một mảng các đối tượng JSON hợp lệ.
    `;

    let lastError: string = "";
    let attemptedModels: string[] = [];

    // TRY EACH 2.5 MODEL IN SEQUENCE
    for (const modelName of FALLBACK_2_5_MODELS) {
      try {
        attemptedModels.push(modelName);
        if (onModelSwitch) onModelSwitch(modelName);
        
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }, ...imageParts] }],
            generationConfig: {
              temperature: 0.1,
              topP: 0.95,
              topK: 64,
              maxOutputTokens: 8192,
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorCode = response.status;
          const errorMessage = errorData.error?.message || "Lỗi không xác định.";

          // If 404 (Not Found), 429 (Quota), or 400 (Bad model), try next 2.5 model
          if (errorCode === 404 || errorCode === 429 || errorCode === 400 || errorCode === 503) {
            lastError = errorMessage;
            continue;
          } else {
            throw new Error(errorMessage);
          }
        }

        const result = await response.json();
        const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) throw new Error("AI không trả về kết quả.");

        // Robust JSON parsing logic
        let cleanedText = textResponse.trim();
        const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
        if (jsonMatch) cleanedText = jsonMatch[0];

        try {
          const parsedData = JSON.parse(cleanedText);
          const data = Array.isArray(parsedData) ? parsedData : [];
          return { data, modelUsed: modelName };
        } catch (e) {
          lastError = `Model ${modelName} trả về JSON không hợp lệ.`;
          continue;
        }
      } catch (err: any) {
        lastError = err.message || "Lỗi kết nối API.";
        continue;
      }
    }

    // Exhausted all 2.5 models - Auto-Discovery fallback
    const availableModels = await this.listAvailableModels(apiKey);
    const discovered25 = availableModels.filter(m => m.includes('2.5'));

    if (discovered25.length > 0) {
       // One more try with discovered models not in our list
       const newTry = discovered25.find(m => !FALLBACK_2_5_MODELS.includes(m));
       if (newTry) {
          // If we found a model dynamically, we would call it here, 
          // but for now, we'll just throw the diagnostic error to avoid recursion without feedback.
       }
    }

    const helpMsg = `Không tìm thấy mô hình 2.5 nào khả dụng cho tài khoản của bạn.\n\n` +
                   `Đã thử: ${attemptedModels.join(', ')}.\n\n` +
                   `Dòng máy có sẵn trong tài khoản bạn: ${availableModels.join(', ') || 'Không thể liệt kê'}.\n\n` +
                   `Giải pháp: Truy cập AI Studio và đảm bảo Gemini 2.5 đã được bật.`;
    
    throw new Error(helpMsg);
  },
};
