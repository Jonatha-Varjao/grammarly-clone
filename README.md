# Grammarly Clone - AI Writing Assistant Extension

A privacy-first browser extension that analyzes text using local or cloud LLMs, providing grammar corrections, style improvements, and tone transformations.

## Features

- **Text Analysis**: Grammar, syntax, and semantic checking
- **Tone Transformation**: Rewrite text with different emotions (Professional, Casual, Friendly, Formal, Academic, Creative)
- **Local LLM Support**: Works with Ollama, LM Studio, llama.cpp
- **Cloud Fallback**: OpenAI-compatible API support
- **Privacy-First**: All processing can happen locally on your machine

## Prerequisites

- **Node.js** (v18+) - Managed via NVM
- **Bun** - JavaScript runtime and package manager
- **Ollama** (optional) - For local LLM inference

### Installing and Using NVM

```bash
# Install NVM (if not installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js LTS
nvm install 20
nvm use 20

# Verify installation
node --version  # Should output: v20.x.x
```

### Installing Bun

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
```

## Installation

```bash
# Clone the repository
git clone https://github.com/Jonatha-Varjao/grammarly-clone.git
cd grammarly-clone

# Install dependencies
bun install
```

## Development

```bash
# Build for production
bun run build

# Build output will be in dist/ folder
```

## Loading the Extension

### Chrome/Edge/Brave

1. Build the extension: `bun run build`
2. Open `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `dist` folder

### Firefox

1. Build the extension
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select the `manifest.json` file in the `dist` folder

## Project Structure

```
.
├── src/
│   ├── background.ts       # Service worker (MV3)
│   ├── content.ts          # Content script (injected into pages)
│   ├── popup/              # Extension popup UI
│   │   ├── main.tsx
│   │   ├── PopupApp.tsx
│   │   └── popup.css
│   ├── sidepanel/          # Side panel UI
│   │   ├── main.tsx
│   │   ├── SidepanelApp.tsx
│   │   └── sidepanel.css
│   ├── components/          # Shared React components
│   │   ├── EmotionSelector/
│   │   ├── TextInput/
│   │   ├── ResultPanel/
│   │   └── HistoryPanel/
│   ├── hooks/              # Custom React hooks
│   ├── stores/              # Zustand state stores
│   ├── services/            # LLM API services
│   ├── types/               # TypeScript type definitions
│   └── utils/
├── public/                  # Static assets
│   └── manifest.json
├── dist/                    # Build output
├── docs/                    # Documentation
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Loading the Extension

### Chrome/Edge/Brave

1. Run `bun run dev` to start the development server
2. Open `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `dist` or `output` folder

### Firefox

1. Run `bun run dev` 
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select the `manifest.json` file

## LLM Configuration

### Local (Ollama)

1. Install [Ollama](https://ollama.ai)
2. Pull a model: `ollama pull llama3.2`
3. Start Ollama: `ollama serve`
4. Configure the extension to use `http://localhost:11434`

### Cloud (OpenAI-compatible)

1. Get an API key from OpenAI, Anthropic, or any OpenAI-compatible provider
2. Configure the endpoint URL and API key in extension settings

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite + CRXJS plugin
- **UI Framework**: React 18
- **State Management**: Zustand 5
- **Extension Manifest**: MV3

## License

MIT
