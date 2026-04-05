import '../models/user_invoice.dart';

/// Mock invoices for Profile → Invoices (replace with API later).
final List<UserInvoice> kMockUserInvoices = [
  UserInvoice(
    id: 'inv-001',
    number: 'RZV-2026-0142',
    venueName: 'Luxe Hair Studio',
    issuedDate: 'Mar 28, 2026',
    subtotal: r'$155.00',
    tax: r'$12.40',
    total: r'$167.40',
    statusKey: 'invoicePaid',
    unsplashId: '1560066984-138dadb4c035',
    locationLine: '1247 Westwood Blvd, Los Angeles, CA',
    lines: const [
      InvoiceLineItem(title: "Men's Haircut", amount: r'$35.00'),
      InvoiceLineItem(title: 'Hair Coloring', amount: r'$120.00'),
    ],
  ),
  UserInvoice(
    id: 'inv-002',
    number: 'RZV-2026-0098',
    venueName: 'Bliss Beauty Spa',
    issuedDate: 'Feb 12, 2026',
    subtotal: r'$65.00',
    tax: r'$5.20',
    total: r'$70.20',
    statusKey: 'invoicePaid',
    unsplashId: '1544161515-4ab6ce6db874',
    locationLine: '200 Spa Row, Miami, FL',
    lines: const [
      InvoiceLineItem(title: 'Deep Tissue Massage', amount: r'$65.00'),
    ],
  ),
  UserInvoice(
    id: 'inv-003',
    number: 'RZV-2026-0188',
    venueName: 'Nail Society',
    issuedDate: 'Apr 2, 2026',
    subtotal: r'$48.00',
    tax: r'$3.84',
    total: r'$51.84',
    statusKey: 'invoicePending',
    unsplashId: '1522337660859-02fbefca4702',
    locationLine: '88 Market St, Panama City, PA',
    lines: const [
      InvoiceLineItem(title: 'Gel Manicure', amount: r'$35.00'),
      InvoiceLineItem(title: 'French tips add-on', amount: r'$13.00'),
    ],
  ),
];
