import React, { Component } from 'react';
import { ShieldAlert } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center gap-4">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mb-2 animate-bounce">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Something went wrong</h1>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed">
            The application encountered an unexpected runtime error. We have logged the incident and are investigating.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-premium bg-mint-500 hover:bg-mint-600 text-white rounded-full py-3 px-6 mt-4 font-bold text-xs shadow-md shadow-mint-500/10"
          >
            Reload Restaurant Workspace
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
