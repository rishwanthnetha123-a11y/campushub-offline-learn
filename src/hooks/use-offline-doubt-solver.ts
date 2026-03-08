import { useState, useEffect, useCallback } from 'react';
import localforage from 'localforage';

// ---------- Types ----------
interface CachedQA {
  question: string;
  answer: string;
  subject: string;
  language: string;
  mode: string;
  timestamp: number;
}

interface QueuedQuestion {
  id: string;
  question: string;
  subject: string;
  language: string;
  mode: string;
  conversationMessages: { role: string; content: string }[];
  queuedAt: number;
}

// ---------- Stores ----------
const qaCache = localforage.createInstance({ name: 'campushub', storeName: 'qa_cache' });
const questionQueue = localforage.createInstance({ name: 'campushub', storeName: 'question_queue' });
const faqStore = localforage.createInstance({ name: 'campushub', storeName: 'faq_cache' });

const MAX_CACHE_SIZE = 200;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ---------- Keyword matching ----------
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

function similarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const matches = a.filter(w => setB.has(w)).length;
  return matches / Math.max(a.length, b.length);
}

// ---------- Hook ----------
export function useOfflineDoubtSolver() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Track online/offline
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    refreshQueueCount();
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const refreshQueueCount = async () => {
    const keys = await questionQueue.keys();
    setQueueCount(keys.length);
  };

  // ---- Cache a response ----
  const cacheResponse = useCallback(async (
    question: string,
    answer: string,
    subject: string,
    language: string,
    mode: string,
  ) => {
    const entry: CachedQA = { question, answer, subject, language, mode, timestamp: Date.now() };
    const key = `qa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await qaCache.setItem(key, entry);

    // Evict old entries if over limit
    const keys = await qaCache.keys();
    if (keys.length > MAX_CACHE_SIZE) {
      const entries: { key: string; ts: number }[] = [];
      for (const k of keys) {
        const v = await qaCache.getItem<CachedQA>(k);
        if (v) entries.push({ key: k, ts: v.timestamp });
      }
      entries.sort((a, b) => a.ts - b.ts);
      const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
      for (const e of toRemove) await qaCache.removeItem(e.key);
    }
  }, []);

  // ---- Search cached answers ----
  const searchCache = useCallback(async (
    question: string,
    subject: string,
    language: string,
    mode: string,
  ): Promise<CachedQA | null> => {
    const tokens = tokenize(question);
    if (tokens.length === 0) return null;

    let bestMatch: CachedQA | null = null;
    let bestScore = 0;
    const now = Date.now();

    // Search both user cache and FAQ cache
    for (const store of [qaCache, faqStore]) {
      const keys = await store.keys();
      for (const key of keys) {
        const entry = await store.getItem<CachedQA>(key);
        if (!entry) continue;

        // Skip expired
        if (now - entry.timestamp > CACHE_TTL_MS) {
          await store.removeItem(key);
          continue;
        }

        // Prefer same subject/language/mode
        let bonus = 0;
        if (entry.subject === subject || subject === 'any') bonus += 0.1;
        if (entry.language === language) bonus += 0.05;
        if (entry.mode === mode) bonus += 0.05;

        const entryTokens = tokenize(entry.question);
        const score = similarity(tokens, entryTokens) + bonus;

        if (score > bestScore && score >= 0.45) {
          bestScore = score;
          bestMatch = entry;
        }
      }
    }

    return bestMatch;
  }, []);

  // ---- Queue a question for later ----
  const queueQuestion = useCallback(async (
    question: string,
    subject: string,
    language: string,
    mode: string,
    conversationMessages: { role: string; content: string }[],
  ) => {
    const item: QueuedQuestion = {
      id: crypto.randomUUID(),
      question,
      subject,
      language,
      mode,
      conversationMessages,
      queuedAt: Date.now(),
    };
    await questionQueue.setItem(item.id, item);
    await refreshQueueCount();
    return item.id;
  }, []);

  // ---- Get all queued questions ----
  const getQueuedQuestions = useCallback(async (): Promise<QueuedQuestion[]> => {
    const keys = await questionQueue.keys();
    const items: QueuedQuestion[] = [];
    for (const key of keys) {
      const item = await questionQueue.getItem<QueuedQuestion>(key);
      if (item) items.push(item);
    }
    return items.sort((a, b) => a.queuedAt - b.queuedAt);
  }, []);

  // ---- Remove from queue ----
  const removeFromQueue = useCallback(async (id: string) => {
    await questionQueue.removeItem(id);
    await refreshQueueCount();
  }, []);

  // ---- Sync queued questions when online ----
  const syncQueue = useCallback(async (
    sendFn: (q: QueuedQuestion) => Promise<string | null>,
  ) => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    const items = await getQueuedQuestions();
    for (const item of items) {
      try {
        const answer = await sendFn(item);
        if (answer) {
          await cacheResponse(item.question, answer, item.subject, item.language, item.mode);
          await removeFromQueue(item.id);
        }
      } catch {
        // Will retry next sync
      }
    }
    setIsSyncing(false);
  }, [getQueuedQuestions, cacheResponse, removeFromQueue]);

  // ---- Store FAQ batch ----
  const storeFAQs = useCallback(async (faqs: CachedQA[]) => {
    for (const faq of faqs) {
      const key = `faq_${tokenize(faq.question).join('_').slice(0, 50)}`;
      await faqStore.setItem(key, { ...faq, timestamp: Date.now() });
    }
  }, []);

  // ---- Get FAQ count ----
  const getFAQCount = useCallback(async (): Promise<number> => {
    const keys = await faqStore.keys();
    return keys.length;
  }, []);

  return {
    isOnline,
    queueCount,
    isSyncing,
    cacheResponse,
    searchCache,
    queueQuestion,
    getQueuedQuestions,
    removeFromQueue,
    syncQueue,
    storeFAQs,
    getFAQCount,
  };
}
