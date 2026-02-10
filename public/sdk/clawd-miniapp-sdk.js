/**
 * ClawdOS Mini App SDK v1.0
 * Lightweight SDK for building ClawdOS mini applications.
 *
 * Usage:
 *   <script src="https://clawdos.com/sdk/clawd-miniapp-sdk.js"></script>
 *   <script>
 *     clawd.ready();
 *     const ctx = await clawd.getContext();
 *     console.log(ctx.user.wallet);
 *   </script>
 */
(function () {
  'use strict';

  if (typeof window === 'undefined') return;
  if (window.clawd) return; // Already loaded

  var _contextCallbacks = [];
  var _contextUpdateListeners = [];
  var _currentContext = null;
  var _isReady = false;

  function sendMessage(type, payload) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: type, payload: payload || {} }, '*');
    }
  }

  // Listen for messages from ClawdOS host
  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || typeof data.type !== 'string') return;

    switch (data.type) {
      case 'clawd:context_response':
        _currentContext = data.payload || null;
        // Resolve pending getContext promises
        var cbs = _contextCallbacks.slice();
        _contextCallbacks = [];
        cbs.forEach(function (cb) { cb(_currentContext); });
        break;

      case 'clawd:context_update':
        _currentContext = data.payload || null;
        _contextUpdateListeners.forEach(function (cb) {
          try { cb(_currentContext); } catch (e) { console.error('Context update listener error:', e); }
        });
        break;
    }
  });

  window.clawd = {
    /**
     * Signal that the app is loaded and ready.
     * Call this as early as possible.
     */
    ready: function () {
      if (_isReady) return;
      _isReady = true;
      sendMessage('clawd:ready');
    },

    /**
     * Close the mini app window.
     */
    close: function () {
      sendMessage('clawd:close');
    },

    /**
     * Get the current user context (wallet, name, app info).
     * Returns a Promise that resolves with the context object.
     */
    getContext: function () {
      return new Promise(function (resolve) {
        if (_currentContext) {
          resolve(_currentContext);
          return;
        }
        _contextCallbacks.push(resolve);
        sendMessage('clawd:get_context');
      });
    },

    /**
     * Listen for context updates (e.g. wallet changes).
     * @param {Function} callback - Called with new context on each update
     */
    onContextUpdate: function (callback) {
      if (typeof callback === 'function') {
        _contextUpdateListeners.push(callback);
      }
    },

    /**
     * Set the window title.
     * @param {string} title - New window title
     */
    setTitle: function (title) {
      sendMessage('clawd:set_title', { title: String(title) });
    },

    /**
     * Open an external URL in a new tab.
     * @param {string} url - URL to open
     */
    openUrl: function (url) {
      sendMessage('clawd:open_url', { url: String(url) });
    },

    /**
     * Show a toast notification in ClawdOS.
     * @param {string} message - Toast message
     */
    showToast: function (message) {
      sendMessage('clawd:show_toast', { message: String(message) });
    }
  };

  // Auto-signal ready if document is already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // App should still call clawd.ready() explicitly
  }
})();
