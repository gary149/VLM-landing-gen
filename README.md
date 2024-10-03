# Landing Page Generator

This project is a landing page generator that uses AI to iteratively improve a design implementation based on a provided image.

## Prerequisites

- [Bun](https://bun.sh) v1.0.2 or later
- OpenAI API key
- Freeimage API key

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
     OPENAI_API_KEY=your_openai_api_key_here
     FREEIMAGE_API_KEY=your_freeimage_api_key_here
     ```

## Usage

To generate a landing page, run:

```bash
bun run start --image <image_url> [--iterations <number>]
```

or use the short form:

```bash
bun run start -i <image_url> [-n <number>]
```

- `<image_url>`: The URL of the original design image
- `<number>`: (Optional) The number of iterations for improvement (default is 3)

Example:

```bash
bun run start --image https://iili.io/dbaGlXj.png --iterations 5
```

## Project Structure

- `index.ts`: Entry point of the application
- `scripts/landingPageGenerator.ts`: Main logic for generating the landing page
- `scripts/screenshot.ts`: Handles taking screenshots of generated HTML
- `scripts/upload.ts`: Manages image uploads to Freeimage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
