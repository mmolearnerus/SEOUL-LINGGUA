import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import AdmZip from "adm-zip";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase JSON payload limit to handle base64 image uploads
app.use(express.json({ limit: "20mb" }));

// Initialize Gemini safely
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is not defined or is placeholder. Using high-quality offline modes.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// Rich offline mock dataset for standard topics & quick demo
const DEMO_TOPICS: Record<string, any> = {
  "pho_identity": {
    titleEnglish: "Generational Craft Strengthens Pho's Identity",
    titleVietnamese: "Nghề phở qua nhiều thế hệ củng cố bản sắc",
    originalText: "From your perspective, what else can we do to further elevate the position of pho on the international stage?\n\nWhat can further elevate pho are the stories behind it: the stories of the people who make pho, of families who have preserved and refined it across generations, and of the memories tied to it.",
    vietnameseTranslation: "Theo quan điểm của bà, chúng ta có thể làm gì thêm để tiếp tục nâng cao vị thế của phở trên trường quốc tế?\n\nĐiều có thể tiếp tục nâng tầm phở chính là những câu chuyện phía sau món ăn: câu chuyện về những người nấu phở, những gia đình đã gìn giữ và hoàn thiện món ăn này qua nhiều thế hệ, cũng như những ký ức gắn liền với phở.",
    vocabulary: [
      {
        word: "elevate",
        partOfSpeech: "v",
        ipa: "/ˈɛl.ə.veɪt/",
        englishDefinition: "raise, lift up, promote to a higher position",
        vietnameseDefinition: "nâng tầm, nâng cao",
        exampleSentence: "We must find ways to further elevate the position of Vietnamese cuisine.",
        exampleTranslation: "Chúng ta phải tìm cách để nâng cao hơn nữa vị thế của ẩm thực Việt Nam."
      },
      {
        word: "position",
        partOfSpeech: "n",
        ipa: "/pəˈzɪʃ.ən/",
        englishDefinition: "status, standing, rank",
        vietnameseDefinition: "vị thế, vị trí",
        exampleSentence: "The company has secured a strong position in the international market.",
        exampleTranslation: "Công ty đã có được một vị thế vững chắc trên thị trường quốc tế."
      },
      {
        word: "international stage",
        partOfSpeech: "n",
        ipa: "/ˌɪn.təˈnæʃ.ən.əl steɪdʒ/",
        englishDefinition: "global arena, worldwide scene",
        vietnameseDefinition: "trường quốc tế",
        exampleSentence: "Vietnamese athletes are shining on the international stage.",
        exampleTranslation: "Các vận động viên Việt Nam đang tỏa sáng trên trường quốc tế."
      },
      {
        word: "preserved",
        partOfSpeech: "v",
        ipa: "/prɪˈzɜːvd/",
        englishDefinition: "maintained, kept safe from decay or ruin",
        vietnameseDefinition: "gìn giữ, bảo tồn",
        exampleSentence: "These ancient recipes have been carefully preserved for centuries.",
        exampleTranslation: "Những công thức nấu ăn cổ xưa này đã được gìn giữ cẩn thận suốt nhiều thế kỷ."
      },
      {
        word: "refined",
        partOfSpeech: "v",
        ipa: "/rɪˈfaɪnd/",
        englishDefinition: "improved, made more elegant or polished",
        vietnameseDefinition: "hoàn thiện, tinh chế",
        exampleSentence: "The chef refined the dish by adding subtle herbs and spices.",
        exampleTranslation: "Người đầu bếp đã hoàn thiện món ăn bằng cách thêm các loại thảo mộc và gia vị tinh tế."
      },
      {
        word: "generations",
        partOfSpeech: "n",
        ipa: "/ˌdʒɛn.əˈreɪ.ʃənz/",
        englishDefinition: "family lines, successive steps in natural descent",
        vietnameseDefinition: "các thế hệ",
        exampleSentence: "This traditional craft is passed down through generations.",
        exampleTranslation: "Nghề truyền thống này được truyền qua nhiều thế hệ."
      },
      {
        word: "memories",
        partOfSpeech: "n",
        ipa: "/ˈmɛm.ər.iz/",
        englishDefinition: "recollections, remembered experiences",
        vietnameseDefinition: "ký ức, kỷ niệm",
        exampleSentence: "The delicious scent of grilled meat brings back warm childhood memories.",
        exampleTranslation: "Mùi thịt nướng thơm lừng gợi lại những kỷ niệm tuổi thơ ấm áp."
      }
    ]
  },
  "seoul_culture": {
    titleEnglish: "The Dynamic Charm of Seoul",
    titleVietnamese: "Sức hút năng động của Seoul",
    originalText: "Seoul is a city where historic palaces and cutting-edge skyscrapers coexist in perfect harmony. From the peaceful gardens of Gyeongbokgung to the bustling streets of Gangnam, visitors can experience a rich cultural tapestry. Under the guidance of SEOUL FOREIGN LANGUAGE CENTER, learning languages helps bridge these beautiful cultures together.",
    vietnameseTranslation: "Seoul là thành phố nơi các cung điện lịch sử và những tòa nhà chọc trời tiên tiến cùng tồn tại hài hòa hoàn hảo. Từ những khu vườn yên bình ở cung điện Gyeongbokgung đến những con phố nhộn nhịp của Gangnam, du khách có thể trải nghiệm một bức tranh văn hóa phong phú. Dưới sự hướng dẫn của TRUNG TÂM NGOẠI NGỮ SEOUL, việc học ngôn ngữ giúp kết nối những nền văn hóa đẹp đẽ này lại với nhau.",
    vocabulary: [
      {
        word: "cutting-edge",
        partOfSpeech: "adj",
        ipa: "/ˌkʌt.ɪŋˈedʒ/",
        englishDefinition: "highly advanced, pioneering, state-of-the-art",
        vietnameseDefinition: "tiên tiến, hiện đại nhất",
        exampleSentence: "Seoul is famous for its cutting-edge technology and modern infrastructure.",
        exampleTranslation: "Seoul nổi tiếng với công nghệ tiên tiến nhất và cơ sở hạ tầng hiện đại."
      },
      {
        word: "coexist",
        partOfSpeech: "v",
        ipa: "/ˌkəʊ.ɪɡˈzɪst/",
        englishDefinition: "exist together at the same time or in the same place",
        vietnameseDefinition: "cùng tồn tại",
        exampleSentence: "Tradition and modernity coexist peacefully in this capital.",
        exampleTranslation: "Truyền thống và hiện đại cùng tồn tại một cách hòa bình ở thủ đô này."
      },
      {
        word: "harmony",
        partOfSpeech: "n",
        ipa: "/ˈhɑː.mə.ni/",
        englishDefinition: "agreement, peace, perfect combination",
        vietnameseDefinition: "sự hài hòa",
        exampleSentence: "The buildings were designed to live in perfect harmony with nature.",
        exampleTranslation: "Các tòa nhà được thiết kế để sống trong sự hài hòa hoàn hảo với thiên nhiên."
      },
      {
        word: "tapestry",
        partOfSpeech: "n",
        ipa: "/ˈtæp.ɪ.stri/",
        englishDefinition: "a rich, complex, and varied combination of things",
        vietnameseDefinition: "bức tranh đa dạng, thảm văn hóa",
        exampleSentence: "The city offers a colorful tapestry of food, art, and history.",
        exampleTranslation: "Thành phố mang lại một bức tranh đầy màu sắc về ẩm thực, nghệ thuật và lịch sử."
      },
      {
        word: "bridge",
        partOfSpeech: "v",
        ipa: "/brɪdʒ/",
        englishDefinition: "connect, fill a gap, bring together",
        vietnameseDefinition: "kết nối, bắc cầu",
        exampleSentence: "Learning a new language is the best way to bridge cultures.",
        exampleTranslation: "Học một ngôn ngữ mới là cách tốt nhất để kết nối các nền văn hóa."
      }
    ]
  }
};

// POST route to analyze an image (OCR + Translation + Vocab generation)
app.post("/api/analyze-image", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing image data" });
    }

    // Check if image looks like our Pho demo to provide lightning-fast, high-fidelity experience
    // or if the Gemini client is missing (use offline processing)
    const ai = getGeminiClient();
    if (!ai) {
      console.log("No Gemini API key. Returning Pho identity as an elegant offline demonstration.");
      return res.json({
        ...DEMO_TOPICS.pho_identity,
        isOfflineMode: true,
        message: "Chế độ ngoại tuyến: Vui lòng cấu hình GEMINI_API_KEY trong Secrets để phân tích ảnh bất kỳ."
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Analyze the provided image. It contains some English text. Perform the following steps:
1. Extract the entire English text clearly.
2. Provide a natural, beautifully phrased Vietnamese translation of this text.
3. Suggest a descriptive English title and its Vietnamese translation.
4. Extract 5-8 key useful vocabulary words. For each word, provide:
   - word (lowercase base form)
   - partOfSpeech: short form, e.g., "(n)", "(v)", "(adj)", "(adv)"
   - ipa: standard British or American IPA phonetic pronunciation, e.g., "/ˈɛl.ə.veɪt/"
   - englishDefinition: simple English synonym or short definition
   - vietnameseDefinition: natural Vietnamese translation of the word
   - exampleSentence: an English example sentence using the word
   - exampleTranslation: the Vietnamese translation of that example sentence.

Respond STRICTLY in JSON format following this schema:
{
  "titleEnglish": "Descriptive English Title",
  "titleVietnamese": "Tiêu đề tiếng Việt tương ứng",
  "originalText": "The exact full English text extracted from the image",
  "vietnameseTranslation": "Bản dịch tiếng Việt trôi chảy, tự nhiên của đoạn văn trên",
  "vocabulary": [
    {
      "word": "word",
      "partOfSpeech": "n/v/adj/adv",
      "ipa": "/.../",
      "englishDefinition": "English explanation",
      "vietnameseDefinition": "nghĩa tiếng Việt",
      "exampleSentence": "illustrative English sentence",
      "exampleTranslation": "dịch nghĩa câu ví dụ"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "image/png",
            data: cleanBase64
          }
        },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titleEnglish: { type: Type.STRING },
            titleVietnamese: { type: Type.STRING },
            originalText: { type: Type.STRING },
            vietnameseTranslation: { type: Type.STRING },
            vocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  partOfSpeech: { type: Type.STRING },
                  ipa: { type: Type.STRING },
                  englishDefinition: { type: Type.STRING },
                  vietnameseDefinition: { type: Type.STRING },
                  exampleSentence: { type: Type.STRING },
                  exampleTranslation: { type: Type.STRING }
                },
                required: ["word", "partOfSpeech", "ipa", "englishDefinition", "vietnameseDefinition", "exampleSentence", "exampleTranslation"]
              }
            }
          },
          required: ["titleEnglish", "titleVietnamese", "originalText", "vietnameseTranslation", "vocabulary"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text received from Gemini API");
    }

    const parsed = JSON.parse(resultText);
    return res.json({ ...parsed, isOfflineMode: false });
  } catch (error: any) {
    console.error("Error analyzing image via Gemini:", error);
    // Graceful fallback to default demo data to ensure zero crashes
    return res.json({
      ...DEMO_TOPICS.pho_identity,
      isOfflineMode: true,
      error: error.message,
      message: "Đã xảy ra lỗi khi kết nối với API Gemini. Ứng dụng tự động hiển thị bài mẫu để bạn tiếp tục trải nghiệm."
    });
  }
});

// POST route to analyze inputted raw text
app.post("/api/analyze-text", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Missing text content" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      console.log("No Gemini API key. Returning mock analysis for raw text.");
      // Generate a quick mock based on the user's text for a fully offline but interactive experience
      const wordCount = text.split(/\s+/).length;
      return res.json({
        titleEnglish: "Your Provided English Passage",
        titleVietnamese: "Đoạn văn tiếng Anh của bạn",
        originalText: text,
        vietnameseTranslation: `[Bản dịch mẫu] Đoạn văn của bạn chứa khoảng ${wordCount} từ. Để nhận được bản dịch và phân tích từ vựng chính xác từ AI, vui lòng thêm khóa GEMINI_API_KEY hợp lệ trong phần cài đặt Secrets.`,
        vocabulary: [
          {
            word: "learning",
            partOfSpeech: "n",
            ipa: "/ˈlɜː.nɪŋ/",
            englishDefinition: "the acquisition of knowledge or skills through experience or study",
            vietnameseDefinition: "việc học, học tập",
            exampleSentence: "Learning English is a journey of a thousand miles.",
            exampleTranslation: "Học tiếng Anh là một hành trình vạn dặm."
          },
          {
            word: "experience",
            partOfSpeech: "n/v",
            ipa: "/ɪkˈspɪə.ri.əns/",
            englishDefinition: "knowledge or skill that is acquired by time",
            vietnameseDefinition: "trải nghiệm, kinh nghiệm",
            exampleSentence: "Seoul Foreign Language Center provides an amazing learning experience.",
            exampleTranslation: "Trung tâm Ngoại ngữ Seoul mang lại trải nghiệm học tập tuyệt vời."
          }
        ],
        isOfflineMode: true,
        message: "Chế độ ngoại tuyến: Vui lòng cấu hình GEMINI_API_KEY trong Secrets để phân tích văn bản thực tế bằng AI."
      });
    }

    const prompt = `Analyze the provided English text. Perform the following steps:
1. Provide a natural, context-aware, and beautifully phrased Vietnamese translation of this text.
2. Suggest an elegant English title and its Vietnamese translation.
3. Extract 5-8 of the most useful vocabulary words from the text. For each word, provide:
   - word (lowercase base form)
   - partOfSpeech: short form, e.g., "(n)", "(v)", "(adj)", "(adv)"
   - ipa: standard British or American IPA phonetic pronunciation, e.g., "/ˈæb.sə.luːt/"
   - englishDefinition: simple English synonym or short definition
   - vietnameseDefinition: natural Vietnamese translation of the word
   - exampleSentence: an English example sentence using the word
   - exampleTranslation: the Vietnamese translation of that example sentence.

Respond STRICTLY in JSON format following this schema:
{
  "titleEnglish": "Descriptive English Title",
  "titleVietnamese": "Tiêu đề tiếng Việt tương ứng",
  "originalText": "The exact full English text provided",
  "vietnameseTranslation": "Bản dịch tiếng Việt trôi chảy, tự nhiên của đoạn văn",
  "vocabulary": [
    {
      "word": "word",
      "partOfSpeech": "n/v/adj/adv",
      "ipa": "/.../",
      "englishDefinition": "English explanation",
      "vietnameseDefinition": "nghĩa tiếng Việt",
      "exampleSentence": "illustrative English sentence",
      "exampleTranslation": "dịch nghĩa câu ví dụ"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: `${prompt}\n\nEnglish Text to Analyze:\n${text}` }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titleEnglish: { type: Type.STRING },
            titleVietnamese: { type: Type.STRING },
            originalText: { type: Type.STRING },
            vietnameseTranslation: { type: Type.STRING },
            vocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  partOfSpeech: { type: Type.STRING },
                  ipa: { type: Type.STRING },
                  englishDefinition: { type: Type.STRING },
                  vietnameseDefinition: { type: Type.STRING },
                  exampleSentence: { type: Type.STRING },
                  exampleTranslation: { type: Type.STRING }
                },
                required: ["word", "partOfSpeech", "ipa", "englishDefinition", "vietnameseDefinition", "exampleSentence", "exampleTranslation"]
              }
            }
          },
          required: ["titleEnglish", "titleVietnamese", "originalText", "vietnameseTranslation", "vocabulary"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text received from Gemini API");
    }

    const parsed = JSON.parse(resultText);
    return res.json({ ...parsed, isOfflineMode: false });
  } catch (error: any) {
    console.error("Error analyzing text via Gemini:", error);
    return res.status(500).json({
      error: error.message,
      message: "Đã xảy ra lỗi khi phân tích văn bản bằng Gemini."
    });
  }
});

// GET route to retrieve default topics for initial state or testing
app.get("/api/demo-topics", (req, res) => {
  res.json(DEMO_TOPICS);
});

// GET route to package and download the entire application as a ZIP file
app.get("/api/download-zip", (req, res) => {
  try {
    const zip = new AdmZip();
    
    // Core project files
    const rootFiles = [
      "package.json",
      "tsconfig.json",
      "vite.config.ts",
      "index.html",
      "metadata.json",
      ".env.example",
      ".gitignore",
      "server.ts"
    ];

    for (const file of rootFiles) {
      try {
        const filePath = path.join(process.cwd(), file);
        zip.addLocalFile(filePath, ""); // Adds to the root of the ZIP
      } catch (fileErr) {
        console.warn(`Could not add ${file} to ZIP archive:`, fileErr);
      }
    }

    // Add source folder recursively
    try {
      const srcPath = path.join(process.cwd(), "src");
      zip.addLocalFolder(srcPath, "src");
    } catch (dirErr) {
      console.warn("Could not add /src folder to ZIP archive:", dirErr);
    }

    const zipBuffer = zip.toBuffer();

    res.setHeader("Content-Disposition", "attachment; filename=seoul_lingua_app.zip");
    res.setHeader("Content-Type", "application/zip");
    res.send(zipBuffer);
  } catch (error: any) {
    console.error("Error creating ZIP archive:", error);
    res.status(500).json({ error: error.message || "Failed to package application" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
