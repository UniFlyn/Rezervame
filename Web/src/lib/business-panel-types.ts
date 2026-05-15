export type PanelDashboard = {
  businessName: string;
  period: 'day' | 'week' | 'month';
  periodLabel: string;
  kpis: {
    revenue: number;
    revenueDeltaPct: number;
    revenueMonthCurrent: number;
    revenueMonthPrevious: number;
    bookings: number;
    bookingsDeltaPct: number;
    bookingsThisMonth: number;
    bookingsLastMonth: number;
    pending: number;
    pendingDeltaPct: number;
    pendingThisMonth: number;
    pendingLastMonth: number;
    uniqueClients: number;
    clientsDeltaPct: number;
    clientsThisMonth: number;
    clientsLastMonth: number;
  };
  chart: { name: string; bookings: number; revenue: number }[];
  topServices: { name: string; count: number }[];
  recentBookings: { id: string; customerName: string; date: string; status: string }[];
};

export type PanelMenuPayload = {
  items: { id: string; href: string; label: string; icon: string }[];
  categoryKeys: string[];
};

export type PanelCustomerRow = {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  totalSpent: number;
  bookingsCount: number;
  lastVisit: string;
  memberSince: string;
};
