import { useState, useEffect } from 'react';
import { ProgressNavScrollspy } from '@webzicon/progress-nav-scrollspy';
import '../src/styles.css';

// Import test markdown files as raw text
import sqlConventions from '../test_docs/sql-conventions.md?raw';
import projectPresentation from '../test_docs/Project Presentation.md?raw';
import projectProposal from '../test_docs/Project Proposal.md?raw';
import aiPlatform from '../test_docs/Private Enterprise AI Platform.md?raw';

const documents: Record<string, string> = {
  'sql-conventions': sqlConventions,
  'project-presentation': projectPresentation,
  'project-proposal': projectProposal,
  'ai-platform': aiPlatform,
};

const documentLabels: Record<string, string> = {
  'sql-conventions': 'SQL Coding Conventions',
  'project-presentation': 'Project Presentation',
  'project-proposal': 'Project Proposal',
  'ai-platform': 'Private Enterprise AI Platform',
};

// Simple markdown to HTML converter (basic implementation for demo)
function markdownToHtml(markdown: string): string {
  let html = markdown
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Code blocks (must come before other processing)
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Headers (with IDs for scrollspy)
    .replace(/^###### (.+)$/gm, (_, text) => `<h6 id="${generateId(text)}">${text}</h6>`)
    .replace(/^##### (.+)$/gm, (_, text) => `<h5 id="${generateId(text)}">${text}</h5>`)
    .replace(/^#### (.+)$/gm, (_, text) => `<h4 id="${generateId(text)}">${text}</h4>`)
    .replace(/^### (.+)$/gm, (_, text) => `<h3 id="${generateId(text)}">${text}</h3>`)
    .replace(/^## (.+)$/gm, (_, text) => `<h2 id="${generateId(text)}">${text}</h2>`)
    .replace(/^# (.+)$/gm, (_, text) => `<h1 id="${generateId(text)}">${text}</h1>`)
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Horizontal rules
    .replace(/^---+$/gm, '<hr />')
    // Tables
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c.trim()))) {
        return '<!-- table separator -->';
      }
      const cellHtml = cells.map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cellHtml}</tr>`;
    })
    // Wrap tables
    .replace(/((<tr>.*<\/tr>\n?)+)/g, '<table>$1</table>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    // Wrap consecutive list items
    .replace(/((<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    // Paragraphs (simple approach)
    .replace(/\n\n+/g, '</p><p>')
    // Clean up
    .replace(/<!-- table separator -->/g, '');

  return `<p>${html}</p>`;
}

function generateId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function App() {
  const [selectedDoc, setSelectedDoc] = useState('sql-conventions');
  const [isDark, setIsDark] = useState(false);
  const [showProgress, setShowProgress] = useState(true);
  const [updateHash, setUpdateHash] = useState(false);

  const markdown = documents[selectedDoc];
  const html = markdownToHtml(markdown);

  // Apply dark mode to body
  useEffect(() => {
    document.body.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <div className={`demo-app ${isDark ? 'dark' : ''}`}>
      {/* Header */}
      <header className="demo-header">
        <h1>Progress Nav Scrollspy</h1>
        <div className="demo-controls">
          <select
            value={selectedDoc}
            onChange={(e) => setSelectedDoc(e.target.value)}
            className="demo-select"
          >
            {Object.entries(documentLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <label className="demo-checkbox">
            <input
              type="checkbox"
              checked={showProgress}
              onChange={(e) => setShowProgress(e.target.checked)}
            />
            Show Progress
          </label>

          <label className="demo-checkbox">
            <input
              type="checkbox"
              checked={updateHash}
              onChange={(e) => setUpdateHash(e.target.checked)}
            />
            Update URL Hash
          </label>

          <button
            className="demo-button"
            onClick={() => setIsDark(!isDark)}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="demo-layout">
        {/* Sidebar with TOC */}
        <aside className="demo-sidebar">
          <ProgressNavScrollspy
            contentSelector=".demo-content"
            headingSelector="h1, h2, h3, h4"
            showProgress={showProgress}
            updateHash={updateHash}
            title="On this page"
            minLevel={1}
            maxLevel={4}
            offset={80}
            activeColor={isDark ? '#60a5fa' : '#3b82f6'}
            trackColor={isDark ? '#374151' : '#e5e7eb'}
            onActiveChange={(items) => {
              console.log('Active items:', items.map(i => i.text));
            }}
            onProgressChange={(progress) => {
              console.log('Progress:', progress);
            }}
          />
        </aside>

        {/* Document content */}
        <main className="demo-main" data-scroll-container>
          <article
            className="demo-content content"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </main>
      </div>
    </div>
  );
}
