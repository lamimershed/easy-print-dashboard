import { useNavigate } from 'react-router-dom';
import { PrimaryButton } from '../common';
import { Button } from '../ui';
import { ArrowLeft } from 'lucide-react';

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/5 px-4">
      <div className="flex h-full min-h-[500px] flex-col items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-secondary/20 bg-background p-10 text-center shadow-sm">
          <div className="mb-5 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-secondary/10 bg-secondary/5">
              <svg
                className="h-8 w-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="mb-3 flex justify-center">
            <span className="rounded-full border border-secondary/15 bg-secondary/5 px-4 py-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Error 404
            </span>
          </div>

          <h1 className="mb-3 text-2xl font-bold text-foreground">Page Not Found</h1>
          <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
            Oops! The page you're looking for doesn't exist or may have been moved. Double-check the
            URL or head back home.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant={'outline'} onClick={() => navigate(-1)}>
              <ArrowLeft /> Go Back
            </Button>
            <PrimaryButton onClick={() => navigate('/')}>Back to Home</PrimaryButton>
          </div>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          If you think this is a mistake, please contact support.
        </p>
      </div>
    </div>
  );
}

export default NotFoundPage;
