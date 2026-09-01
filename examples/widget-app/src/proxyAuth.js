// Proxy auth that makes API calls via postMessage to parent loader
export class ProxyAuth {
  constructor() {
    this.requestId = 0;
    this.pendingRequests = new Map();

    window.addEventListener('message', (event) => {
      if (event.data.type === 'API_RESPONSE') {
        const resolve = this.pendingRequests.get(event.data.requestId);
        if (resolve) {
          this.pendingRequests.delete(event.data.requestId);
          resolve(event.data);
        }
      }
    });
  }

  async fetch(path, options = {}) {
    const requestId = ++this.requestId;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, resolve);

      window.parent.postMessage({
        type: 'API_REQUEST',
        requestId,
        path,
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body,
        contentType: options.contentType
      }, '*');

      // Timeout after 30s
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  async getToken() {
    // Not used - parent handles auth
    return null;
  }
}
