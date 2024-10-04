# Landing Page Generator

This project is an AI-powered landing page generator that uses OpenRouter to iteratively refine HTML implementations based on a provided design image. It works by analyzing the original image, generating initial HTML with Tailwind CSS, taking screenshots of the implementation, and then comparing these screenshots to the original design. Through multiple iterations, it progressively improves the layout, styling, and content to closely match the original design, while also ensuring high-quality, grammatically correct text content.

## Prerequisites

- [Bun](https://bun.sh) v1.0.2 or later
- [OpenRouter](https://openrouter.ai/) API key
- [Freeimage](https://freeimage.host/) API key

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

- `<image_url>`: The URL of the original design image
- `<number>`: (Optional) The number of iterations for improvement (default is 3)
- `<model_name>`: (Optional) The AI model to use (default is "anthropic/claude-3.5-sonnet")

Example:

```bash
bun run start --image https://iili.io/dbaGlXj.png --iterations 5 --model openai/gpt-4-turbo-preview
```

## Project Structure

- `index.ts`: Entry point of the application
- `scripts/landingPageGenerator.ts`: Main logic for generating the landing page
- `scripts/screenshot.ts`: Handles taking screenshots of generated HTML
- `scripts/upload.ts`: Manages image uploads to Freeimage

## Model

By default, the generator uses the `anthropic/claude-3-sonnet-20240229` model. You can specify a different model using the `--model` or `-m` flag when running the generator.

For a full list of available models and their capabilities, please refer to the [OpenRouter documentation](https://openrouter.ai/docs).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
