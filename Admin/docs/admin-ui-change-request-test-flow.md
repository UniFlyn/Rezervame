# Admin UI Change Request - Test Flow

This document maps every request from `Admin Panel - Change_Request_List.xlsx` to a verification flow.

Base links:
- Production: `https://rezervame-admin.web.app`
- Local (if running Next.js): `http://localhost:3000`

---

## 1) Dashboard KPI split + global time switch + YTD
- Link: `/admin/dashboard`
- Verify:
  1. Open Dashboard.
  2. Confirm KPI area is split into two sections: `Business KPIs` and `Customer KPIs`.
  3. Confirm each section contains a `YTD` metric and a `YTD vs Last YTD` metric.
  4. Click `day`, `week`, `month` toggle in header.
  5. Confirm KPI values refresh when range changes.

## 2) Businesses filters as buttons (no dropdown) + search
- Link: `/admin/businesses`
- Verify:
  1. Confirm search input is visible.
  2. Confirm status controls are button filters (`All`, `Active`, `Pending`, `Suspended`).
  3. Confirm there is no status dropdown.
  4. Click each status and verify table updates.

## 3) Businesses font consistency
- Link: `/admin/businesses`
- Verify:
  1. Compare page heading/table typography with Dashboard.
  2. Confirm heading and table fonts follow normal admin style (no mismatched decorative style).

## 4) Businesses table columns update
- Link: `/admin/businesses`
- Verify:
  1. Confirm first-letter entity/avatar column is removed.
  2. Confirm table includes: row number (`#`), `Business ID`, and `Tax ID`.
  3. Confirm values are populated for each row.

## 5) Business view record includes location
- Link: `/admin/businesses`
- Verify:
  1. Click `View Record` on any row.
  2. In modal, confirm business location/address is visible under profile details.
  3. Close modal.

## 6) Bookings search box
- Link: `/admin/bookings`
- Verify:
  1. Confirm search input exists above table.
  2. Search by booking id and customer name.
  3. Confirm table rows filter correctly.

## 7) Bookings action button works
- Link: `/admin/bookings`
- Verify:
  1. Click eye/action icon in any booking row.
  2. Confirm `Booking Details` modal opens.
  3. Confirm modal shows customer + appointment details.
  4. Close modal.

## 8) Bookings customer email column
- Link: `/admin/bookings`
- Verify:
  1. Confirm `Customer Email` column exists in table.
  2. Confirm each booking row has an email value.

## 9) Transactions status filter buttons + search
- Link: `/admin/transactions`
- Verify:
  1. Confirm search input exists.
  2. Confirm status button filters exist (`All`, `Completed`, `Pending`, `Failed`).
  3. Apply filters and search combinations.
  4. Confirm rows update correctly.

## 10) Transactions details button functionality
- Link: `/admin/transactions`
- Verify:
  1. Click `Details` for a transaction row.
  2. Confirm `Transaction Details` modal opens with amount/date/status.
  3. Close modal.

## 11) Transactions KPI replacement (status quantity)
- Link: `/admin/transactions`
- Verify:
  1. Confirm old single `Total Volume` KPI is removed.
  2. Confirm KPI cards show status counts (`Completed`, `Pending`, `Failed`, `Total`).

## 12) Withdrawals missing columns added
- Link: `/admin/withdrawals`
- Verify:
  1. Confirm table includes: `#`, `Withdrawal Tx ID`, `Business ID`, `Processed Date`.
  2. Confirm values are present for processed rows and `-` for unprocessed.

## 13) Withdrawals batch process button works
- Link: `/admin/withdrawals`
- Verify:
  1. Click `Batch Process`.
  2. Confirm modal opens with queue summary.
  3. Click `Confirm Batch` and confirm modal closes.

## 14) Notifications system feed converted to table view
- Link: `/admin/notifications` (System Feed tab)
- Verify:
  1. Open `System Feed` tab.
  2. Confirm feed is in table format (not card feed).
  3. Confirm columns include category and action buttons.

## 15) Notifications KPIs moved to header
- Link: `/admin/notifications` (System Feed tab)
- Verify:
  1. Confirm KPI cards (`Total Alerts`, `Open`, `Resolved`, `Avg. Response`) are shown near top/header section.

## 16) Notifications filters by category/status + search
- Link: `/admin/notifications` (System Feed tab)
- Verify:
  1. Confirm search input exists.
  2. Confirm category filter buttons exist.
  3. Confirm status filter buttons exist.
  4. Apply combinations and verify filtered table rows.

## 17) Broadcast separated in unique tab + compose moved to header
- Link: `/admin/notifications` (Broadcast Tool tab)
- Verify:
  1. Open `Broadcast Tool` tab.
  2. Confirm `Compose Broadcast` button is in tab header area.
  3. Click button and confirm compose modal opens.

## 18) Transmission history in table view
- Link: `/admin/notifications` (Broadcast Tool tab)
- Verify:
  1. Confirm transmission history appears in table format.
  2. Confirm columns include broadcast id, audience, summary, reach, read rate, status, sent time.

## 19) Subscriptions edit threshold button functionality
- Link: `/admin/subscriptions`
- Verify:
  1. Click `Edit Thresholds` in each plan card.
  2. Confirm `Edit Thresholds` modal opens with selected plan name.
  3. Close modal.

## 20) Subscriptions missing plan added (Basic, Pro, Elite)
- Link: `/admin/subscriptions`
- Verify:
  1. Confirm there are exactly 3 plans: `Basic`, `Business Pro`, `Elite`.

## 21) Subscriptions open customizer functionality
- Link: `/admin/subscriptions`
- Verify:
  1. Click `Open Customizer` in enterprise section.
  2. Confirm customizer modal opens.
  3. Close modal.

## 22) Logs page table + filter buttons + search
- Link: `/admin/logs`
- Verify:
  1. Open Logs page from sidebar.
  2. Confirm page is table-based (not dark card layout).
  3. Confirm search input exists.
  4. Confirm severity filter buttons exist.
  5. Validate filtered rows by search + severity.

---

## Suggested End-to-End Regression Pass
1. Login and navigate each admin tab from sidebar.
2. On each page, verify top toolbar search + filter interactions.
3. Verify all modal actions open and close cleanly (business, booking, transaction, withdrawal batch, broadcast compose, subscription actions).
4. Verify no page renders 404 (especially `/admin/logs`).
