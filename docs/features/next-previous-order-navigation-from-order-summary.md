# Next / Previous Order Navigation from Order Summary

**Release:** FedExapp 2.3.116
**Date:** 2026-04-06
**Spec:** `(not generated yet)`
**POM:** `(not generated yet)`

---

## Overview

The Order Summary screen now includes **Next** and **Previous** navigation buttons that allow merchants to move sequentially between orders without returning to the order grid. Navigation preserves the originating list context, including any active filters, search terms, sort order, and date range. QA must verify both the navigation behavior and the boundary conditions (first/last order in a list) across multiple list contexts.

---

## Test Coverage

- **Positive – Next navigation:** Clicking **Next** from a mid-list order loads the correct subsequent order and retains all order details without returning to the grid.
- **Positive – Previous navigation:** Clicking **Previous** from a mid-list order loads the correct preceding order with full order details intact.
- **Positive – Context preservation:** Navigating via **Next**/**Previous** maintains the original list context (applied filters, search query, sort order, date range) throughout the session.
- **Negative – First order boundary:** When the first order in the list is open, the **Previous** button is disabled or hidden; clicking it (if accessible) produces no navigation.
- **Negative – Last order boundary:** When the last order in the list is open, the **Next** button is disabled or hidden; clicking it (if accessible) produces no navigation.
- **Edge case – Single-order result set:** When the list contains exactly one order, both **Next** and **Previous** are disabled or hidden simultaneously.
- **Edge case – Navigation performance:** Consecutive rapid clicks on **Next** or **Previous** do not cause duplicate loads, blank screens, or noticeable delay.

---

## Key UI Elements

- **Next** button — displayed on the Order Summary screen
- **Previous** button — displayed on the Order Summary screen
- **Order Summary** screen — the target page opened from the order grid
- **Order Grid / Order List** — the originating list view from which an order is opened
- Filter, search, sort, and date range controls — preserved context elements validated during navigation

---

## Known Constraints

- Navigation is scoped strictly to the **currently loaded result set**; orders outside the active context (e.g., from a different filter or search) are not accessible via these controls.
- The feature depends on the order list context being passed to and retained by the Order Summary screen; any session or state loss (e.g., page refresh) may break context preservation.
- No explicit API rate-limit notes are documented for this feature, but rapid sequential navigation should be monitored for throttling behavior from the FedEx or Shopify layer.

---

## QA Notes

- **Manual verification required** for context preservation: testers must manually apply filters, sort orders, and date ranges before opening an order and confirm the same context is active after navigating via **Next**/**Previous**.
- Automation cannot currently assert "noticeable delay" objectively; a threshold (e.g., order loads within 3 seconds) should be agreed upon with the dev team and encoded as a hard wait assertion.
- Boundary state (disabled vs. hidden) for **Next**/**Previous** buttons is not explicitly defined in the acceptance criteria — confirm the expected DOM state with the dev team before writing locator assertions.
- No test cases were provided in the source card; all coverage above is derived solely from acceptance criteria and must be reviewed with the product owner before spec finalization.