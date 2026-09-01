// HTTP client that proxies requests through parent loader via postMessage
export class ProxyHttpClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.requestId = 0;
    this.pendingRequests = new Map();

    // Listen for API responses from parent
    window.addEventListener('message', (event) => {
      if (event.data.type === 'API_RESPONSE') {
        const pending = this.pendingRequests.get(event.data.requestId);
        if (pending) {
          this.pendingRequests.delete(event.data.requestId);

          if (event.data.ok) {
            pending.resolve(event.data.data);
          } else {
            const errorMsg = event.data.error || event.data.data || `Request failed with status ${event.data.status}`;
            pending.reject(new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)));
          }
        }
      }
    });
  }

  async request(method, path, options = {}) {
    const requestId = ++this.requestId;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      // Send API request to parent loader
      window.parent.postMessage({
        type: 'API_REQUEST',
        requestId,
        path,
        method,
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

  async get(path, options) {
    return this.request('GET', path, options);
  }

  async post(path, body, options) {
    return this.request('POST', path, { ...options, body });
  }

  async put(path, body, options) {
    return this.request('PUT', path, { ...options, body });
  }

  async patch(path, body, options) {
    return this.request('PATCH', path, { ...options, body });
  }

  async delete(path, options) {
    return this.request('DELETE', path, options);
  }
}
