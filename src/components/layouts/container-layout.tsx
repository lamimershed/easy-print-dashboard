import React from 'react';
import { BreadcrumbItemType, BreadcrumbNav } from '../common/breadcrumb';
// import { Bell } from 'lucide-react';

type Props = {
  heading: string;
  subtitle?: string;
  children: React.ReactNode;
  utilMenu?: React.ReactNode;
  breadcrumbItems: BreadcrumbItemType[];
};

const Containerlayout = ({ children, heading, subtitle, breadcrumbItems, utilMenu }: Props) => {
  return (
    <div className="flex h-full w-full flex-col rounded-sm bg-card px-3 py-3 sm:px-4 sm:pt-3 sm:pb-4">
      <div className="flex h-full w-full flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-border">
          <div className="flex items-center justify-start gap-2 pb-2 sm:gap-4">
            <div className="overflow-hidden sm:mx-2">
              <h1 className="text-md sm:text-mc truncate font-medium">{heading}</h1>
              {subtitle && <p className="text-xs text-muted-foreground sm:text-sm">{subtitle}</p>}
              <div className="hidden sm:block">
                <BreadcrumbNav items={breadcrumbItems ?? []} />
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-2 pr-2 sm:gap-4 sm:px-4">
            <div className="flex items-center gap-2">{utilMenu}</div>
            {/* might use after some time */}
            {/* <div className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-destructive" />
            </div> */}
          </div>
        </div>
        <div className="mt-2 min-h-0 flex-1 overflow-auto bg-background pb-4 sm:p-4 sm:pb-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Containerlayout;
