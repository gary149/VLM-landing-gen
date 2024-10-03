import OpenAI from "openai";
import createFreeimageUploader from "./upload.ts";
import { takeScreenshot } from "./screenshot";
import fs from "fs/promises";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GeneratorOptions {
  originalImageUrl: string;
  iterations: number;
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
    "You are an experienced front-end developer. Your goal is to implement a landing page using tailwindcss as close as possible to the one provided by the designer. The designer is not a native English speaker and has made some spelling mistakes that you need to fix to make the text correct and consistent with the page's content and value proposition. You should output HTML in a single block of code that contains the <body> code of the site (never use <head>, <link>, or <style> elements). Use a pleasing, Apple-inspired aesthetic. Use CSS best practices, such as grids, and always make sure that text contrasts well with its background. Always make sure the site has 4 sections and do some nice copywriting. Tailwind is already included. Make sure to implement something that is responsive for all screen sizes. You can use images but always from this website: https://enzostvs-cached-generation.hf.space/generate/{image prompt}?format={square or portrait-9_16 or landscape-16_9} - also add the prompt used in the <img> alt attribute. You should never use svg.",
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
  screenshotUrl: string
): Message => ({
  role: "user",
  content: [
    {
      type: "text",
      text: "Here are two images: the first is the original design and the second is a screenshot of your current implementation. List the differences, then improve your implementation to make it closer to the original design. Don't change the images that are the same as the original design, and improve the areas that are not the same as the original design.",
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
  return htmlMatch ? htmlMatch[1].trim() : content;
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
};

const sendMessageToOpenAI = async (messages: Message[]): Promise<Message> => {
  console.log("Sending message to OpenAI...");
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    max_tokens: 12000,
  });
  console.log("Received response from OpenAI");
  return completion.choices[0].message;
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
  originalImageUrl: string
): Promise<string> => {
  console.log(`Iteration ${iteration + 1}/${totalIterations}`);

  if (iteration > 0) {
    const screenshotUrl = await uploadScreenshot(uploader, "./screenshot.png");
    conversationLog.push(
      createComparisonMessage(originalImageUrl, screenshotUrl)
    );
  }

  const assistantMessage = await sendMessageToOpenAI(conversationLog);
  conversationLog.push(assistantMessage);

  const currentHtml = extractHtmlFromResponse(assistantMessage.content);

  await generateScreenshot(currentHtml, "./screenshot.png");
  await saveConversationLog(conversationLog, iteration + 1);

  return currentHtml;
};

const generateLandingPage = async ({
  originalImageUrl,
  iterations,
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
        originalImageUrl
      );
    },
    Promise.resolve("")
  );

  return iterationResults;
};

export { generateLandingPage };
