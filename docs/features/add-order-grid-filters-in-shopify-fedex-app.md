# Add Order Grid Filters in Shopify FedEx App

**Release:** FedExapp 2.3.116
**Date:** 2026-04-06
**Spec:** `(not generated yet)`
**POM:** `(not generated yet)`

## Overview
The Order Grid in the Shopify FedEx App now supports filtering by Order ID, Customer/Order Name, Order Date, SKU, and Order Status, allowing merchants to narrow down large order lists using one or more parameters simultaneously. The Date filter includes five presets (Today, Yesterday, Last 7 Days, Last Month, Custom Date Range) to speed up common lookups. QA must verify filter accuracy, multi-filter combinations, reset behavior, and that existing Order Grid functionality is not regressed.

## Test Coverage
- **Positive:** Filter by each individual parameter (Order ID, Name, Date, SKU, Status) and confirm grid results match the applied criteria
- **Positive:** Apply multiple filters simultaneously and verify the grid returns only orders satisfying all active conditions
- **Positive:** Exercise all five Date filter presets and validate the correct date boundaries are applied to grid results
- **Negative:** Enter a non-existent Order ID or SKU and confirm the grid displays an empty state without errors
- **Edge Cases:** Apply a Custom Date Range where start date equals end date; clear/reset all filters and confirm the full unfiltered order list is restored

## Key UI Elements
- **Order ID** filter input field
- **Name** filter input field
- **Date** filter dropdown with presets: `Today`, `Yesterday`, `Last 7 Days`, `Last Month`, `Custom Date Range`
- **Custom Date Range** start date and end date pickers
- **SKU** filter input field, **Status** filter dropdown, and **Clear / Reset Filters** button

## Known Constraints
- No test cases have been formally defined yet in the source card; automation coverage is derived solely from acceptance criteria
- The "save search as tabs" capability is explicitly out of scope for this release and should not be tested or assumed present
- Filter performance is a stated requirement; automated assertions on response time thresholds are not yet specified and will need agreed SLA values before implementation
- Shopify order data used in test runs must include orders spanning multiple statuses, SKUs, and date ranges to make filter assertions meaningful

## QA Notes
- Manual smoke testing is required on a live Shopify sandbox with sufficient order volume (recommend ≥ 50 orders across varied dates and statuses) before automated runs are considered reliable
- The Custom Date Range picker behavior (calendar widget interactions) may require special Playwright handling for date input fields — verify whether inputs accept direct text entry or require click-based calendar navigation
- Regression check on all pre-existing Order Grid features (bulk select, pagination, label creation flow) must be included in the test run to satisfy AC #11
- Partial Order ID and partial SKU matching behavior is implied by the acceptance criteria but not fully specified — confirm expected match logic (contains vs. starts-with) with the product team before writing assertions