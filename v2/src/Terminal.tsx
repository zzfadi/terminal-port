import React, { useState, useEffect, useRef } from 'react';
import { GeminiClient } from './GeminiClient';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
}

export function Terminal() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [geminiClient, setGeminiClient] = useState<GeminiClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Gemini client
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey && !apiKey.includes('your_')) {
      setGeminiClient(new GeminiClient(apiKey));
    } else {
      setMessages([{
        id: '0',
        type: 'system',
        content: 'Error: Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.',
        timestamp: new Date()
      }]);
    }

    // Add welcome message
    setMessages(prev => [...prev, {
      id: '1',
      type: 'system',
      content: 'Welcome to Fadi\'s AI Terminal. I can answer questions about his experience, skills, and projects.\n\nTry asking: "What is Fadi\'s experience with firmware development?" or "Tell me about his AI projects"',
      timestamp: new Date()
    }]);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !geminiClient) return;

    const userMessage = input;
    setInput('');

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    // Show loading state
    setIsLoading(true);

    try {
      // Get AI response
      const response = await geminiClient.sendMessage(userMessage);

      // Add AI response with typing effect
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response,
        timestamp: new Date()
      };

      // Simulate typing effect
      setMessages(prev => [...prev, { ...aiMsg, content: '' }]);

      let displayedText = '';
      const words = response.split(' ');

      for (let i = 0; i < words.length; i++) {
        displayedText += (i === 0 ? '' : ' ') + words[i];
        const currentText = displayedText;

        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { ...aiMsg, content: currentText };
          return newMessages;
        });

        // Small delay between words for typing effect
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Error: Failed to get response. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Add command history navigation later if needed
    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setMessages([]);
      if (geminiClient) {
        geminiClient.clearHistory();
      }
    }
  };

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="terminal-title">
          <span className="terminal-icon">⚡</span>
          fadi@zuabi:~$ AI Terminal
        </div>
        <div className="terminal-controls">
          <span className="control minimize"></span>
          <span className="control maximize"></span>
          <span className="control close"></span>
        </div>
      </div>

      <div className="terminal-body">
        <div className="messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message message-${msg.type}`}>
              <span className="prompt">
                {msg.type === 'user' ? '> ' :
                 msg.type === 'ai' ? '$ ' :
                 '# '}
              </span>
              <span className="content">{msg.content}</span>
            </div>
          ))}
          {isLoading && (
            <div className="message message-loading">
              <span className="prompt">$ </span>
              <span className="loading-dots">
                <span>.</span><span>.</span><span>.</span>
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="input-form">
          <div className="input-line">
            <span className="input-prompt">&gt; </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="terminal-input"
              placeholder="Ask about Fadi's experience, skills, or projects..."
              autoComplete="off"
              spellCheck={false}
            />
            <span className={`cursor ${input ? '' : 'blink'}`}>█</span>
          </div>
        </form>
      </div>

      <div className="terminal-footer">
        <span className="status">Connected to Gemini AI | Type your question | Ctrl+L to clear</span>
      </div>
    </div>
  );
}