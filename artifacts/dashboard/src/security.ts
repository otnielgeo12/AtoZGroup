export const initSecurity = () => {
  // Only apply in production mode to avoid breaking local development
  if (import.meta.env.MODE !== 'production') {
    return;
  }
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // 2. Disable Developer Shortcuts (F12, Ctrl+Shift+I/J, Ctrl+U, Meta+Alt+I/J)
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      e.keyCode === 123 ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) ||
      (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) ||
      (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) ||
      (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) ||
      (e.metaKey && e.altKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) ||
      (e.metaKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85))
    ) {
      e.preventDefault();
      // Wipe body if they attempt shortcut
      document.body.innerHTML = '';
    }
  });

  // 3. Prevent Dragging of Images
  document.addEventListener('dragstart', (e) => {
    if ((e.target as HTMLElement).tagName === 'IMG') {
      e.preventDefault();
    }
  });

  // 4. Anti-Debugging Loop & Immediate DOM Wipe
  const wipeEverything = () => {
    document.head.innerHTML = '';
    document.body.innerHTML = '<div style="background:#000;color:#000;width:100vw;height:100vh;position:fixed;top:0;left:0;z-index:99999;"></div>';
    window.location.replace('about:blank');
  };

  const blockDevTools = () => {
    try {
      (function () {
        return false;
      })
      ['constructor']('debugger')
      ['call']();
    } catch (err) {}
  };

  setInterval(() => {
    const start = performance.now();
    blockDevTools();
    const end = performance.now();
    
    // If the debugger paused execution, the time difference will be > 100ms
    if (end - start > 100) {
      wipeEverything();
    }
  }, 1000);

  // 5. Clear Console Output
  const noop = () => {};
  window.console.log = noop;
  window.console.warn = noop;
  window.console.info = noop;
  window.console.debug = noop;
  window.console.error = noop;
  window.console.dir = noop;
  window.console.table = noop;
};
