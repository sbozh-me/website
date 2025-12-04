"use client";

import { Component } from "react";

import type { ErrorInfo, ReactNode } from "react";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for PMDXJS components
 *
 * Catches rendering errors and displays a fallback UI
 */
export class PMDXJSErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props;

      if (typeof fallback === "function") {
        return fallback(this.state.error);
      }

      if (fallback) {
        return fallback;
      }

      return (
        <div className="pmdxjs-error rounded border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Rendering Error</p>
          <p className="mt-1 text-sm">{this.state.error.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
