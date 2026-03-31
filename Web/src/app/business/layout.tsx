import { RouteGuard } from '../../components/business/layout/RouteGuard';

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      {children}
    </RouteGuard>
  );
}
