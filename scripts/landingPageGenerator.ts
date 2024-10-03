import createFreeimageUploader from "./upload.ts";
import { takeScreenshot } from "./screenshot";
import fs from "fs/promises";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const YOUR_SITE_URL = process.env.YOUR_SITE_URL || "http://localhost:3000";
const YOUR_SITE_NAME = process.env.YOUR_SITE_NAME || "Landing Page Generator";

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
      text: "Here are two images: the first is the original design and the second is a screenshot of your current implementation. Please follow these steps:\n\n1. Carefully analyze both images and list all the differences you can see between the original design and your current implementation. Be extremely specific and detailed, considering the following aspects:\n   - Layout and positioning of elements\n   - Colors and color schemes\n   - Typography (font sizes, styles, weights, and families)\n   - Spacing and margins\n   - Images and icons\n   - Responsive design elements\n   - Any missing or extra components\n\n2. For each identified difference, explain in detail how you will improve your implementation to make it closer to the original design. Provide specific CSS classes or HTML structure changes you plan to make.\n\n3. Implement these improvements in your next iteration of the HTML code. Ensure that you're using Tailwind CSS classes effectively to achieve the desired look.\n\n4. Do not change any elements that are already matching the original design perfectly.\n\n5. Focus on improving the areas that differ from the original design, prioritizing the most noticeable differences first.\n\n6. If there are any elements in the original design that you're unsure how to implement, explain your approach and any alternatives you're considering.\n\nAfter listing the differences, your detailed plan for improvements, and any implementation challenges, provide the updated HTML code with your changes clearly commented.",
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

const sendMessageToOpenRouter = async (messages: Message[]): Promise<Message> => {
  console.log("Sending message to OpenRouter...");
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": YOUR_SITE_URL,
      "X-Title": YOUR_SITE_NAME,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": "google/gemini-pro-1.5-exp",
      "messages": messages
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log("Received response from OpenRouter");
  return data.choices[0].message;
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

  const assistantMessage = await sendMessageToOpenRouter(conversationLog);
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
