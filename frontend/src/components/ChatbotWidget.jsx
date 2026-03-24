import React, { useState, useRef, useEffect } from 'react';
import './ChatbotWidget.css';

const CHATBOT_URL = 'http://localhost:5001';

const TypingDots = () => (
  <div className="cb-typing">
    <span /><span /><span />
  </div>
);

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Xin chào! Tôi là trợ lý tư vấn sinh viên. Bạn có thể hỏi tôi về các quy định, chính sách trong Sổ tay sinh viên.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // null | 'ready' | 'not_ingested' | 'no_ollama'
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      checkHealth();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${CHATBOT_URL}/health`);
      const data = await res.json();
      if (!data.ollama?.ok) setStatus('no_ollama');
      else if (!data.ingested) setStatus('not_ingested');
      else setStatus('ready');
    } catch {
      setStatus('no_ollama');
    }
  };

  const sendMessage = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const res = await fetch(`${CHATBOT_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, history: messages.slice(-6) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Lỗi server');
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${err.message}`, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: 'Xin chào! Bạn có thể hỏi tôi về Sổ tay sinh viên.' }]);
  };

  const SUGGESTIONS = [
    'Quy định học bổng là gì?',
    'Điều kiện xét tốt nghiệp?',
    'Quy trình nghỉ học tạm thời?',
    'Học phí được tính như thế nào?',
  ];

  return (
    <>
      {/* Floating button */}
      <button className={`cb-fab ${open ? 'cb-fab-open' : ''}`} onClick={() => setOpen(o => !o)} title="Trợ lý sinh viên">
        {open ? '✕' : '💬'}
      </button>

      {/* Chat window */}
      {open && (
        <div className="cb-window">
          {/* Header */}
          <div className="cb-header">
            <div className="cb-header-info">
              <div className="cb-avatar">🎓</div>
              <div>
                <div className="cb-title">Trợ lý Sổ tay SV</div>
                <div className={`cb-status-dot ${status === 'ready' ? 'ready' : 'offline'}`}>
                  {status === 'ready' ? '● Online' : status === 'not_ingested' ? '● Chưa nạp dữ liệu' : '● Offline'}
                </div>
              </div>
            </div>
            <button className="cb-clear" onClick={clearChat} title="Xóa lịch sử">🗑</button>
          </div>

          {/* Status warning */}
          {status === 'no_ollama' && (
            <div className="cb-warning">
              ⚠️ Ollama chưa chạy. Hãy chạy: <code>ollama serve</code> và <code>ollama pull qwen2.5:0.5b</code>
            </div>
          )}
          {status === 'not_ingested' && (
            <div className="cb-warning">
              ⚠️ Chưa nạp dữ liệu PDF. Hãy chạy: <code>python ingest.py</code> trong thư mục chatbot
            </div>
          )}

          {/* Messages */}
          <div className="cb-messages">
            {messages.map((m, i) => (
              <div key={i} className={`cb-msg cb-msg-${m.role} ${m.error ? 'cb-msg-error' : ''}`}>
                {m.role === 'assistant' && <div className="cb-msg-avatar">🎓</div>}
                <div className="cb-msg-bubble">{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="cb-msg cb-msg-assistant">
                <div className="cb-msg-avatar">🎓</div>
                <div className="cb-msg-bubble"><TypingDots /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions — chỉ hiện khi chỉ có 1 tin nhắn (lời chào) */}
          {messages.length === 1 && (
            <div className="cb-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="cb-suggestion" onClick={() => { setInput(s); inputRef.current?.focus(); }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="cb-input-row">
            <textarea
              ref={inputRef}
              className="cb-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Nhập câu hỏi... (Enter để gửi)"
              rows={1}
              disabled={loading || status === 'no_ollama'}
            />
            <button className="cb-send" onClick={sendMessage} disabled={!input.trim() || loading || status === 'no_ollama'}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
