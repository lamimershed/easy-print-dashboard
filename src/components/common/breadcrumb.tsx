import { Fragment } from 'react/jsx-runtime';
import { Link } from 'react-router';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Define the breadcrumb item type
export type BreadcrumbItemType = {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
};

interface BreadcrumbNavProps {
  items: BreadcrumbItemType[];
}

export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <Fragment key={`breadcrumb-item-${index}`}>
            {index === 0 && (
              <>
                <BreadcrumbItem>
                  <Link to={`/dashboard`}>Dashboard</Link>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            <BreadcrumbItem key={`breadcrumb-${index}`}>
              {item.isCurrentPage ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : item.href ? (
                <Link to={item.href}>{item.label}</Link>
              ) : (
                <span>{item.label}</span>
              )}
            </BreadcrumbItem>
            {index < items.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
