import { Component, ErrorInfo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// This is needed to access navigate outside of React components
const NavigateButton = ({ to, children }: { to: string; children: ReactNode }) => {
  const navigate = useNavigate();
  return (
    <Button variant="outline" size="sm" onClick={() => navigate(to)} className="ml-2">
      {children}
    </Button>
  );
};

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-screen flex-col items-center justify-center p-4">
          <div className="my-4 w-full max-w-md rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">Something went wrong</h3>
                <p className="mt-1 text-sm break-words text-muted-foreground">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => this.setState({ hasError: false, error: null })}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> Try again
                  </Button>
                  <NavigateButton to="/">
                    <Home className="mr-2 h-4 w-4" /> Go home
                  </NavigateButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
