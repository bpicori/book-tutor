// src/main.ts
import './foliate-js/view.js';

// Types
interface TOCItem {
  label: string;
  href: string;
  subitems?: TOCItem[];
}

interface BookMetadata {
  title?: string;
  author?: string | string[];
  description?: string;
  language?: string;
}

interface Book {
  metadata?: BookMetadata;
  toc?: TOCItem[];
  getCover?(): Promise<Blob | null>;
}

interface FoliateView extends HTMLElement {
  book?: Book;
  open(file: File): Promise<void>;
  init(options: { lastLocation?: string; showTextStart?: boolean }): Promise<void>;
  prev(): Promise<void>;
  next(): Promise<void>;
  goLeft(): Promise<void>;
  goRight(): Promise<void>;
  goTo(target: string | number): Promise<void>;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// DOM Elements
const container = document.getElementById('reader');
const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const bookTitle = document.getElementById('book-title');
const bookAuthor = document.getElementById('book-author');
const bookCover = document.getElementById('book-cover');
const headerTitle = document.getElementById('header-title');
const tocList = document.getElementById('toc-list');
const progressFooter = document.getElementById('progress-footer');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');
const progressLabel = document.getElementById('progress-label');
const aiSidebar = document.getElementById('ai-sidebar');
const toggleAiBtn = document.getElementById('toggle-ai-btn');
const closeAiBtn = document.getElementById('close-ai-btn');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input') as HTMLInputElement | null;
const sendBtn = document.getElementById('send-btn');
const quickActions = document.getElementById('quick-actions');

if (!container || !fileInput) {
  throw new Error('Required elements not found');
}

// State
let currentBook: Book | null = null;
let currentTocItem: string | null = null;
const chatHistory: ChatMessage[] = [];

// Create the <foliate-view> custom element
const view = document.createElement('foliate-view') as FoliateView;
view.style.width = '100%';
view.style.height = '100%';
container.appendChild(view);

// Update book metadata in the UI
function updateBookInfo(book: Book) {
  const metadata = book.metadata;
  if (!metadata) return;

  const title = metadata.title || 'Untitled';
  const author = Array.isArray(metadata.author)
    ? metadata.author.join(', ')
    : metadata.author || 'Unknown Author';

  if (bookTitle) bookTitle.textContent = title;
  if (bookAuthor) bookAuthor.textContent = author;
  if (headerTitle) headerTitle.textContent = title;
  document.title = `${title} - Read with AI`;

  // Load cover image
  if (book.getCover && bookCover) {
    book.getCover().then((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        bookCover.style.backgroundImage = `url("${url}")`;
        bookCover.innerHTML = '';
      }
    }).catch(console.error);
  }
}

// Render table of contents
function renderTOC(toc: TOCItem[], level = 0) {
  if (!tocList) return;

  if (level === 0) {
    tocList.innerHTML = '';
  }

  const fragment = document.createDocumentFragment();

  toc.forEach((item, index) => {
    const link = document.createElement('a');
    link.href = '#';
    link.className = `flex items-center gap-3 px-3 py-2 rounded-lg text-muted-gray-text hover:bg-hover-warm transition-colors`;
    link.style.paddingLeft = `${12 + level * 16}px`;
    link.dataset.href = item.href;
    link.dataset.index = String(index);

    link.innerHTML = `
      <span class="material-symbols-outlined text-lg">description</span>
      <p class="text-sm font-medium leading-normal truncate">${item.label}</p>
    `;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      view.goTo(item.href);
      setActiveTocItem(link);
    });

    fragment.appendChild(link);

    if (item.subitems && item.subitems.length > 0) {
      const subContainer = document.createElement('div');
      subContainer.className = 'flex flex-col gap-1';
      fragment.appendChild(subContainer);

      item.subitems.forEach((subitem) => {
        const subLink = document.createElement('a');
        subLink.href = '#';
        subLink.className = `flex items-center gap-3 px-3 py-2 rounded-lg text-muted-gray-text hover:bg-hover-warm transition-colors`;
        subLink.style.paddingLeft = `${12 + (level + 1) * 16}px`;
        subLink.dataset.href = subitem.href;

        subLink.innerHTML = `
          <span class="material-symbols-outlined text-lg text-light-gray-text">subdirectory_arrow_right</span>
          <p class="text-sm font-medium leading-normal truncate">${subitem.label}</p>
        `;

        subLink.addEventListener('click', (e) => {
          e.preventDefault();
          view.goTo(subitem.href);
          setActiveTocItem(subLink);
        });

        subContainer.appendChild(subLink);
      });
    }
  });

  tocList.appendChild(fragment);
}

function setActiveTocItem(activeLink: HTMLElement) {
  if (!tocList) return;

  tocList.querySelectorAll('a').forEach((link) => {
    link.classList.remove('bg-active-green-light', 'text-forest-green');
    link.classList.add('text-muted-gray-text');
  });

  activeLink.classList.remove('text-muted-gray-text');
  activeLink.classList.add('bg-active-green-light', 'text-forest-green');
  currentTocItem = activeLink.dataset.href || null;
}


// Update reading progress
function updateProgress(fraction: number, tocItem?: { label?: string }) {
  const percent = Math.round(fraction * 100);

  if (progressFooter) progressFooter.classList.remove('hidden');
  if (progressBar) progressBar.style.width = `${percent}%`;
  if (progressPercent) progressPercent.textContent = `${percent}%`;
  if (progressLabel && tocItem?.label) {
    progressLabel.textContent = tocItem.label;
  }
}

// AI Sidebar toggle
function toggleAiSidebar(show?: boolean) {
  if (!aiSidebar) return;

  const shouldShow = show ?? aiSidebar.classList.contains('hidden');

  if (shouldShow) {
    aiSidebar.classList.remove('hidden');
  } else {
    aiSidebar.classList.add('hidden');
  }
}

// Add message to chat
function addChatMessage(role: 'user' | 'assistant', content: string) {
  if (!chatMessages) return;

  chatHistory.push({ role, content });

  const messageDiv = document.createElement('div');
  messageDiv.className = 'flex items-end gap-3 mt-4';

  if (role === 'user') {
    messageDiv.innerHTML = `
      <div class="flex flex-1 flex-col gap-1 items-end">
        <p class="text-light-gray-text text-sm font-medium leading-normal max-w-[360px]">You</p>
        <p class="text-base font-normal leading-normal flex max-w-[360px] rounded-lg rounded-br-none px-4 py-2 bg-forest-green text-white">
          ${escapeHtml(content)}
        </p>
      </div>
      <div class="bg-hover-warm rounded-full w-8 h-8 shrink-0 flex items-center justify-center">
        <span class="material-symbols-outlined text-muted-gray-text text-lg">person</span>
      </div>
    `;
  } else {
    messageDiv.innerHTML = `
      <div class="bg-forest-green rounded-full w-8 h-8 shrink-0 flex items-center justify-center">
        <span class="material-symbols-outlined text-white text-lg">smart_toy</span>
      </div>
      <div class="flex flex-1 flex-col gap-1 items-start">
        <p class="text-light-gray-text text-sm font-medium leading-normal max-w-[360px]">AI Assistant</p>
        <p class="text-base font-normal leading-normal flex max-w-[360px] rounded-lg rounded-bl-none px-4 py-2 bg-hover-warm text-muted-gray-text">
          ${escapeHtml(content)}
        </p>
      </div>
    `;
  }

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Handle chat input
async function handleChatSubmit() {
  if (!chatInput) return;

  const message = chatInput.value.trim();
  if (!message) return;

  chatInput.value = '';
  addChatMessage('user', message);

  // Simulate AI response (placeholder for actual AI integration)
  setTimeout(() => {
    const bookInfo = currentBook?.metadata?.title
      ? `about "${currentBook.metadata.title}"`
      : '';
    addChatMessage('assistant', `I received your question ${bookInfo}: "${message}". This is a placeholder response. To integrate with an actual AI service, you would need to add an API endpoint and connect it here.`);
  }, 500);
}

// Handle quick action buttons
function handleQuickAction(action: string) {
  const actions: Record<string, string> = {
    summarize: 'Can you summarize this chapter for me?',
    themes: 'What are the main themes in this book?',
    characters: 'Who are the main characters and what are their roles?',
  };

  const message = actions[action];
  if (message && chatInput) {
    chatInput.value = message;
    handleChatSubmit();
  }
}

// Event Listeners
view.addEventListener('relocate', (e: Event) => {
  const detail = (e as CustomEvent).detail;
  const { fraction, tocItem } = detail;
  updateProgress(fraction, tocItem);
});

// Navigation buttons
prevBtn?.addEventListener('click', () => view.prev());
nextBtn?.addEventListener('click', () => view.next());

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  // Don't navigate if typing in input
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return;
  }

  if (e.key === 'ArrowLeft') {
    view.goLeft();
  } else if (e.key === 'ArrowRight') {
    view.goRight();
  }
});

// AI Sidebar controls
toggleAiBtn?.addEventListener('click', () => toggleAiSidebar());
closeAiBtn?.addEventListener('click', () => toggleAiSidebar(false));

// Chat input
sendBtn?.addEventListener('click', handleChatSubmit);
chatInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleChatSubmit();
  }
});

// Quick actions
document.querySelectorAll('.quick-action').forEach((btn) => {
  btn.addEventListener('click', () => {
    const action = (btn as HTMLElement).dataset.action;
    if (action) handleQuickAction(action);
  });
});

// Open file when selected
fileInput.addEventListener('change', async (e) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  console.log('Opening file:', file.name);

  try {
    console.log('Calling view.open...');
    await view.open(file);

    // Store book reference and update UI
    currentBook = view.book || null;

    if (currentBook) {
      updateBookInfo(currentBook);

      if (currentBook.toc) {
        renderTOC(currentBook.toc);
      }

      // Show quick actions in AI sidebar
      if (quickActions) {
        quickActions.classList.remove('hidden');
      }
    }

    console.log('Book opened, initializing...');
    await view.init({ lastLocation: undefined, showTextStart: true });
    console.log('Book initialized successfully');
  } catch (err) {
    console.error('Failed to open book:', err);
  }
});
