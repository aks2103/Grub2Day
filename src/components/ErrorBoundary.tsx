import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
    console.error('Grub2Day ErrorBoundary caught:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-orange-50/80 rounded-2xl border border-orange-200 text-center my-4 max-w-md mx-auto shadow-sm">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl shadow-xs">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-sm font-black text-slate-900 mb-1">
            {this.props.fallbackTitle || 'Something went wrong loading this section'}
          </h3>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Don't worry, your meal plan and food choices are safe.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
