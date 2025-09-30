import React, { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { GeminiClient } from './GeminiClient';
import DOMPurify from 'dompurify';
import {
  X,
  Copy,
  Download,
  ZoomIn,
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  imageData?: string;      // Base64 image data
  imageMimeType?: string;  // MIME type (image/png, image/jpeg, etc.)
  timestamp: Date;
}

export function Terminal() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [geminiClient, setGeminiClient] = useState<GeminiClient | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [wasMaximized, setWasMaximized] = useState(false);
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

  // State for the modal
  const [modalImage, setModalImage] = useState<{ 
    src: string; 
    alt: string;
    context?: string;
  } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

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

  // Modal keyboard handler and focus management
  useEffect(() => {
    if (modalImage) {
      // Focus first button when modal opens
      setTimeout(() => firstButtonRef.current?.focus(), 100);
      
      const handleModalKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeModal();
        }
      };

      window.addEventListener('keydown', handleModalKeyDown);
      return () => window.removeEventListener('keydown', handleModalKeyDown);
    }
    return undefined;
  }, [modalImage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

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

    // Check if Gemini client is available
    if (!geminiClient) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Error: Cannot process request. Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.',
        timestamp: new Date()
      }]);
      return;
    }

    // Show loading state
    setIsLoading(true);

    try {
      // Get AI response (now includes optional image data)
      const response = await geminiClient.sendMessage(userMessage);

      // Add AI response with typing effect
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.text,
        imageData: response.imageData,
        imageMimeType: response.imageMimeType,
        timestamp: new Date()
      };

      // Check if response contains HTML code blocks - skip typing animation for large code blocks
      const hasHTMLBlock = /```html[\s\S]*```/i.test(response.text);

      if (hasHTMLBlock) {
        // Show full response immediately for HTML content (typing animation too slow for code)
        setMessages(prev => [...prev, aiMsg]);
      } else {
        // Simulate typing effect for regular text
        setMessages(prev => [...prev, { ...aiMsg, content: '' }]);

        let displayedText = '';
        const words = response.text.split(' ');

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
    setWasMaximized(false);
    setIsTransitioningToNormal(false);
    setIsMinimized(true);
  };

  const handleMinimize = () => {
    // Remember maximized state before minimizing
    setWasMaximized(isMaximized);
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
    setIsMaximized(wasMaximized);
    setWasMaximized(false); // Clear the memory

    // Remove restoring class after animation completes
    setTimeout(() => {
      setIsRestoring(false);
      // Re-focus input after restore animation
      inputRef.current?.focus();
    }, 500);
  };

  const handleImageClick = (msg: Message) => {
    if (msg.imageData && msg.imageMimeType) {
      // Generate contextual alt text from the message content
      const contextualAlt = msg.content 
        ? `AI generated image: ${msg.content.substring(0, 100)}...`
        : 'AI generated content';
      
      setModalImage({
        src: `data:${msg.imageMimeType};base64,${msg.imageData}`,
        alt: contextualAlt,
        context: msg.content,
      });
      setImageLoading(true);
      setImageError(false);
    }
  };

  const closeModal = () => {
    setModalImage(null);
    setImageLoading(true);
    setImageError(false);
    inputRef.current?.focus(); // Return focus to input
  };

  const handleDownload = async () => {
    if (!modalImage) return;
    setIsDownloading(true);
    
    try {
      const link = document.createElement('a');
      link.href = modalImage.src;
      link.download = `fadi-portfolio-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = async () => {
    if (!modalImage) return;
    setIsCopying(true);
    
    try {
      const response = await fetch(modalImage.src);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
    } catch (error) {
      console.error('Copy failed:', error);
      // Fallback: copy the data URL as text
      try {
        await navigator.clipboard.writeText(modalImage.src);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
    } finally {
      setIsCopying(false);
    }
  };

  const handleZoom = () => {
    if (!modalImage) return;
    // Open image in new tab for native browser zoom
    const win = window.open();
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Image Viewer</title>
            <style>
              body { margin: 0; background: #000; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
              img { max-width: 100%; max-height: 100vh; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${modalImage.src}" alt="${modalImage.alt}" />
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const formatAIResponse = (content: string) => {
    // Basic formatting: bold for important terms, links as clickable
    const formatted = content
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>') // Bold
      .replace(/__(.*?)__/g, '<em>$1</em>') // Italics
      .replace(/`(.*?)`/g, '<code>$1</code>') // Inline code
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" />') // Images
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'); // Links

    // Sanitize HTML to prevent XSS attacks
    return DOMPurify.sanitize(formatted, {
      ALLOWED_TAGS: ['strong', 'em', 'code', 'a', 'img'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt'],
      ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i  // Block javascript:, data:, etc.
    });
  };

  const extractHTML = (content: string): string | null => {
    // Detect HTML code blocks: ```html...``` or raw <html>...</html>
    const codeBlockMatch = content.match(/```html\n([\s\S]*?)```/i);
    if (codeBlockMatch) {
      const html = codeBlockMatch[1].trim();
      // Inject CSP meta tag to allow inline scripts if not already present
      if (html.includes('<head>') && !html.includes('Content-Security-Policy')) {
        return html.replace('<head>', '<head>\n<meta http-equiv="Content-Security-Policy" content="script-src \'unsafe-inline\'; style-src \'unsafe-inline\';">');
      }
      return html;
    }

    const htmlTagMatch = content.match(/<html[\s\S]*<\/html>/i);
    if (htmlTagMatch) {
      const html = htmlTagMatch[0];
      // Inject CSP meta tag if not already present
      if (html.includes('<head>') && !html.includes('Content-Security-Policy')) {
        return html.replace('<head>', '<head>\n<meta http-equiv="Content-Security-Policy" content="script-src \'unsafe-inline\'; style-src \'unsafe-inline\';">');
      }
      return html;
    }

    return null;
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
          onDragStop={(_e, d) => {
            setWindowState(prev => ({ ...prev, x: d.x, y: d.y }));
          }}
          onResizeStop={(_e, _direction, ref, _delta, position) => {
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
        <div className="terminal-header">
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
              <div className="message-wrapper">
                <span
                  className="content"
                  dangerouslySetInnerHTML={{
                    __html:
                      msg.type === 'ai'
                        ? formatAIResponse(msg.content)
                        : msg.content,
                  }}
                />
                {msg.imageData && msg.imageMimeType && (
                  <img
                    src={`data:${msg.imageMimeType};base64,${msg.imageData}`}
                    alt="AI generated content"
                    className="terminal-image"
                    onClick={() => handleImageClick(msg)}
                  />
                )}
                {msg.type === 'ai' && extractHTML(msg.content) && (
                  <iframe
                    srcDoc={extractHTML(msg.content)!}
                    className="terminal-html-preview"
                    sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
                    title="HTML Preview"
                  />
                )}
              </div>
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

      {modalImage && (
        <div 
          className="image-modal-overlay" 
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <div 
            ref={modalRef}
            className="image-modal-content" 
            onClick={(e) => e.stopPropagation()}
          >
            {imageLoading && (
              <div className="image-loading-skeleton" aria-live="polite">
                <div className="skeleton-shimmer"></div>
                <span className="sr-only">Loading image...</span>
              </div>
            )}
            
            {imageError ? (
              <div className="image-error" role="alert">
                <span className="error-icon">⚠️</span>
                <p>Failed to load image</p>
              </div>
            ) : (
              <img 
                src={modalImage.src} 
                alt={modalImage.alt} 
                className="modal-image"
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{ display: imageLoading ? 'none' : 'block' }}
              />
            )}
            
            <div className="modal-toolbar" role="toolbar" aria-label="Image actions">
              <button 
                ref={firstButtonRef}
                title="Download image"
                onClick={handleDownload}
                disabled={isDownloading || imageError}
                aria-label="Download image"
              >
                {isDownloading ? (
                  <span className="spinner">⟳</span>
                ) : (
                  <Download size={18} />
                )}
              </button>
              <button 
                title="Copy to clipboard"
                onClick={handleCopy}
                disabled={isCopying || imageError}
                aria-label="Copy image to clipboard"
              >
                {isCopying ? (
                  <span className="spinner">⟳</span>
                ) : (
                  <Copy size={18} />
                )}
              </button>
              <button 
                title="Open in new tab"
                onClick={handleZoom}
                disabled={imageError}
                aria-label="Open image in new tab for zoom"
              >
                <ZoomIn size={18} />
              </button>
              <button 
                title="Close (ESC)"
                onClick={closeModal}
                aria-label="Close image viewer"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}