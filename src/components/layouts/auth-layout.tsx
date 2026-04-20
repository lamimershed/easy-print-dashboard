import type { ReactNode } from 'react';

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center p-4 md:p-8">
      {/* Background decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[80%] w-full rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -right-[5%] -bottom-[10%] h-[60%] w-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-xl shadow-2xl shadow-foreground/5 lg:grid-cols-12">
        {/* Left: Brand Panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 lg:col-span-5 lg:flex">
          {/* Brand name */}
          <div className="relative z-10">
            <div className="mb-16 text-2xl font-extrabold tracking-tight text-primary-foreground italic">
              Easy Print
            </div>
            <h1 className="text-6xl leading-[1.1] font-extrabold tracking-tighter text-primary-foreground">
              Crafting your <span className="text-primary-foreground/70">print business,</span>{' '}
              digitally.
            </h1>
            <p className="mt-8 max-w-sm text-lg leading-relaxed text-primary-foreground/80">
              Join print shop owners who manage their customers, analytics and print queues from one
              powerful dashboard.
            </p>
          </div>

          {/* Decorative shapes */}
          <div className="absolute right-0 bottom-0 h-1/2 w-full translate-x-1/4 translate-y-1/4 opacity-30">
            <div className="absolute inset-0 -rotate-12 rounded-lg bg-white/10" />
            <div className="absolute inset-0 -rotate-6 rounded-lg bg-primary-foreground/10" />
            <div className="absolute inset-0 rotate-3 rounded-lg bg-white/5" />
          </div>

          {/* Footer badge */}
          <div className="relative z-10 flex items-center gap-4">
            <div className="h-px w-12 bg-primary-foreground/30" />
            <span className="text-[10px] font-bold tracking-widest text-primary-foreground/60 uppercase">
              Est. 2024
            </span>
          </div>
        </div>

        {/* Right: Form Panel */}
        <div className="flex h-full flex-col justify-center overflow-y-auto bg-background p-8 md:p-6 lg:col-span-7">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
      </div>
    </main>
  );
}
