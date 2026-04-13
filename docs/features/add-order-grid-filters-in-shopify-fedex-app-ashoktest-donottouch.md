# Add Order Grid Filters in Shopify FedEx App --- AshokTest---DONOTTouch

**Release:** FedExapp 2.3.116
**Date:** 2026-04-06
**Spec:** `(not generated yet)`
**POM:** `(not generated yet)`

## Overview
This feature adds filter controls to the Order Grid in the PH FedEx Shopify App, allowing users to narrow displayed orders by Order ID, Customer Name, Order Status, and SKU. Filters support both full and partial text matching, and status filtering covers all defined fulfillment states. QA cares about this because incorrect filter logic directly impacts which orders a merchant acts on, making false positives and missed matches high-risk defects.

## Test Coverage
- **Positive:** Filter by full Order ID match returns exactly one matching order and hides all others
- **Positive:** Filter by partial Order ID string returns all orders whose ID contains the substring
- **Positive:** Filter by Customer Name is case-insensitive and matches across mixed-case name variants
- **Positive:** Filter by a single Order Status (e.g., Initial, Success, Failure, Auto Cancelled, User Cancelled) returns only orders in that state
- **Positive:** Filter by SKU returns all orders containing line items with the specified SKU value

## Key UI Elements
- `Order ID` filter input field (Order Grid toolbar)
- `Name` filter input field (Order Grid toolbar)
- `Order Status` dropdown or selector (values: Initial, Success, Failure, Auto Cancelled, User Cancelled)
- `SKU` filter input field (Order Grid toolbar)
- Apply filter trigger (button or on-change event — confirm interaction model before automating)

## Known Constraints
- Order Grid must be pre-populated with at least 10 orders for full/partial ID filter tests to be meaningful
- Status filter tests require orders in all five defined states to exist in the test account prior to execution
- SKU filter depends on line-item data being correctly synced from Shopify to the FedEx app; missing sync will cause false negatives
- TC-4 (Display Multiple Packages) shares the same TC number as Filter by Order Status in source data — treat as a data quality issue; do not conflate the two test cases

## QA Notes
- TC-4 numbering collision in the source Trello card must be resolved before spec is written; confirm with the feature owner which scenario owns TC-4
- The apply-filter interaction model (explicit button vs. real-time filtering) is not confirmed in the acceptance criteria — manual exploratory testing is needed before locators are finalized
- Partial match behavior for Order ID (e.g., whether `#` prefix is required) should be verified manually against the live app before automating TC-2
- Case-insensitivity for Name filter should be validated at the API response level, not just the UI, to rule out client-side filtering masking backend bugs