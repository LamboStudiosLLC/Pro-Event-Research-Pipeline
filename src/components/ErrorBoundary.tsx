import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught app error:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-slate-200">
          <div className="glass max-w-md w-full p-8 rounded-3xl text-center glow-primary border border-red-500/30">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-500/10 rounded-2xl">
                <AlertTriangle className="h-12 w-12 text-red-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2 tracking-tight text-white">Something went wrong</h1>
            <p className="text-gray-400 text-sm mb-6">
              The application encountered a runtime error or cached asset mismatch.
            </p>
            {this.state.error && (
              <div className="bg-slate-950/60 p-3 rounded-xl text-xs font-mono text-red-300 text-left mb-6 overflow-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Cache & Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
