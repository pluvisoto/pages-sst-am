import React from 'react';

const CHUNK_RELOAD_KEY = 'am_chunk_reload_attempted';

const isChunkLoadError = (error) => {
  const message = String(error?.message || error || '').toLowerCase();
  return message.includes('failed to fetch dynamically imported module')
    || message.includes('importing a module script failed')
    || message.includes('error loading dynamically imported module');
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);

    if (typeof window !== 'undefined' && isChunkLoadError(error)) {
      const alreadyRetried = window.sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1';

      if (!alreadyRetried) {
        window.sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
        window.location.reload();
        return;
      }
    }

    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const chunkError = isChunkLoadError(this.state.error);
      if (typeof window !== 'undefined' && !chunkError) {
        window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      }

      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
          <h1>Algo deu errado.</h1>
          {chunkError && (
            <div style={{ marginBottom: '1rem', color: '#d1d5db', lineHeight: 1.5 }}>
              Houve uma atualização do sistema e esta página ficou com arquivos antigos em cache.
              <div style={{ marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
                      window.location.reload();
                    }
                  }}
                  style={{
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Atualizar página
                </button>
              </div>
            </div>
          )}
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
