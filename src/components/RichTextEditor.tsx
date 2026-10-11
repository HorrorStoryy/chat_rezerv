import React, { useRef, useEffect, useState } from 'react';

interface RichTextEditorProps {
  onSend: (html: string, text: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  onSend,
  placeholder = 'Введите сообщение...',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);

  const templates = [
    {
      title: 'Приветствие',
      content: '<p>Здравствуйте!</p><p>Спасибо за обращение в нашу поддержку. Чем могу помочь?</p>',
    },
    {
      title: 'Уточнение проблемы',
      content: '<p>Уточните, пожалуйста:</p><ul><li>Когда возникла проблема?</li><li>Что именно не работает?</li><li>Появляются ли какие-то ошибки?</li></ul>',
    },
    {
      title: 'Решение найдено',
      content: '<p>Отличные новости! Мы нашли решение вашей проблемы.</p><p><strong>Что нужно сделать:</strong></p><ol><li>Первый шаг</li><li>Второй шаг</li><li>Третий шаг</li></ol><p>Если возникнут вопросы — обращайтесь!</p>',
    },
    {
      title: 'Передача специалисту',
      content: '<p>Ваш вопрос требует дополнительной экспертизы.</p><p>Я передам его профильному специалисту, который свяжется с вами в ближайшее время.</p>',
    },
    {
      title: 'Завершение',
      content: '<p>Был рад помочь!</p><p>Если появятся дополнительные вопросы — не стесняйтесь обращаться.</p><p>Хорошего дня!</p>',
    },
  ];

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  const updateEmptyState = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText.trim();
      const hasImages = editorRef.current.querySelector('img') !== null;
      setIsEmpty(text.length === 0 && !hasImages);
    }
  };

  const handleInput = () => {
    updateEmptyState();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    // Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      document.execCommand('bold', false);
    }

    // Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      document.execCommand('italic', false);
    }

    // Ctrl/Cmd + U for underline
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      document.execCommand('underline', false);
    }

    // Ctrl/Cmd + K for link
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const url = prompt('Введите URL:');
      if (url) {
        document.execCommand('createLink', false, url);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    
    // Check for images in clipboard (screenshots)
    if (clipboardData.items) {
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const imageUrl = event.target?.result as string;
              document.execCommand('insertImage', false, imageUrl);
              updateEmptyState();
            };
            reader.readAsDataURL(blob);
          }
          return;
        }
      }
    }
    
    // Handle text paste
    e.preventDefault();
    const html = clipboardData.getData('text/html');
    const text = clipboardData.getData('text/plain');

    if (html) {
      // Clean and insert HTML
      const cleanedHtml = cleanHtml(html);
      document.execCommand('insertHTML', false, cleanedHtml);
    } else if (text) {
      // Convert plain text to HTML with preserved line breaks
      const htmlText = textToHtml(text);
      document.execCommand('insertHTML', false, htmlText);
    }

    updateEmptyState();
  };

  const cleanHtml = (html: string): string => {
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Remove all style attributes and classes
    const elements = temp.querySelectorAll('*');
    elements.forEach((el) => {
      el.removeAttribute('style');
      el.removeAttribute('class');
    });

    // Convert to paragraphs if needed
    let cleaned = temp.innerHTML;
    
    // If no block elements, wrap in paragraph
    if (!cleaned.match(/<(p|div|h[1-6]|ul|ol|li|blockquote)/i)) {
      cleaned = `<p>${cleaned}</p>`;
    }

    return cleaned;
  };

  const textToHtml = (text: string): string => {
    // Split by newlines
    const lines = text.split('\n');
    
    // Check if it looks like a list
    const isList = lines.every(line => line.trim().match(/^[-*•]\s/) || line.trim() === '');
    
    if (isList && lines.length > 1) {
      const listItems = lines
        .filter(line => line.trim())
        .map(line => `<li>${escapeHtml(line.trim().replace(/^[-*•]\s/, ''))}</li>`)
        .join('');
      return `<ul>${listItems}</ul>`;
    }

    // Check if it looks like numbered list
    const isNumberedList = lines.every(line => line.trim().match(/^\d+[.)]\s/) || line.trim() === '');
    
    if (isNumberedList && lines.length > 1) {
      const listItems = lines
        .filter(line => line.trim())
        .map(line => `<li>${escapeHtml(line.trim().replace(/^\d+[.)]\s/, ''))}</li>`)
        .join('');
      return `<ol>${listItems}</ol>`;
    }

    // Regular text - preserve line breaks
    return lines
      .map(line => {
        if (line.trim() === '') return '<br>';
        return `<p>${escapeHtml(line)}</p>`;
      })
      .join('');
  };

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const handleSend = () => {
    if (!editorRef.current || isEmpty) return;

    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText;

    if (text.trim() || editorRef.current.querySelector('img')) {
      onSend(html, text);
      editorRef.current.innerHTML = '';
      setIsEmpty(true);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateEmptyState();
  };

  const insertTemplate = (template: typeof templates[0]) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = template.content;
      updateEmptyState();
      setShowTemplates(false);
      editorRef.current.focus();
    }
  };

  const insertLink = () => {
    const url = prompt('Введите URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          execCommand('insertImage', imageUrl);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="bg-white border-t border-gray-200">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100">
        <button
          onClick={() => execCommand('bold')}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 font-bold transition-colors"
          title="Жирный (Ctrl+B)"
        >
          B
        </button>
        <button
          onClick={() => execCommand('italic')}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 italic transition-colors"
          title="Курсив (Ctrl+I)"
        >
          I
        </button>
        <button
          onClick={() => execCommand('underline')}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 underline transition-colors"
          title="Подчёркнутый (Ctrl+U)"
        >
          U
        </button>
        
        <div className="w-px h-6 bg-gray-200 mx-1"></div>
        
        <button
          onClick={() => execCommand('insertUnorderedList')}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
          title="Маркированный список"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          onClick={() => execCommand('insertOrderedList')}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
          title="Нумерованный список"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="w-px h-6 bg-gray-200 mx-1"></div>
        
        <button
          onClick={insertLink}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
          title="Вставить ссылку (Ctrl+K)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>
        <button
          onClick={insertImage}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
          title="Вставить изображение"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        
        <div className="w-px h-6 bg-gray-200 mx-1"></div>
        
        <div className="relative">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-3 h-8 flex items-center gap-1 rounded-md hover:bg-gray-100 text-gray-600 text-sm transition-colors"
            title="Шаблоны ответов"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Шаблоны</span>
          </button>
          
          {showTemplates && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="p-2">
                <p className="text-xs font-medium text-gray-500 px-2 py-1">Быстрые ответы</p>
                {templates.map((template, idx) => (
                  <button
                    key={idx}
                    onClick={() => insertTemplate(template)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-md transition-colors"
                  >
                    {template.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="ml-auto text-xs text-gray-400">
          💡 Ctrl+V для вставки скриншотов
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="min-h-[100px] max-h-[300px] overflow-y-auto px-4 py-3 text-sm text-gray-800 focus:outline-none prose prose-sm max-w-none"
          style={{
            lineHeight: '1.6',
          }}
          suppressContentEditableWarning
        />
        {isEmpty && (
          <div className="absolute top-3 left-4 text-sm text-gray-400 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Send Button */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100">
        <div className="text-xs text-gray-400">
          <span className="hidden sm:inline">Enter — отправить • Shift+Enter — перенос строки</span>
        </div>
        <button
          onClick={handleSend}
          disabled={isEmpty}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          Отправить
        </button>
      </div>
    </div>
  );
};
