import { prisma } from "@/config/prisma";
import ApiError from "@/utils/ApiError";
import { StatusCodes } from "http-status-codes";
import { getGeminiModel, DEFAULT_GEMINI_MODEL, GEMINI_MODEL_CHAIN } from "@/config/gemini";
import { buildToeicExplanationPrompt, buildFollowUpPrompt, buildTakeawayPrompt } from "@/utils/aiPromptBuilder";
import { ExplainQuestionPayload, AskFollowUpPayload } from "@/types/ai.types";

const explainQuestion = async (payload: ExplainQuestionPayload) => {
  const { questionId, questionText, options, correctLabel, part, passageContent, forceRefresh } = payload;

  if (!questionId) {
    throw new ApiError("Thiếu questionId", StatusCodes.BAD_REQUEST);
  }

  if (!options || !options.length) {
    throw new ApiError("Câu hỏi không có lựa chọn nào hợp lệ", StatusCodes.BAD_REQUEST);
  }

  // 1. Check cache if not forcing refresh
  if (!forceRefresh) {
    const cached = await prisma.aiQuestionExplanation.findUnique({
      where: { questionId }
    });

    if (cached) {
      return {
        content: cached.content,
        model: cached.model,
        cached: true
      };
    }
  }

  // 2. Build Prompt
  const prompt = buildToeicExplanationPrompt({
    part,
    passageContent,
    questionText,
    options,
    correctLabel
  });

  // 3. Setup Timeout
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, 15000);

  try {
    let usedModel = DEFAULT_GEMINI_MODEL;
    let result;

    for (let i = 0; i < GEMINI_MODEL_CHAIN.length; i++) {
      usedModel = GEMINI_MODEL_CHAIN[i];
      let model = getGeminiModel({ model: usedModel });
      
      try {
        result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }, {
          signal: abortController.signal
        });
        break; // Tự động thoát khỏi loop nếu gọi API thành công
      } catch (apiError: any) {
        const isRetryableError = 
          apiError?.status === 429 || apiError?.message?.includes("429") || // Lỗi quota
          apiError?.status === 503 || apiError?.message?.includes("503");   // Lỗi quá tải server

        // Nếu không phải lỗi có thể retry hoặc đã là model cuối cùng thì ném lỗi ra ngoài
        if (i === GEMINI_MODEL_CHAIN.length - 1 || !isRetryableError) {
          throw apiError;
        }
        console.warn(`[AI Service] Model ${usedModel} failed (429/503). Falling back to ${GEMINI_MODEL_CHAIN[i + 1]}...`);
      }
    }
    
    clearTimeout(timeoutId);
    
    if (!result) {
      throw new ApiError("Không thể tạo phản hồi từ AI (Tất cả model đều thất bại)", StatusCodes.INTERNAL_SERVER_ERROR);
    }

    const responseText = result.response.text();

    if (!responseText) {
      throw new ApiError("Không nhận được phản hồi từ AI", StatusCodes.INTERNAL_SERVER_ERROR);
    }

    // 4. Upsert to DB (prevents race condition if 2 users call concurrently)
    const saved = await prisma.aiQuestionExplanation.upsert({
      where: { questionId },
      update: {
        content: responseText,
        model: usedModel
      },
      create: {
        questionId,
        content: responseText,
        model: usedModel
      }
    });

    return {
      content: saved.content,
      model: saved.model,
      cached: false
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    console.error("AI Explanation Error:", error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError("Thời gian chờ phản hồi từ AI quá lâu (Timeout)", StatusCodes.GATEWAY_TIMEOUT);
      }
      throw new ApiError("Lỗi khi gọi AI Provider: " + error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
    
    throw new ApiError("Lỗi không xác định khi gọi AI", StatusCodes.INTERNAL_SERVER_ERROR);
  }
};


const askFollowUpQuestion = async (payload: AskFollowUpPayload) => {
  const { questionContext, originalExplanation, userQuestion } = payload;

  if (!userQuestion) {
    throw new ApiError("Thiếu câu hỏi của học viên", StatusCodes.BAD_REQUEST);
  }

  const prompt = buildFollowUpPrompt({
    questionContext,
    originalExplanation,
    userQuestion
  });

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 15000);

  try {
    let usedModel = DEFAULT_GEMINI_MODEL;
    let result;

    for (let i = 0; i < GEMINI_MODEL_CHAIN.length; i++) {
      usedModel = GEMINI_MODEL_CHAIN[i];
      const model = getGeminiModel({ model: usedModel });
      
      try {
        result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }, {
          signal: abortController.signal
        });
        break;
      } catch (apiError: any) {
        const isRetryableError = 
          apiError?.status === 429 || apiError?.message?.includes("429") ||
          apiError?.status === 503 || apiError?.message?.includes("503");

        if (i === GEMINI_MODEL_CHAIN.length - 1 || !isRetryableError) {
          throw apiError;
        }
        console.warn(`[AI Service FollowUp] Model ${usedModel} failed (429/503). Falling back to ${GEMINI_MODEL_CHAIN[i + 1]}...`);
      }
    }
    
    clearTimeout(timeoutId);
    
    if (!result) {
      throw new ApiError("Không thể tạo phản hồi từ AI (Tất cả model đều thất bại)", StatusCodes.INTERNAL_SERVER_ERROR);
    }

    const responseText = result.response.text();

    if (!responseText) {
      throw new ApiError("Không nhận được phản hồi từ AI", StatusCodes.INTERNAL_SERVER_ERROR);
    }

    return {
      content: responseText,
      model: usedModel
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    console.error("AI Follow-up Error:", error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError("Thời gian chờ phản hồi từ AI quá lâu (Timeout)", StatusCodes.GATEWAY_TIMEOUT);
      }
      throw new ApiError("Lỗi khi gọi AI Provider: " + error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
    
    throw new ApiError("Lỗi không xác định khi gọi AI", StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

const generateTakeaway = async (payload: { questionText?: string, explanation: string }) => {
  const { questionText, explanation } = payload;
  if (!explanation) {
    throw new ApiError("Thiếu lời giải thích để rút ra kiến thức", StatusCodes.BAD_REQUEST);
  }

  const prompt = buildTakeawayPrompt(questionText, explanation);

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 10000);

  try {
    let usedModel = DEFAULT_GEMINI_MODEL;
    let result;

    for (let i = 0; i < GEMINI_MODEL_CHAIN.length; i++) {
      usedModel = GEMINI_MODEL_CHAIN[i];
      const model = getGeminiModel({ model: usedModel });
      
      try {
        result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }, {
          signal: abortController.signal
        });
        break;
      } catch (apiError: any) {
        const isRetryableError = 
          apiError?.status === 429 || apiError?.message?.includes("429") ||
          apiError?.status === 503 || apiError?.message?.includes("503");

        if (i === GEMINI_MODEL_CHAIN.length - 1 || !isRetryableError) {
          throw apiError;
        }
      }
    }
    
    clearTimeout(timeoutId);
    
    if (!result) {
      throw new ApiError("Không thể tạo phản hồi từ AI", StatusCodes.INTERNAL_SERVER_ERROR);
    }

    const responseText = result.response.text();
    if (!responseText) {
      throw new ApiError("Không nhận được phản hồi từ AI", StatusCodes.INTERNAL_SERVER_ERROR);
    }

    return responseText;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    console.error("AI Takeaway Error:", error);
    throw new ApiError("Lỗi khi sinh kiến thức cần học", StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const aiExplanationService = {
  explainQuestion,
  askFollowUpQuestion,
  generateTakeaway
};
