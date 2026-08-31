'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo)
  }

  public reset = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 border border-destructive/20 rounded-xl bg-destructive/5 space-y-4 text-center">
          <AlertCircle className="w-10 h-10 text-destructive" />
          <div>
            <h3 className="font-semibold text-lg text-foreground">Something went wrong</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              An error occurred while loading this component.
            </p>
          </div>
          <Button variant="outline" onClick={this.reset} className="mt-2">
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
