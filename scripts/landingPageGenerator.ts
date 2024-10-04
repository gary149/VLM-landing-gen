import createFreeimageUploader from "./upload.ts";
import { takeScreenshot } from "./screenshot";
import fs from "fs/promises";
import OpenAI from "openai";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const YOUR_SITE_URL = process.env.YOUR_SITE_URL || "http://localhost:3000";
const YOUR_SITE_NAME = process.env.YOUR_SITE_NAME || "Landing Page Generator";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": YOUR_SITE_URL,
    "X-Title": YOUR_SITE_NAME,
  },
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
    "You are an experienced front-end developer. Your goal is to implement a landing page using tailwindcss as close as possible to the one provided by the designer. The designer is not a native English speaker make sure that all the text is well written. You should output HTML in a single block of code that contains the <body> code of the site (never use <head>, <link>, or <style> elements). Use a pleasing, Apple-inspired aesthetic. Use CSS best practices, such as grids, and always make sure that text contrasts well with its background. Always make sure the site has 4 sections and do some nice copywriting. Tailwind is already included. Make sure to implement something that is responsive for all screen sizes. You can use images but always from this website: https://enzostvs-cached-generation.hf.space/generate/{image prompt}?format={square or portrait-9_16 or landscape-16_9} - also add the prompt used in the <img> alt attribute. You should never use svg. Always wrap your HTML code in ```html code blocks.",
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

const createComparisonMessage = (
  originalImageUrl: string,
  screenshotUrl: string,
  isLastIteration: boolean
): Message => ({
  role: "user",
  content: [
    {
      type: "text",
      text: `Here are two images: the first is the original design and the second is a screenshot of your current implementation. Start by telling what is different between the two images then improve your implementation to make it look more like the original design. Skip the website section that are good enough and focus on the one that can be improved. Don't change the images that look enough like the original design - keep the exact same url for them. Try to improve the spacing, colors, typography, and overall look of your implementation. Make sure to respect font size and alignment and border radius. Be really carful that everything is sized as in the original design. Remember that your objective is to be as close as possible to the original design so don't take any design decision. `,
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

const saveConversationLog = async (
  conversationLog: Message[],
  iteration: number
): Promise<void> => {
  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const logFileName = `conversation_log_${iteration}_${timestamp}.json`;
  await fs.writeFile(logFileName, JSON.stringify(conversationLog, null, 2));
  console.log(
    `Conversation log saved for iteration ${iteration} at ${timestamp}`
  );
  console.log("Conversation log contents:");
  console.log(JSON.stringify(conversationLog, null, 2));
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
    const comparisonMessage = createComparisonMessage(
      originalImageUrl,
      screenshotUrl,
      iteration === totalIterations - 1
    );
    currentConversation.push(comparisonMessage);
  }

  const assistantMessage = await sendMessageToOpenRouter(
    currentConversation,
    model
  );
  conversationLog.push(assistantMessage);

  const currentHtml = extractHtmlFromResponse(assistantMessage.content);

  await generateScreenshot(currentHtml, "./screenshot.png");
  await saveConversationLog(conversationLog, iteration + 1);

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
