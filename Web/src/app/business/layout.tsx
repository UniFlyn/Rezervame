import { BusinessPanelProviders } from '../../components/business/BusinessPanelProviders';
import { RouteGuard } from '../../components/business/layout/RouteGuard';

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessPanelProviders>
      <RouteGuard>{children}</RouteGuard>
    </BusinessPanelProviders>
  );
}
