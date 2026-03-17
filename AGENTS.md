# AGENTS.md - Development Guidelines for AI Agents

This file provides instructions and guidelines for AI agents working on this codebase.

## Project Overview

- **Project Name**: OpenQuill - AI Writing Assistant
- **Type**: Browser Extension (Chrome/Firefox/Edge)
- **Stack**: TypeScript + Bun (bundler + runtime) + React + Zustand + Manifest V3
- **Core Functionality**: Text analysis and tone transformation using local/cloud LLMs

---

## Commands

This project supports Bun, npm, and yarn. Use whichever you prefer.

### Development

| Bun             | Description                             |
| --------------- | --------------------------------------- |
| `bun install`   | Install dependencies                    |
| `bun run dev`   | Dev server with hot reload (watch mode) |
| `bun run build` | Production build                        |
| `bun run clean` | Clean dist folder                       |

### Code Quality

| Bun | Description |
|-----|-------------|
| `bun run typecheck` | Run TypeScript type checker |
| `bun run lint` | Run ESLint |
| `bun run lint:fix` | Fix ESLint errors automatically |

### Testing

| Bun                      | Description             |
| ------------------------ | ----------------------- |
| `bun test`               | Run all tests           |
| `bun test --watch`       | Run tests in watch mode |
| `bun test <file>`        | Run single test file    |
| `bun test --grep <name>` | Run test by name        |

### Utilities

| Bun             | Description           |
| --------------- | --------------------- |
| `bun run clean` | Clean build artifacts |

---

## Code Style Guidelines

### General Principles

- **TypeScript Strict Mode**: All code must pass strict type checking
- **No `any` types**: Use `unknown` when type is truly unknown, then narrow properly
- **ESLint + Prettier**: Auto-formatting on save (configure your editor)
- **Single Responsibility**: Small, focused functions and components

### Naming Conventions

```typescript
// Variables and functions: camelCase
const selectedText = '';
function getAnalysis() {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_TEXT_LENGTH = 10000;
const DEFAULT_EMOTION = 'professional';

// Types and Interfaces: PascalCase
interface TextAnalysisResult {}
type EmotionType = 'professional' | 'casual' | 'friendly';

// Files: kebab-case
// - components: TextInput.tsx, AnalysisResult.tsx
// - hooks: useLLM.ts, useStorage.ts
// - services: ollamaService.ts
// - utils: textParser.ts

// Directories: kebab-case (lowercase with dashes)
// src/components/, src/hooks/, src/services/
```

### Imports

```typescript
// Order: 1. External 2. Internal 3. Types

// External libraries
import { useState, useEffect } from 'react';
import { create } from 'zustand';

// Internal modules (use @/ alias when configured)
import { useStore } from '@/stores/appStore';
import { callOllama } from '@/services/ollama';

// Types
import type { AnalysisResult, EmotionType } from '@/types';

// Relative imports for close modules
import { formatText } from '../utils/formatText';
```

### Functions

```typescript
// Use arrow functions for callbacks, function declarations for hooks
function useTextAnalysis() {
  const [data, setData] = useState<string>('');

  return { data };
}

const handleSubmit = async (text: string): Promise<Result> => {
  try {
    const response = await apiCall(text);
    return response;
  } catch (error) {
    // Always handle errors with proper typing
    if (error instanceof Error) {
      console.error(error.message);
    }
    throw error;
  }
};
```

### Async/Await

```typescript
// Always use try/catch for async functions
async function fetchAnalysis(text: string): Promise<AnalysisResult> {
  try {
    const result = await llmService.analyze(text);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Analysis failed: ${message}`);
  }
}

// Use early returns for validation
async function validateInput(text: string): Promise<void> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH}`);
  }
}
```

### React Components

```typescript
// Functional components with explicit prop types
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

// Use default exports only for page-level components
export default function PopupPage() {}

// Named exports for shared components
export { Button, TextInput, AnalysisPanel };
```

### Error Handling

```typescript
// Always type catch blocks
try {
  await riskyOperation();
} catch (error: unknown) {
  // Narrow the type
  if (error instanceof Error) {
    return { error: error.message };
  }
  return { error: 'Unknown error occurred' };
}

// Use Result types for expected errors
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

function safeParse(data: unknown): Result<AnalysisResult> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: new Error('Invalid data') };
  }
  return { success: true, data: data as AnalysisResult };
}
```

### Zustand Stores

```typescript
interface AppState {
  // State
  selectedText: string;
  currentEmotion: EmotionType;
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  error: string | null;

  // Actions (use setter pattern)
  setSelectedText: (text: string) => void;
  setEmotion: (emotion: EmotionType) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setResult: (result: AnalysisResult | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  selectedText: '',
  currentEmotion: 'professional' as EmotionType,
  isAnalyzing: false,
  result: null,
  error: null,
};

export const useStore = create<AppState>((set) => ({
  ...initialState,

  setSelectedText: (text) => set({ selectedText: text }),
  setEmotion: (emotion) => set({ currentEmotion: emotion }),
  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  setResult: (result) => set({ result, error: null }),
  setError: (error) => set({ error, result: null }),
  reset: () => set(initialState),
}));
```

### Chrome Extension Specifics

```typescript
// Always wrap chrome API calls in promises
function getStorage<T>(key: string): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      }
      resolve(result[key] as T);
    });
  });
}

// Use proper message passing types
type ExtensionMessage =
  | { action: 'ANALYZE_TEXT'; payload: { text: string; emotion: EmotionType } }
  | { action: 'GET_SETTINGS' }
  | { action: 'UPDATE_SETTINGS'; payload: Settings };

// Content script - communicate via messaging
chrome.runtime.sendMessage({ action: 'ANALYZE_TEXT', payload: { text: 'Hello' } }, (response) => {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError);
    return;
  }
  console.log(response);
});
```

### Testing

```typescript
// Test file naming: *.test.ts
import { describe, it, expect } from 'bun:test';
import { analyzeText } from './textAnalyzer';

describe('analyzeText', () => {
  it('should return analysis result for valid text', async () => {
    const result = await analyzeText('Hello world', 'professional');
    expect(result).toBeDefined();
    expect(result.emotion).toBe('professional');
  });

  it('should throw error for empty text', async () => {
    await expect(analyzeText('', 'professional')).rejects.toThrow('Text cannot be empty');
  });
});
```

---

## Architecture Guidelines

### File Organization

```
src/
├── background/        # Service worker - entry points
│   └── index.ts
├── content/          # Injected scripts
│   └── index.ts
├── popup/            # Popup UI page
│   ├── index.tsx
│   └── App.tsx
├── sidepanel/        # Side panel UI
│   ├── index.tsx
│   └── App.tsx
├── components/       # Shared UI components
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx
│   └── ...
├── hooks/           # Custom React hooks
│   ├── useLLM.ts
│   └── useSelection.ts
├── stores/          # Zustand stores
│   └── appStore.ts
├── services/        # External API integrations
│   ├── ollama.ts
│   └── openai.ts
├── utils/           # Helper functions
│   └── textParser.ts
└── types/           # TypeScript definitions
    └── index.ts
```

### Component Guidelines

- Keep components under 200 lines
- Extract logic into custom hooks
- Use composition over inheritance
- Colocate tests next to components

---

## Browser Extension Patterns

### Manifest V3

- Use service workers instead of background pages
- Avoid blocking webRequest (use declarativeNetRequest)
- Request permissions only when needed
- Use declarative permissions where possible

### Content Scripts

- Run at `document_idle` for DOM readiness
- Use MutationObserver for dynamic content
- Communicate via message passing only
- Never use `eval()` or inline scripts

### Storage

- Use `chrome.storage.local` for extension data
- Use `chrome.storage.sync` for user preferences
- Always handle storage quota errors

---

## Additional Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [MDN WebExtensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Bun Bundler Docs](https://bun.com/docs/bundler)
- [Zustand](https://github.com/pmndrs/zustand)
