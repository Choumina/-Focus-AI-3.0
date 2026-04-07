
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export const generateTaskBreakdown = async (mainTask: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `請將以下學術任務拆解為 5 個可執行的子任務。請使用繁體中文，且「嚴禁使用任何 Markdown 格式」（如 **、###、* 等）。請直接輸出純文字列表： "${mainTask}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["title"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating breakdown:", error);
    return null;
  }
};

export const chatWithAssistant = async (message: string, history: { role: 'user' | 'bot', text: string }[]) => {
  try {
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const contents = history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: `你是 FOCUS AI，一個友善的學術陪伴助手。
現在時間是：${dateStr} ${timeStr}。
請務必使用『繁體中文』回覆。
關鍵指令：『嚴禁使用任何 Markdown 語法』，包括但不限於加粗符號（**）、標題符號（###）、斜體符號（*）或列表符號（- 或 *）。
請僅使用一般的文字、數字與自然換行來組織回覆。

你的任務：
1. 協助使用者分析日常行程或拆解學習任務。
2. 協助使用者進行「任務重要性排序」。根據使用者提供的任務及其重要性（1-5）與緊急度（1-5）評分，在回覆的 matrixData 欄位中提供結構化資料。
3. 根據使用者的習慣、目前的日期時間，提供具體的建議。
4. 如果你在對話中為使用者安排了行程，請同時在回覆的 events 欄位中提供這些行程的結構化資料。
5. events 中的 date 必須符合格式 YYYY-MM-DD（例如：${dateStr}）。
6. startTime 與 endTime 必須符合格式 HH:mm。`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "AI 的文字回覆內容" },
            events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "行程標題" },
                  startTime: { type: Type.STRING, description: "開始時間，格式為 HH:mm" },
                  endTime: { type: Type.STRING, description: "結束時間，格式為 HH:mm" },
                  date: { type: Type.STRING, description: "日期，格式為 YYYY-MM-DD" }
                },
                required: ["title", "startTime", "endTime", "date"]
              }
            },
            matrixData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "任務名稱" },
                  importance: { type: Type.NUMBER, description: "重要性評分 (1-5)" },
                  urgency: { type: Type.NUMBER, description: "緊急度評分 (1-5)" }
                },
                required: ["title", "importance", "urgency"]
              }
            }
          },
          required: ["text"]
        }
      }
    });

    const result = JSON.parse(response.text);
    if (result.text) result.text = result.text.replace(/\*\*|###|#/g, '');
    return result;
  } catch (error) {
    console.error("Error chatting with assistant:", error);
    return { text: "抱歉，我現在連線有點問題。請稍後再試！" };
  }
};
