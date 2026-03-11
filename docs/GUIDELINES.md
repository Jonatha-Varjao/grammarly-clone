# Development Guidelines

## Do's

### Code Quality

- ✅ **Use TypeScript strict mode** - Enable all strict checks in tsconfig
- ✅ **Type everything** - Avoid `any`, use `unknown` and narrow properly
- ✅ **Keep components small** - Under 200 lines per component
- ✅ **Extract logic into hooks** - Reusable business logic in `src/hooks/`
- ✅ **Colocate tests** - Place tests next to the files they test

### Chrome Extension Patterns

- ✅ **Use service workers** - Background pages are deprecated in MV3
- ✅ **Wrap chrome APIs in promises** - Callbacks are error-prone
- ✅ **Use message passing** - Content scripts and background communicate via messages
- ✅ **Handle storage quota** - Chrome storage has limits
- ✅ **Use declarative permissions** - Request only what's needed

### State Management

- ✅ **Use Zustand** - Lightweight, simple, no provider wrapping needed
- ✅ **Persist user settings** - Use chrome.storage.sync for preferences
- ✅ **Use middleware for persistence** - Zustand persist middleware with chrome.storage

### Error Handling

- ✅ **Always type catch blocks** - Use `unknown` and narrow properly
- ✅ **Provide fallback values** - UI shouldn't break on API failures
- ✅ **Log meaningful errors** - Include context for debugging
- ✅ **Handle offline states** - Ollama might not be running

### LLM Integration

- ✅ **Validate input before API call** - Check text length, empty states
- ✅ **Handle API timeouts** - Local LLMs can be slow
- ✅ **Provide loading states** - User feedback during analysis
- ✅ **Cache results when appropriate** - Avoid redundant calls

---

## Don'ts

### Code Quality

- ❌ **Don't use `any`** - Type properly or use `unknown`
- ❌ **Don't ignore TypeScript errors** - Fix them, don't suppress
- ❌ **Don't commit secrets** - API keys go in environment variables or storage
- ❌ **Don't over-engineer** - Simple is better than complex

### Chrome Extension

- ❌ **Don't use eval()** - Blocked by CSP, security risk
- ❌ **Don't use inline scripts** - Use separate JS files
- ❌ **Don't over-request permissions** - Users are hesitant to install
- ❌ **Don't block the main thread** - LLM calls must be async
- ❌ **Don't use background pages** - Service workers only in MV3

### Performance

- ❌ **Don't bundle unnecessary dependencies** - Keep extension lightweight
- ❌ **Don't make unnecessary API calls** - Cache intelligently
- ❌ **Don't store large amounts in chrome.storage** - Use IndexedDB for big data
- ❌ **Don't run heavy computations in content scripts** - Delegate to background

### Security

- ❌ **Don't expose API keys in code** - Use chrome.storage.local
- ❌ **Don't trust all messages** - Validate message sources
- ❌ **Don't execute remote code** - Forbidden in MV3
- ❌ **Don't log sensitive data** - Be careful with console logs

---

## Patterns

### Message Passing

```typescript
// Content script -> Background
chrome.runtime.sendMessage(
  { action: 'ANALYZE_TEXT', payload: { text, emotion } },
  (response) => {
    if (chrome.runtime.lastError) {
      // Handle error
    }
    // Process response
  }
);

// Background listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'ANALYZE_TEXT') {
    handleAnalyze(message.payload).then(sendResponse);
    return true; // Keep channel open for async response
  }
});
```

### Storage with Zustand

```typescript
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsStore {
  llmProvider: 'ollama' | 'openai';
  endpoint: string;
  apiKey: string;
  defaultEmotion: EmotionType;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      llmProvider: 'ollama',
      endpoint: 'http://localhost:11434',
      apiKey: '',
      defaultEmotion: 'professional',
      setProvider: (provider) => set({ llmProvider: provider }),
      setEndpoint: (endpoint) => set({ endpoint }),
      setApiKey: (key) => set({ apiKey: key }),
      setDefaultEmotion: (emotion) => set({ defaultEmotion: emotion }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => chrome.storage.local),
    }
  )
);
```

### Async Chrome API Wrapper

```typescript
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

function setStorage<T>(key: string, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      }
      resolve();
    });
  });
}
```

### Content Script Isolation

```typescript
// Don't access page variables directly
// ❌ const pageData = window.pageData;

// Use message passing instead
// ✅ chrome.runtime.sendMessage({ action: 'GET_DATA' }, callback);
```

### LLM Error Handling

```typescript
async function callLLM(text: string, emotion: EmotionType): Promise<AnalysisResult> {
  try {
    const response = await fetch(endpoint + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: 'llama3.2',
        messages: [
          { role: 'system', content: EMOTION_PROMPTS[emotion] },
          { role: 'user', content: text },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    return parseLLMResponse(data);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to LLM. Is Ollama running?');
    }
    throw error;
  }
}
```

---

## Common Pitfalls

### 1. Storage Race Conditions

```typescript
// ❌ Don't assume chrome.storage is synchronous
const data = chrome.storage.local.get(['key']);
console.log(data); // undefined!

// ✅ Use callbacks or promises
chrome.storage.local.get(['key'], (result) => {
  console.log(result.key);
});
```

### 2. Service Worker Lifecycle

```typescript
// ❌ Don't rely on persistent state
let cachedData = loadFromDisk(); // Lost when SW stops

// ✅ Use chrome.storage for persistence
async function getCachedData() {
  const result = await getStorage('cachedData');
  return result;
}
```

### 3. Content Script Isolation

```typescript
// ❌ Don't share state with page
window.sharedState = { text: 'hello' };

// ✅ Use chrome.runtime messaging
chrome.runtime.sendMessage({ action: 'STORE_TEXT', payload: 'hello' });
```

### 4. Large Text Handling

```typescript
// ❌ Don't send massive text to LLM without limit
const result = await callLLM(entirePageContent); // May fail

// ✅ Enforce limits
const MAX_TEXT_LENGTH = 10000;
const truncated = text.slice(0, MAX_TEXT_LENGTH);
```

---

## Best Practices Summary

1. **Start simple** - Don't add complexity until needed
2. **Think about the user** - Performance and privacy matter
3. **Test locally** - Ollama running on your machine
4. **Handle errors gracefully** - Users don't understand technical errors
5. **Keep it lightweight** - Extensions should be fast
6. **Document decisions** - Future you will thank present you
