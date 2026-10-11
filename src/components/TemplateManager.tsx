import React, { useState, useRef } from 'react';
import { Template, Employee } from '../types';
import { formatFullDate } from '../store';

interface TemplateManagerProps {
  templates: Template[];
  currentUser: Employee;
  onAddTemplate: (title: string, content: string) => void;
  onEditTemplate: (id: string, title: string, content: string) => void;
  onDeleteTemplate: (id: string) => void;
  onClose: () => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  currentUser,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onClose,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const getPlainText = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const handleStartEdit = (template: Template) => {
    setEditingId(template.id);
    setEditTitle(template.title);
    setEditContent(template.content);
    setIsAdding(false);
  };

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim() && editContent.trim()) {
      onEditTemplate(editingId, editTitle.trim(), editContent.trim());
      setEditingId(null);
      setEditTitle('');
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
  };

  const handleStartAdd = () => {
    setIsAdding(true);
    setNewTitle('');
    setEditingId(null);
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
        editorRef.current.focus();
      }
    }, 0);
  };

  const handleSaveNew = () => {
    if (editorRef.current && newTitle.trim()) {
      const content = editorRef.current.innerHTML;
      if (content.trim()) {
        onAddTemplate(newTitle.trim(), content);
        setIsAdding(false);
        setNewTitle('');
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
      }
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewTitle('');
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  const handleEditorPaste = (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    
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
            };
            reader.readAsDataURL(blob);
          }
          return;
        }
      }
    }
    
    e.preventDefault();
    const html = clipboardData.getData('text/html');
    const text = clipboardData.getData('text/plain');

    if (html) {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const elements = temp.querySelectorAll('*');
      elements.forEach((el) => {
        el.removeAttribute('style');
        el.removeAttribute('class');
      });
      let cleaned = temp.innerHTML;
      if (!cleaned.match(/<(p|div|h[1-6]|ul|ol|li|blockquote)/i)) {
        cleaned = `<p>${cleaned}</p>`;
      }
      document.execCommand('insertHTML', false, cleaned);
    } else if (text) {
      const lines = text.split('\n');
      const htmlText = lines
        .map(line => {
          if (line.trim() === '') return '<br>';
          const div = document.createElement('div');
          div.textContent = line;
          return `<p>${div.innerHTML}</p>`;
        })
        .join('');
      document.execCommand('insertHTML', false, htmlText);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Управление шаблонами</h2>
            <p className="text-sm text-gray-500 mt-1">
              Всего шаблонов: {templates.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add new template */}
          {isAdding && (
            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
              <h3 className="font-medium text-gray-800 mb-3">Новый шаблон</h3>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Название шаблона"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 mb-3"
                autoFocus
              />
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">Содержимое (поддерживается форматирование, вставка картинок через Ctrl+V):</p>
                <div className="bg-white border border-gray-200 rounded-lg p-1">
                  <div className="flex gap-1 px-2 py-1 border-b border-gray-100">
                    <button
                      onClick={() => document.execCommand('bold', false)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 font-bold text-sm"
                    >
                      B
                    </button>
                    <button
                      onClick={() => document.execCommand('italic', false)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 italic text-sm"
                    >
                      I
                    </button>
                    <button
                      onClick={() => document.execCommand('underline', false)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 underline text-sm"
                    >
                      U
                    </button>
                    <div className="w-px h-5 bg-gray-200 mx-1 self-center"></div>
                    <button
                      onClick={() => document.execCommand('insertUnorderedList', false)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => document.execCommand('insertOrderedList', false)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                  <div
                    ref={editorRef}
                    contentEditable
                    onPaste={handleEditorPaste}
                    className="min-h-[120px] max-h-[250px] overflow-y-auto px-3 py-2 text-sm text-gray-800 focus:outline-none prose prose-sm max-w-none"
                    style={{ lineHeight: '1.6' }}
                    suppressContentEditableWarning
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNew}
                  disabled={!newTitle.trim()}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Сохранить шаблон
                </button>
                <button
                  onClick={handleCancelAdd}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {/* Edit template */}
          {editingId && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h3 className="font-medium text-gray-800 mb-3">Редактирование шаблона</h3>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Название шаблона"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-200 mb-3"
                autoFocus
              />
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">Содержимое:</p>
                <div className="bg-white border border-gray-200 rounded-lg p-1">
                  <div className="flex gap-1 px-2 py-1 border-b border-gray-100">
                    <button
                      onClick={() => document.execCommand('bold', false)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 font-bold text-sm"
                    >
                      B
                    </button>
                    <button
                      onClick={() => document.execCommand('italic', false)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 italic text-sm"
                    >
                      I
                    </button>
                    <button
                      onClick={() => document.execCommand('underline', false)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 underline text-sm"
                    >
                      U
                    </button>
                    <div className="w-px h-5 bg-gray-200 mx-1 self-center"></div>
                    <button
                      onClick={() => document.execCommand('insertUnorderedList', false)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => document.execCommand('insertOrderedList', false)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                  <div
                    contentEditable
                    onPaste={handleEditorPaste}
                    className="min-h-[120px] max-h-[250px] overflow-y-auto px-3 py-2 text-sm text-gray-800 focus:outline-none prose prose-sm max-w-none"
                    style={{ lineHeight: '1.6' }}
                    dangerouslySetInnerHTML={{ __html: editContent }}
                    onInput={(e) => setEditContent((e.target as HTMLDivElement).innerHTML)}
                    suppressContentEditableWarning
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={!editTitle.trim()}
                  className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Сохранить изменения
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {/* Templates list */}
          {templates.length === 0 && !isAdding ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">Нет шаблонов</p>
              <p className="text-xs mt-1">Создайте первый шаблон</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800">{template.title}</h4>
                      <div
                        className="text-sm text-gray-600 mt-1 message-content prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: template.content }}
                      />
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>Создан: {template.createdByName}</span>
                        <span>•</span>
                        <span>{formatFullDate(template.createdAt)}</span>
                        {template.updatedAt && (
                          <>
                            <span>•</span>
                            <span>Обновлён: {formatFullDate(template.updatedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleStartEdit(template)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-100 text-gray-500 hover:text-amber-600 transition-colors"
                        title="Редактировать"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Удалить шаблон «${template.title}»?`)) {
                            onDeleteTemplate(template.id);
                          }
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
                        title="Удалить"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between shrink-0">
          <button
            onClick={handleStartAdd}
            disabled={isAdding || !!editingId}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить шаблон
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
