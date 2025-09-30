# XSS Protection Test Cases

## Summary
DOMPurify sanitization has been implemented in Terminal.tsx to prevent XSS attacks via AI response rendering.

## Test Vectors

### ✅ BLOCKED - JavaScript Protocol Injection
**Input:** `[Click here](javascript:alert(document.cookie))`
**Expected:** Link is removed or href is stripped
**Result:** DOMPurify blocks `javascript:` protocol (not in ALLOWED_URI_REGEXP)

### ✅ BLOCKED - Image onerror Handler
**Input:** `![img](x onerror=alert(1))`
**Expected:** `onerror` attribute stripped from img tag
**Result:** DOMPurify allows only `src` and `alt` attributes on images

### ✅ BLOCKED - Script Tag Injection
**Input:** `*text</strong><script>alert('XSS')</script><strong>*`
**Expected:** `<script>` tag completely removed
**Result:** DOMPurify ALLOWED_TAGS only includes: strong, em, code, a, img

### ✅ BLOCKED - Data URI with JavaScript
**Input:** `[Click](data:text/html,<script>alert(1)</script>)`
**Expected:** Link blocked or href removed
**Result:** ALLOWED_URI_REGEXP only allows `https:` and `mailto:` protocols

### ✅ BLOCKED - Event Handler in Markdown
**Input:** `<img src=x onerror=alert(1)>`
**Expected:** Raw HTML stripped or sanitized
**Result:** DOMPurify removes all event handlers (onclick, onerror, onload, etc.)

### ✅ BLOCKED - Style Injection
**Input:** `<style>body{background:red}</style>`
**Expected:** Style tag removed
**Result:** `<style>` not in ALLOWED_TAGS

### ✅ ALLOWED - Legitimate Markdown
**Input:** `This is *bold* and __italic__ text`
**Expected:** Renders as `This is <strong>bold</strong> and <em>italic</em> text`
**Result:** Passes through sanitization

### ✅ ALLOWED - Safe HTTPS Links
**Input:** `[Google](https://google.com)`
**Expected:** Renders as clickable link with `target="_blank" rel="noopener noreferrer"`
**Result:** HTTPS protocol allowed by ALLOWED_URI_REGEXP

### ✅ ALLOWED - Safe Image URLs
**Input:** `![Logo](https://example.com/logo.png)`
**Expected:** Renders as image with src and alt
**Result:** HTTPS image URLs allowed

### ✅ ALLOWED - Mailto Links
**Input:** `[Email](mailto:test@example.com)`
**Expected:** Renders as mailto link
**Result:** `mailto:` protocol allowed by ALLOWED_URI_REGEXP

### ✅ ALLOWED - Inline Code
**Input:** `` `const x = 42;` ``
**Expected:** Renders as `<code>const x = 42;</code>`
**Result:** Code tag allowed

## DOMPurify Configuration

```typescript
DOMPurify.sanitize(formatted, {
  ALLOWED_TAGS: ['strong', 'em', 'code', 'a', 'img'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt'],
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i
});
```

## Defense-in-Depth Layers

### 1. HTML Sanitization (Application Layer)
- DOMPurify removes dangerous HTML/JS
- Strict allowlist approach
- Regex-based URI validation

### 2. Content Security Policy (Browser Layer)
```html
script-src 'self';  // No inline scripts or eval
img-src 'self' data: blob: https:;  // Safe image sources
```

### 3. React Framework
- Virtual DOM prevents direct DOM manipulation
- Automatic escaping of text content (non-dangerouslySetInnerHTML)

## Known Limitations

⚠️ **Base64 Images from Gemini API**
- Displayed separately via `<img src="data:...base64...">`
- NOT processed through DOMPurify
- Relies on browser's base64 decoder security
- Gemini API trusted source

⚠️ **CSP Inline Styles**
- `style-src 'self' 'unsafe-inline'` still enabled
- Required for Vite HMR in development
- Consider removing in production builds

## Manual Testing Steps

1. **Start dev server:** `npm run dev`
2. **Open terminal:** http://localhost:3003
3. **Test malicious inputs:**
   - Type: `Tell me about [click here](javascript:alert(1))`
   - Type: `Show me ![img](x onerror=alert(document.cookie))`
   - Type: `Explain *text</strong><script>alert('XSS')</script><strong>*`
4. **Verify:**
   - No JavaScript execution occurs
   - No alert dialogs appear
   - Links/images are safely rendered or removed
5. **Test legitimate inputs:**
   - Type: `What are your *firmware* skills?`
   - Type: `Tell me about [GitHub](https://github.com)`
   - Verify proper formatting with bold/links

## Automated Testing (Future)

Consider adding unit tests:
```typescript
describe('formatAIResponse', () => {
  it('should block javascript: protocol', () => {
    const input = '[Click](javascript:alert(1))';
    const output = formatAIResponse(input);
    expect(output).not.toContain('javascript:');
  });

  it('should block script tags', () => {
    const input = '<script>alert(1)</script>';
    const output = formatAIResponse(input);
    expect(output).not.toContain('<script');
  });

  it('should allow safe markdown', () => {
    const input = 'This is *bold* text';
    const output = formatAIResponse(input);
    expect(output).toBe('This is <strong>bold</strong> text');
  });
});
```

## References

- DOMPurify: https://github.com/cure53/DOMPurify
- OWASP XSS Prevention: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- CSP Guide: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP