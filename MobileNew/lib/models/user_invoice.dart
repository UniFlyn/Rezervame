/// Customer invoice for Profile → Invoices list and detail.
class InvoiceLineItem {
  const InvoiceLineItem({required this.title, required this.amount});

  final String title;
  final String amount;
}

class UserInvoice {
  const UserInvoice({
    required this.id,
    required this.number,
    required this.venueName,
    required this.issuedDate,
    required this.subtotal,
    required this.tax,
    required this.total,
    required this.statusKey,
    required this.unsplashId,
    required this.lines,
    this.locationLine,
  });

  final String id;
  final String number;
  final String venueName;
  final String issuedDate;
  final String subtotal;
  final String tax;
  final String total;
  /// `invoicePaid` or `invoicePending`
  final String statusKey;
  final String unsplashId;
  final List<InvoiceLineItem> lines;
  final String? locationLine;
}
