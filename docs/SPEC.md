# Specification Document

## Feature Specifications

### 1. Text Selection

**Description**: User selects text on any webpage and triggers analysis.

#### Requirements

- Content script detects text selection using `window.getSelection()`
- Selection triggers floating action button (FAB) near selection
- Keyboard shortcut `Ctrl+Shift+G` (configurable) triggers analysis
- Context menu item "Analyze with Grammarly Clone" available

#### Edge Cases

- Empty selection: Show tooltip "Select text to analyze"
- Very long selection (>10,000 chars): Truncate with warning
- Selection in input/textarea: Support basic inputs
- Dynamic content: Use MutationObserver for SPAs

#### User Flow

```
1. User selects text on webpage
2. FAB appears near selection
3. User clicks FAB OR uses keyboard shortcut
4. Side panel opens with selected text
5. User selects emotion or clicks "Analyze"
6. LLM processes text
7. Results displayed
```

---

### 2. Tone Transformation

**Description**: Rewrite text to match different emotional tones.

#### Supported Emotions

| Emotion | Description | Use Case |
|---------|-------------|----------|
| Professional | Clear, business-appropriate | Work emails, formal writing |
| Casual | Conversational, relaxed | Friends, informal chats |
| Friendly | Warm, approachable | Customer support, friendly emails |
| Formal | Proper, structured | Legal, academic documents |
| Academic | Scholarly, impersonal | Research papers, studies |
| Creative | Imaginative, expressive | Marketing, social media |

#### Requirements

- Display emotion selector with icons/descriptions
- Show original text alongside transformed text
- Provide "Copy" button for transformed text
- Provide "Replace" button to insert in page (where possible)
- Preserve all factual information in transformation

#### Output Format

```typescript
interface TransformationResult {
  original: string;
  transformed: string;
  emotion: EmotionType;
  changes?: {
    type: 'word_choice' | 'structure' | 'tone' | 'grammar';
    description: string;
  }[];
}
```

---

### 3. Grammar Analysis

**Description**: Check text for grammar, spelling, and syntax errors.

#### Requirements

- Identify grammar errors with explanations
- Suggest corrections where possible
- Highlight changes in transformed text
- Severity levels: Error, Warning, Suggestion

#### Output Format

```typescript
interface GrammarIssue {
  type: 'grammar' | 'spelling' | 'punctuation' | 'style';
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  position: {
    start: number;
    end: number;
  };
  suggestion?: string;
}

interface AnalysisResult {
  text: string;
  issues: GrammarIssue[];
  score?: number; // 0-100 readability score
}
```

---

### 4. Settings

**Description**: User-configurable options for LLM and extension behavior.

#### Settings Schema

```typescript
interface Settings {
  // LLM Configuration
  provider: 'ollama' | 'openai' | 'custom';
  endpoint: string;
  apiKey: string;
  model: string;
  
  // Defaults
  defaultEmotion: EmotionType;
  defaultAnalysisMode: 'grammar' | 'tone' | 'both';
  
  // Behavior
  keyboardShortcut: string;
  autoAnalyze: boolean;
  showFab: boolean;
  
  // Privacy
  saveHistory: boolean;
  maxHistoryItems: number;
}
```

#### Default Values

```typescript
const DEFAULT_SETTINGS: Settings = {
  provider: 'ollama',
  endpoint: 'http://localhost:11434',
  apiKey: '',
  model: 'llama3.2',
  defaultEmotion: 'professional',
  defaultAnalysisMode: 'both',
  keyboardShortcut: 'Ctrl+Shift+G',
  autoAnalyze: false,
  showFab: true,
  saveHistory: true,
  maxHistoryItems: 50,
};
```

---

## API Contracts

### LLM Service Interface

```typescript
interface LLMService {
  analyze(text: string): Promise<AnalysisResult>;
  
  transform(text: string, emotion: EmotionType): Promise<TransformationResult>;
  
  checkConnection(): Promise<boolean>;
  
  getModels(): Promise<string[]>;
}

interface LLMConfig {
  provider: 'ollama' | 'openai' | 'custom';
  endpoint: string;
  apiKey?: string;
  model: string;
}
```

### Message Passing Types

```typescript
// Content Script -> Background
type ContentToBackgroundMessage =
  | { action: 'ANALYZE'; payload: { text: string; mode: 'grammar' | 'tone' | 'both' } }
  | { action: 'TRANSFORM'; payload: { text: string; emotion: EmotionType } }
  | { action: 'GET_SETTINGS' }
  | { action: 'OPEN_SIDE_PANEL' };

// Background -> Content Script
type BackgroundToContentMessage =
  | { action: 'ANALYSIS_RESULT'; payload: AnalysisResult }
  | { action: 'TRANSFORMATION_RESULT'; payload: TransformationResult }
  | { action: 'ERROR'; payload: { message: string; code: string } }
  | { action: 'SETTINGS'; payload: Settings };

// Popup/Sidepanel -> Background
type UIBackgroundMessage =
  | { action: 'ANALYZE'; payload: { text: string; emotion: EmotionType } }
  | { action: 'GET_SETTINGS' }
  | { action: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { action: 'GET_HISTORY' }
  | { action: 'CLEAR_HISTORY' };
```

---

## Prompt Templates

### System Prompts

```typescript
const SYSTEM_PROMPTS = {
  grammar: `You are a professional grammar and style editor. Analyze the given text for:
1. Grammar errors
2. Spelling mistakes
3. Punctuation issues
4. Awkward phrasing
5. Readability improvements

Provide specific corrections with explanations. Format your response as JSON.`,

  professional: `You are a professional editor specializing in business and corporate writing. 
Rewrite the text to be:
- Clear and concise
- Professional and business-appropriate
- Free of contractions and slang
- Properly structured

Preserve all factual information and the original meaning. Return only the rewritten text.`,

  casual: `You are a friendly, conversational writer.
Rewrite the text to be:
- Casual and relaxed
- Natural and conversational
- Using contractions where appropriate
- Easy to read

Preserve all factual information and the original meaning. Return only the rewritten text.`,

  friendly: `You are a warm, approachable communicator.
Rewrite the text to be:
- Friendly and welcoming
- Personable and empathetic
- Using positive language
- Warm in tone

Preserve all factual information and the original meaning. Return only the rewritten text.`,

  formal: `You are a formal writing expert.
Rewrite the text to be:
- Structured and organized
- Using formal vocabulary
- Complex but clear sentences
- Objective and impartial

Preserve all factual information and the original meaning. Return only the rewritten text.`,

  academic: `You are an academic writer and researcher.
Rewrite the text to be:
- Scholarly and objective
- Using academic vocabulary
- Properly cited format (where applicable)
- Impersonal voice

Preserve all factual information and the original meaning. Return only the rewritten text.`,

  creative: `You are a creative writer.
Rewrite the text to be:
- Imaginative and expressive
- Engaging and memorable
- Using vivid language
- Creative but clear

Preserve all factual information and the original meaning. Return only the rewritten text.`,
};
```

### User Prompt Template

```typescript
function buildUserPrompt(text: string, emotion: EmotionType): string {
  return `Please rewrite the following text in a ${emotion} tone:

---
${text}
---

Requirements:
- Preserve all factual information
- Maintain the original message
- Only change tone and style, not content
- Return only the rewritten text, no explanations`;
}

function buildGrammarPrompt(text: string): string {
  return `Analyze the following text for grammar, spelling, and style issues:

---
${text}
---

Provide your analysis in JSON format:
{
  "issues": [
    {
      "type": "grammar|spelling|punctuation|style",
      "severity": "error|warning|suggestion",
      "message": "description of issue",
      "position": { "start": number, "end": number },
      "suggestion": "corrected version if applicable"
    }
  ],
  "score": readability-score-0-100
}`;
}
```

---

## Storage Schemas

### History Item

```typescript
interface HistoryItem {
  id: string; // UUID
  timestamp: number;
  originalText: string;
  transformedText?: string;
  emotion?: EmotionType;
  analysis?: AnalysisResult;
  provider: string;
  model: string;
}
```

### Storage Keys

```typescript
const STORAGE_KEYS = {
  SETTINGS: 'extension_settings',
  HISTORY: 'analysis_history',
  CACHE: 'llm_response_cache',
} as const;
```

---

## Permission Requirements

### Required Permissions

```json
{
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "commands": [
    {
      "suggested_key": "Ctrl+Shift+G",
      "description": "Analyze selected text"
    }
  ]
}
```

### Permission Justification

| Permission | Justification |
|------------|---------------|
| storage | Save user settings and history |
| activeTab | Access selected text in current tab |
| scripting | Inject content script for text selection |
| host_permissions | Analyze text on any website |
| commands | Keyboard shortcut for quick access |

---

## UI Component Specifications

### Emotion Selector

- 6 emotion options in a grid (2x3) or dropdown
- Each emotion shows:
  - Icon (optional)
  - Name
  - Short description
- Selected state clearly indicated

### Result Panel

- Side-by-side or tabbed view: Original | Transformed
- Highlight changes (diff view)
- Action buttons: Copy, Replace, Save

### Settings Page

- Grouped by category (LLM, Defaults, Behavior, Privacy)
- Real-time validation for endpoint URLs
- Test connection button
- Reset to defaults option

---

## Error Codes

```typescript
const ERROR_CODES = {
  CONNECTION_FAILED: 'LLM_CONNECTION_FAILED',
  INVALID_ENDPOINT: 'INVALID_ENDPOINT',
  API_ERROR: 'LLM_API_ERROR',
  TIMEOUT: 'LLM_TIMEOUT',
  TEXT_TOO_LONG: 'TEXT_TOO_LONG',
  NO_TEXT_SELECTED: 'NO_TEXT_SELECTED',
  STORAGE_ERROR: 'STORAGE_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const;
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Extension load time | < 500ms |
| Side panel open | < 200ms |
| LLM response (Ollama local) | < 30s |
| LLM response (cloud API) | < 10s |
| Bundle size (gzipped) | < 500KB |
