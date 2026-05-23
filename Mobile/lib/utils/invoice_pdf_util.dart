import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../models/user_invoice.dart';

/// Branded PDF invoice — aligned with Web `generateAndDownloadInvoicePDF`.
Future<void> shareReservationInvoice({
  required Map<String, dynamic> reservation,
  String customerName = 'Customer',
  String? customerEmail,
  String paymentMethod = 'Online',
  String paymentStatus = 'paid',
}) async {
  final ref = '${reservation['refNumber'] ?? ''}';
  final items = (reservation['items'] as List<dynamic>?) ?? [];
  final subtotal = (reservation['subtotal'] as num?)?.toDouble() ?? 0;
  final taxAmount = (reservation['taxAmount'] as num?)?.toDouble() ?? 0;
  final total = (reservation['totalPrice'] as num?)?.toDouble() ?? subtotal + taxAmount;
  final taxPct = (reservation['taxPercentage'] as num?)?.toDouble() ?? 0;
  final isPaid = paymentStatus.toLowerCase() == 'paid';

  final doc = pw.Document();
  doc.addPage(
    pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(0),
      build: (context) => [
        pw.Container(
          width: double.infinity,
          padding: const pw.EdgeInsets.symmetric(horizontal: 40, vertical: 36),
          color: const PdfColor.fromInt(0xFF0F172A),
          child: pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'REZERVAME',
                    style: pw.TextStyle(
                      fontSize: 20,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColors.white,
                      letterSpacing: 2,
                    ),
                  ),
                  pw.SizedBox(height: 4),
                  pw.Text(
                    'Beauty & Wellness Bookings',
                    style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey400),
                  ),
                ],
              ),
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.Text('INVOICE', style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey400)),
                  pw.Text(
                    'INV-$ref',
                    style: pw.TextStyle(fontSize: 22, fontWeight: pw.FontWeight.bold, color: PdfColors.white),
                  ),
                  pw.SizedBox(height: 6),
                  pw.Container(
                    padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: pw.BoxDecoration(
                      color: isPaid ? const PdfColor.fromInt(0x3322C55E) : const PdfColor.fromInt(0x33FBBF24),
                      borderRadius: pw.BorderRadius.circular(12),
                    ),
                    child: pw.Text(
                      paymentStatus.toUpperCase(),
                      style: pw.TextStyle(
                        fontSize: 9,
                        fontWeight: pw.FontWeight.bold,
                        color: isPaid ? PdfColors.green300 : PdfColors.amber300,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        pw.Padding(
          padding: const pw.EdgeInsets.all(40),
          child: pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Row(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Expanded(
                    child: _metaCard('Bill To', customerName, customerEmail),
                  ),
                  pw.SizedBox(width: 16),
                  pw.Expanded(
                    child: _metaCard(
                      'Venue',
                      '${reservation['venueName']}',
                      '${reservation['address'] ?? ''}\n${reservation['date']} at ${reservation['time']}',
                    ),
                  ),
                ],
              ),
              pw.SizedBox(height: 28),
              pw.Text(
                'SERVICES',
                style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: PdfColors.grey500, letterSpacing: 1.5),
              ),
              pw.SizedBox(height: 12),
              pw.Table(
                border: const pw.TableBorder(horizontalInside: pw.BorderSide(color: PdfColors.grey300, width: 0.5)),
                columnWidths: {
                  0: const pw.FlexColumnWidth(3),
                  1: const pw.FlexColumnWidth(2),
                  2: const pw.FlexColumnWidth(1),
                },
                children: [
                  pw.TableRow(
                    decoration: const pw.BoxDecoration(color: PdfColor.fromInt(0xFF0F172A)),
                    children: [
                      _tableHeader('Service'),
                      _tableHeader('Staff'),
                      _tableHeader('Amount', align: pw.TextAlign.right),
                    ],
                  ),
                  ...items.map((raw) {
                    final it = raw as Map<String, dynamic>;
                    return pw.TableRow(
                      children: [
                        _tableCell('${it['name']}'),
                        _tableCell('${it['staffName'] ?? '—'}'),
                        _tableCell('\$${it['price']}', align: pw.TextAlign.right),
                      ],
                    );
                  }),
                ],
              ),
              pw.SizedBox(height: 24),
              pw.Align(
                alignment: pw.Alignment.centerRight,
                child: pw.Container(
                  width: 220,
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      _totalRow('Subtotal', subtotal),
                      _totalRow('Tax${taxPct > 0 ? ' (${taxPct.toStringAsFixed(0)}%)' : ''}', taxAmount),
                      pw.Divider(color: PdfColors.grey300),
                      pw.SizedBox(height: 6),
                      pw.Text(
                        'Total: \$${total.toStringAsFixed(2)}',
                        style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, color: const PdfColor.fromInt(0xFFFF5A5F)),
                      ),
                      pw.SizedBox(height: 8),
                      pw.Text('Payment: $paymentMethod', style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey600)),
                    ],
                  ),
                ),
              ),
              pw.SizedBox(height: 40),
              pw.Center(
                child: pw.Text(
                  'Thank you for booking with Rezervame.',
                  style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey500),
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );

  final bytes = await doc.save();
  await Printing.sharePdf(bytes: bytes, filename: 'invoice-$ref.pdf');
}

/// PDF download for Profile → Invoices (matches Web `handleDownloadInvoice`).
Future<void> shareUserInvoicePdf({
  required UserInvoice invoice,
  String customerName = 'Customer',
  String? customerEmail,
}) {
  final items = invoice.lines
      .map((line) => {
            'name': line.title,
            'price': _parseMoney(line.amount),
            'staffName': '—',
          })
      .toList();
  return shareReservationInvoice(
    reservation: {
      'refNumber': invoice.refNumber,
      'venueName': invoice.venueName,
      'address': invoice.locationLine ?? '',
      'date': invoice.issuedDate,
      'time': '',
      'items': items,
      'subtotal': invoice.subtotalAmount,
      'taxAmount': invoice.taxAmount,
      'totalPrice': invoice.totalAmount,
      'taxPercentage': invoice.taxPercentage,
    },
    customerName: customerName,
    customerEmail: customerEmail,
    paymentMethod: invoice.paymentMethod,
    paymentStatus: invoice.statusKey == 'invoicePaid' ? 'paid' : 'pending',
  );
}

double _parseMoney(String value) {
  final cleaned = value.replaceAll(RegExp(r'[^\d.]'), '');
  return double.tryParse(cleaned) ?? 0;
}

pw.Widget _metaCard(String label, String title, String? subtitle) {
  return pw.Container(
    padding: const pw.EdgeInsets.all(16),
    decoration: pw.BoxDecoration(
      color: const PdfColor.fromInt(0xFFF8FAFC),
      borderRadius: pw.BorderRadius.circular(12),
      border: pw.Border.all(color: PdfColors.grey300),
    ),
    child: pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(label.toUpperCase(), style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: PdfColors.grey500)),
        pw.SizedBox(height: 6),
        pw.Text(title, style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
        if (subtitle != null && subtitle.trim().isNotEmpty) ...[
          pw.SizedBox(height: 4),
          pw.Text(subtitle, style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey600)),
        ],
      ],
    ),
  );
}

pw.Widget _tableHeader(String text, {pw.TextAlign align = pw.TextAlign.left}) {
  return pw.Padding(
    padding: const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    child: pw.Text(
      text.toUpperCase(),
      textAlign: align,
      style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: PdfColors.grey400),
    ),
  );
}

pw.Widget _tableCell(String text, {pw.TextAlign align = pw.TextAlign.left}) {
  return pw.Padding(
    padding: const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    child: pw.Text(text, textAlign: align, style: const pw.TextStyle(fontSize: 10)),
  );
}

pw.Widget _totalRow(String label, double amount) {
  return pw.Padding(
    padding: const pw.EdgeInsets.only(bottom: 6),
    child: pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      children: [
        pw.Text(label, style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey600)),
        pw.Text('\$${amount.toStringAsFixed(2)}', style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
      ],
    ),
  );
}
