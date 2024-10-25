# Landing Page Generator

This project is an AI-powered landing page generator that uses OpenRouter to iteratively refine HTML implementations based on a provided design image. It works by analyzing the original design image, generating initial HTML with Tailwind CSS, taking screenshots of the implementation, and comparing these screenshots with the original design. Through multiple iterations, it progressively improves the layout, styling, and content to match the original design precisely, while ensuring high-quality, grammatically correct text content.

## Prerequisites

- [Bun](https://bun.sh) v1.0.2 or later
- [OpenRouter](https://openrouter.ai/) API key (for AI model access)
- [Freeimage](https://freeimage.host/) API key (for image hosting)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/webdesigner.git
   cd webdesigner
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Set up environment variables:
   - Copy the `.env.example` file to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit the `.env` file and add your API keys:
     ```
     OPENROUTER_API_KEY=your_openrouter_api_key_here
     FREEIMAGE_API_KEY=your_freeimage_api_key_here
     YOUR_SITE_URL=http://localhost:3000
     YOUR_SITE_NAME=Landing Page Generator
     ```

## Usage

To generate a landing page, run:

```bash
bun run start --image <image_url> [--iterations <number>] [--model <model_name>]
```

or use the short form:

```bash
bun run start -i <image_url> [-n <number>] [-m <model_name>]
```

Arguments:
- `<image_url>`: URL of the original design image to replicate
- `<number>`: (Optional) Number of improvement iterations (default: 3)
- `<model_name>`: (Optional) AI model to use (default: "anthropic/claude-3.5-sonnet")

Example:

```bash
bun run start --image https://example.com/design.png --iterations 5
```

## Project Structure

- `index.ts`: Entry point handling command-line arguments and program flow
- `scripts/landingPageGenerator.ts`: Core logic for HTML generation and iterative refinement
- `scripts/screenshot.ts`: Puppeteer-based screenshot capture of generated pages
- `scripts/upload.ts`: Image upload handling via Freeimage API

## How It Works

1. The system takes an input design image
2. Generates initial HTML/Tailwind CSS implementation
3. Takes a screenshot of the generated page
4. Compares current implementation with original design
5. Makes iterative improvements based on the comparison
6. Repeats steps 3-5 for the specified number of iterations

## Model & AI Integration

The generator uses OpenRouter API to access AI models for:
- Design analysis and HTML generation
- Implementation comparison and refinement
- Content writing and improvement

Default model is `anthropic/claude-3.5-sonnet`, but other OpenRouter-supported models can be specified via the `--model` flag.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
