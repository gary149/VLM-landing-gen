import { generateLandingPage } from "./scripts/landingPageGenerator";

function parseArgs(args: string[]): { [key: string]: string } {
  const result: { [key: string]: string } = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const value = args[i + 1];
      if (value && !value.startsWith("--")) {
        result[key] = value;
        i++;
      } else {
        result[key] = "true";
      }
    }
  }
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const originalImageUrl = args["image"] || args["i"];
  const iterations = parseInt(args["iterations"] || args["n"] || "3", 10);

  if (!originalImageUrl) {
    console.error(
      "Error: Please provide an image URL using --image or -i flag."
    );
    console.error(
      "Usage: bun run start --image <image_url> [--iterations <number>]"
    );
    console.error("   or: bun run start -i <image_url> [-n <number>]");
    process.exit(1);
  }

  if (isNaN(iterations) || iterations < 1) {
    console.error(
      "Error: The number of iterations must be a positive integer."
    );
    console.error(
      "Usage: bun run start --image <image_url> [--iterations <number>]"
    );
    console.error("   or: bun run start -i <image_url> [-n <number>]");
    process.exit(1);
  }

  console.log(
    `Starting landing page generation with ${iterations} iteration(s)...`
  );
  try {
    const finalHtml = await generateLandingPage({
      originalImageUrl,
      iterations,
    });
    console.log("Generation complete. Final HTML:");
    console.log(finalHtml);
  } catch (error) {
    console.error("An error occurred during landing page generation:", error);
    process.exit(1);
  }
}

main();
