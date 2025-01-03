import createFreeimageUploader from "./upload.ts";
import { takeScreenshot } from "./screenshot";
import OpenAI from "openai";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
});

interface GeneratorOptions {
  originalImageUrl: string;
  iterations: number;
  model: string;
}

interface Message {
  role: "system" | "user" | "assistant";
  content:
    | string
    | { type: string; text?: string; image_url?: { url: string } }[];
}

const systemMessage: Message = {
  role: "system",
  content:
    "You are an experienced front-end developer. Your PRIMARY goal is to create a pixel-perfect implementation that matches the original design image EXACTLY. Every visual detail matters - spacing, colors, typography, alignment, image placement, and proportions must be precisely replicated. The designer is not a native English speaker, so improve the text quality while maintaining the same meaning. You should output HTML in a single block of code that contains the <body> code of the site (never use <head>, <link>, or <style> elements). Use CSS best practices, such as grids, and ensure text contrasts well with backgrounds. Always maintain 4 sections and enhance copywriting while preserving the original message. Tailwind is already included. Implement responsive design for all screen sizes while staying true to the original layout. You can use images but always from this website: https://enzostvs-cached-generation.hf.space/generate/{image prompt}?format={square or portrait-9_16 or landscape-16_9} - also add the prompt used in the <img> alt attribute. You should never use svg. Always wrap your HTML code in ```html code blocks. Remember: visual accuracy to the original design is your top priority.",
};

const createUserMessage = (originalImageUrl: string): Message => ({
  role: "user",
  content: [
    {
      type: "image_url",
      image_url: {
        url: originalImageUrl,
      },
    },
    {
      type: "text",
      text: "Implement this design",
    },
  ],
});

const createComparisonMessage = (originalImageUrl: string, screenshotUrl: string): Message => ({
  role: "user",
  content: [
    {
      type: "text",
      text: `Compare these two images side by side. Left is the ORIGINAL design, right is your CURRENT implementation. Your goal is to make the implementation EXACTLY match the original design. Before providing any HTML, please analyze and explicitly list:
1. What aspects visually differ from the original design (spacing, colors, typography, alignment, proportions, etc.)
2. Which sections need the most work to match the original design precisely
3. Which images should be kept and which need to be regenerated to better match the original

After providing this detailed comparison analysis, proceed with the improved HTML implementation that makes the page visually identical to the original design.`,
    },
    {
      type: "image_url",
      image_url: {
        url: originalImageUrl,
      },
    },
    {
      type: "image_url",
      image_url: {
        url: screenshotUrl,
      },
    },
  ],
});

const extractHtmlFromResponse = (
  content:
    | string
    | { type: string; text?: string; image_url?: { url: string } }[]
): string => {
  if (typeof content !== "string") return "";
  const htmlMatch = content.match(/```html\n([\s\S]*?)\n```/);
  return htmlMatch ? htmlMatch[1].trim() : "";
};


const sendMessageToOpenRouter = async (
  messages: Message[],
  model: string
): Promise<Message> => {
  console.log(`Sending message to OpenRouter using model: ${model}...`);
  try {
    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
    });

    console.log("OpenRouter raw response:", JSON.stringify(completion, null, 2));
    console.log("Received response from OpenRouter");
    return completion.choices[0].message;
  } catch (error) {
    console.error("Error sending message to OpenRouter:", error);
    throw error;
  }
};

const generateScreenshot = async (
  html: string,
  path: string
): Promise<void> => {
  console.log("Generating screenshot...");
  await takeScreenshot(html, path);
  console.log(`Screenshot generated and saved to ${path}`);
};

const uploadScreenshot = async (
  uploader: ReturnType<typeof createFreeimageUploader>,
  path: string
): Promise<string> => {
  const screenshotUpload = await uploader.uploadLocalImage(path);
  return screenshotUpload;
};

const performIteration = async (
  uploader: ReturnType<typeof createFreeimageUploader>,
  conversationLog: Message[],
  iteration: number,
  totalIterations: number,
  originalImageUrl: string,
  model: string
): Promise<string> => {
  console.log(`Iteration ${iteration + 1}/${totalIterations}`);

  let currentConversation: Message[] = [conversationLog[0], conversationLog[1]]; // Include system message and initial user message

  if (iteration > 0) {
    const screenshotUrl = await uploadScreenshot(uploader, "./screenshot.png");
    const comparisonMessage = createComparisonMessage(originalImageUrl, screenshotUrl);
    currentConversation.push(comparisonMessage);
    conversationLog.push(comparisonMessage);
  }

  const assistantMessage = await sendMessageToOpenRouter(
    currentConversation,
    model
  );
  conversationLog.push(assistantMessage);

  const currentHtml = extractHtmlFromResponse(assistantMessage.content);

  await generateScreenshot(currentHtml, "./screenshot.png");
  return currentHtml;
};

const generateLandingPage = async ({
  originalImageUrl,
  iterations,
  model,
}: GeneratorOptions): Promise<string> => {
  const uploader = createFreeimageUploader(process.env.FREEIMAGE_API_KEY || "");
  const conversationLog: Message[] = [
    systemMessage,
    createUserMessage(originalImageUrl),
  ];

  const iterationResults = await Array.from({ length: iterations }).reduce(
    async (prevPromise, _, index) => {
      const prevHtml = await prevPromise;
      return performIteration(
        uploader,
        conversationLog,
        index,
        iterations,
        originalImageUrl,
        model
      );
    },
    Promise.resolve("")
  );

  return iterationResults;
};

export { generateLandingPage };
