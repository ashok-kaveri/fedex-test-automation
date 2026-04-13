# Order Grid Enhancements – Add Packages, Products, and Service Name Columns

**Release:** FedExapp 2.3.116
**Date:** 2026-04-06
**Spec:** `(not generated yet)`
**POM:** `(not generated yet)`

## Overview

This feature adds three new columns — **Packages**, **Products**, and **Service Name** — to the Order Grid in the FedEx Shopify App. Each column surfaces shipment configuration details inline, eliminating the need to open individual orders to review packaging, product, or service selections. QA must verify that all column data renders correctly, rows expand gracefully for multi-item orders, and grid performance holds under large datasets.

## Test Coverage

- **TC-1 (Positive):** Single package with name and dimensions (e.g., `Small Box (10x5x4)`) is fully visible in the Packages column without truncation or hover
- **TC-2 (Positive):** Orders with 3+ products display all product names in stacked format; row height expands and no entries are hidden or cut off
- **TC-3 (Positive):** Service Name column displays the correct FedEx service (e.g., `FedEx Ground`, `FedEx Express Saver`) for each order row
- **Edge Case:** Orders with multiple packages display all package names and dimensions inline (stacked or comma-separated) without overlap or clipping
- **Negative:** Orders with missing or unconfigured package/service data render gracefully — no blank column causes layout breakage or JS errors

## Key UI Elements

- `Orders` navigation menu item → `Order Grid` view
- `Packages` column header and cell content (format: `{Package Name} ({L}x{W}x{H})`)
- `Products` column header and cell content (stacked product name list)
- `Service Name` column header and cell content (FedEx service label string)
- Order grid row container (must support multi-line/expanded height)

## Known Constraints

- Column data is visible **inline without hover** — any tooltip-only rendering is a defect
- Grid must maintain acceptable performance when many rows contain multi-line cell content (increased DOM size is expected)
- Column widths may auto-expand; fixed-width assertions should not be hardcoded in locators
- Orders must be fully configured (package dimensions, products assigned, service selected) in the PH FedEx app before grid columns will populate

## QA Notes

- TC-3 preconditions require multiple orders with **different** FedEx services pre-configured — seed test data accordingly before running the suite
- Stacked vs. comma-separated rendering for multiple packages is not finalized in the spec; assert that all items are present rather than asserting a specific delimiter
- Automation cannot currently validate subjective "readability" or spacing aesthetics — flag these for manual review during regression
- Watch for row height collapsing back to single-line after a page re-render or grid sort action — this is a likely regression point