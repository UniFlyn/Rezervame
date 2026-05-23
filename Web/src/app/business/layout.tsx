import { BusinessPanelProviders } from '../../components/business/BusinessPanelProviders';
import { RouteGuard } from '../../components/business/layout/RouteGuard';
import { BusinessWebPushManager } from '../../components/BusinessWebPushManager';

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessPanelProviders>
      <RouteGuard>
        <BusinessWebPushManager />
        {children}
      </RouteGuard>
    </BusinessPanelProviders>
  );
}
