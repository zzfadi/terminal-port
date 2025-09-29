import React, { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [wasMaximizedBeforeMinimize, setWasMaximizedBeforeMinimize] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isTransitioningToNormal, setIsTransitioningToNormal] = useState(false);
  // Window position and size state
  const [windowState, setWindowState] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 - 460 : 100,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 - 300 : 100,
    width: 920,
    height: 600
  });
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

  // Focus input on load and setup global keyboard listeners
  useEffect(() => {
    inputRef.current?.focus();

    // Global keyboard handler for Ctrl+L
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        setMessages([]);
        if (geminiClient) {
          geminiClient.clearHistory();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [geminiClient]);

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
    // Tab handling for focus management
    if (e.key === 'Tab') {
      e.preventDefault();
      // Simple focus cycle: input -> close -> minimize -> maximize -> input
      const focusableElements = [
        inputRef.current,
        document.querySelector('.control.close'),
        document.querySelector('.control.minimize'),
        document.querySelector('.control.maximize')
      ].filter(Boolean) as HTMLElement[];

      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
      const nextIndex = (currentIndex + 1) % focusableElements.length;
      focusableElements[nextIndex]?.focus();
    }
  };

  // Window control handlers
  const handleClose = () => {
    setMessages([]);
    if (geminiClient) {
      geminiClient.clearHistory();
    }
    // Close always resets to normal state
    setIsMaximized(false);
    setWasMaximizedBeforeMinimize(false);
    setIsTransitioningToNormal(false);
    setIsMinimized(true);
  };

  const handleMinimize = () => {
    // Remember maximized state before minimizing
    setWasMaximizedBeforeMinimize(isMaximized);
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    const newMaximizedState = !isMaximized;

    // If going from maximized to normal, trigger transition animation
    if (isMaximized && !newMaximizedState) {
      setIsTransitioningToNormal(true);
      // Remove transition class after animation completes
      setTimeout(() => {
        setIsTransitioningToNormal(false);
      }, 300); // Match CSS animation duration
      // Restore previous size
      setWindowState({
        x: window.innerWidth / 2 - 460,
        y: window.innerHeight / 2 - 300,
        width: 920,
        height: 600
      });
    } else if (!isMaximized && newMaximizedState) {
      // Maximize to full window
      setWindowState({
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    setIsMaximized(newMaximizedState);
  };

  const handleRestore = () => {
    setIsRestoring(true);
    setIsMinimized(false);
    // Restore previous maximized state
    setIsMaximized(wasMaximizedBeforeMinimize);
    setWasMaximizedBeforeMinimize(false); // Clear the memory

    // Remove restoring class after animation completes
    setTimeout(() => {
      setIsRestoring(false);
      // Re-focus input after restore animation
      inputRef.current?.focus();
    }, 500);
  };


  return (
    <>
      {/* Minimized Dock Button */}
      {isMinimized && (
        <div className="dock-button" onClick={handleRestore}>
          <div className="dock-icon">⚡</div>
          <div className="dock-label">Terminal</div>
        </div>
      )}

      {/* Terminal Window with React-RND */}
      {!isMinimized && (
        <Rnd
          position={{ x: windowState.x, y: windowState.y }}
          size={{ width: windowState.width, height: windowState.height }}
          onDragStop={(e, d) => {
            setWindowState(prev => ({ ...prev, x: d.x, y: d.y }));
          }}
          onResizeStop={(e, direction, ref, delta, position) => {
            setWindowState({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height),
              ...position
            });
          }}
          minWidth={400}
          minHeight={300}
          bounds="window"
          dragHandleClassName="terminal-header"
          disableDragging={isMaximized}
          enableResizing={!isMaximized}
        >
        <div className={`terminal-container ${isMaximized ? 'maximized' : ''} ${isRestoring ? 'restoring' : ''} ${isTransitioningToNormal ? 'transitioning-to-normal' : ''}`}>
        <div
          className="terminal-header"
          style={{ touchAction: 'none' }}
        >
          <div className="terminal-controls">
            <span
              className="control close"
              onClick={handleClose}
              tabIndex={0}
              role="button"
              aria-label="Close terminal"
              onKeyDown={(e) => e.key === 'Enter' && handleClose()}
            ></span>
            <span
              className="control minimize"
              onClick={handleMinimize}
              tabIndex={0}
              role="button"
              aria-label="Minimize terminal"
              onKeyDown={(e) => e.key === 'Enter' && handleMinimize()}
            ></span>
            <span
              className="control maximize"
              onClick={handleMaximize}
              tabIndex={0}
              role="button"
              aria-label={isMaximized ? 'Restore window size' : 'Maximize window'}
              onKeyDown={(e) => e.key === 'Enter' && handleMaximize()}
            ></span>
          </div>
          <div className="terminal-title">
            <span className="terminal-icon">⚡</span>
            fadi@zuabi:~$ AI Terminal
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
              aria-label="Terminal input"
            />
            <span className={`cursor ${input ? '' : 'blink'}`}>█</span>
          </div>
        </form>
      </div>

        <div className="terminal-footer">
          <span className="status">Connected to Gemini AI | Type your question | Ctrl+L to clear</span>
        </div>
        </div>
        </Rnd>
      )}
    </>
  );
}