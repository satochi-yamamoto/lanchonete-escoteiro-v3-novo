
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** OmniBurger-POS-Suite-v2
- **Date:** 2026-03-09
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Successful PIN login shows module launcher menu
- **Test Code:** [TC001_Successful_PIN_login_shows_module_launcher_menu.py](./TC001_Successful_PIN_login_shows_module_launcher_menu.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Module selection/menu ('Módulos' or 'Modules') not found on page after PIN submissions
- 'PIN Incorreto' error message is displayed after PIN submission attempts
- Correct 4-digit PIN entry did not result in a successful login or display of the module selection menu
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/67c3d055-b6d1-409c-8205-ac3c6c6894f3
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Incorrect PIN shows invalid feedback and resets PIN entry
- **Test Code:** [TC002_Incorrect_PIN_shows_invalid_feedback_and_resets_PIN_entry.py](./TC002_Incorrect_PIN_shows_invalid_feedback_and_resets_PIN_entry.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/1edc9f9d-7ad5-4150-a9b4-97ff8db74a78
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 PIN entry blocks access until 4 digits are entered
- **Test Code:** [TC003_PIN_entry_blocks_access_until_4_digits_are_entered.py](./TC003_PIN_entry_blocks_access_until_4_digits_are_entered.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/0822a5f2-ecc7-4831-a124-9198fd341914
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Open POS module from launcher after successful PIN login
- **Test Code:** [TC007_Open_POS_module_from_launcher_after_successful_PIN_login.py](./TC007_Open_POS_module_from_launcher_after_successful_PIN_login.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/207acc57-b160-4aed-8a41-6ba2d3a4a25b
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Module cards are visible on launcher after authentication
- **Test Code:** [TC008_Module_cards_are_visible_on_launcher_after_authentication.py](./TC008_Module_cards_are_visible_on_launcher_after_authentication.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/1991b171-4438-4c1a-89a5-e9b368a56195
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Admin access denied for non-admin user from launcher
- **Test Code:** [TC009_Admin_access_denied_for_non_admin_user_from_launcher.py](./TC009_Admin_access_denied_for_non_admin_user_from_launcher.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Admin module card not found on the launcher; the test cannot attempt to open Admin as a non-admin operator.
- The page shows only 'Terminal PDV', 'Totem Autoatendimento', and 'Status TV' cards; the required 'Admin' card is absent.
- Because the Admin card is absent, the presence of the access-denied message 'Acesso negado' could not be observed or verified.
- The text 'POS' was not found on the page (only 'Terminal PDV' is present), so POS visibility could not be confirmed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/6b2aeab2-d612-44c0-84b9-7529da3d9e0f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Return to launcher from POS using 'Trocar Módulo'
- **Test Code:** [TC010_Return_to_launcher_from_POS_using_Trocar_Mdulo.py](./TC010_Return_to_launcher_from_POS_using_Trocar_Mdulo.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Login did not complete - PIN keypad remained visible after entering the PIN via keyboard and after clicking on-screen keypad buttons.
- Module selection screen not displayed - no POS module card found on the page to continue the test.
- On-screen keypad submit action appears to be missing or non-functional - clicks on keypad buttons (including indexes 102 and 117) did not submit the PIN.
- Keyboard Enter did not submit the PIN - Enter keypress had no effect and the app remained on the PIN entry UI.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/e02f4750-2556-4f2f-9ad3-c2d6bd07db10
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Logout from launcher returns to login screen
- **Test Code:** [TC011_Logout_from_launcher_returns_to_login_screen.py](./TC011_Logout_from_launcher_returns_to_login_screen.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Launcher did not load after entering PIN '0000' and pressing Enter; no logout button or launcher UI elements were found on the page.
- Logout button not present on the page, so the logout flow cannot be exercised.
- The page still displays the PIN entry and user selection, indicating the login transition did not occur as expected.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/380ce2a7-7de5-483a-a409-112c915b3f94
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Invalid PIN does not allow access to launcher
- **Test Code:** [TC012_Invalid_PIN_does_not_allow_access_to_launcher.py](./TC012_Invalid_PIN_does_not_allow_access_to_launcher.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/24deb68b-7098-4961-8f8c-d9fbffac102c
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Complete POS sale with cash payment and success confirmation
- **Test Code:** [TC015_Complete_POS_sale_with_cash_payment_and_success_confirmation.py](./TC015_Complete_POS_sale_with_cash_payment_and_success_confirmation.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Cashier login failed - 'PIN Incorreto' error displayed after entering PIN '1234'.
- Admin login requires a PIN and there are no username/password input fields visible to use the provided admin credentials.
- POS and shift screens were not reached because no successful login occurred.
- No valid cashier or admin PIN credentials are available to continue and complete the scripted cashier workflow.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/f92ceb6c-043a-4735-a380-5f419cf29cff
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017 Adjust item quantity in cart before checkout
- **Test Code:** [TC017_Adjust_item_quantity_in_cart_before_checkout.py](./TC017_Adjust_item_quantity_in_cart_before_checkout.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/2fe86f35-5773-43c6-9441-a3a8916f9d41
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC019 Validation error when attempting checkout without an open shift, then open shift and retry
- **Test Code:** [TC019_Validation_error_when_attempting_checkout_without_an_open_shift_then_open_shift_and_retry.py](./TC019_Validation_error_when_attempting_checkout_without_an_open_shift_then_open_shift_and_retry.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Checkout proceeded to the payment modal after clicking 'PAGAR' without showing an 'Open a shift first' validation message.
- No 'Open a shift first' or equivalent validation text is visible on the page when attempting checkout with no shift open.
- Payment modal shows total (R$ 7,00) and payment method options (Dinheiro, PIX) immediately, indicating checkout is allowed without opening a shift.
- The Open Shift flow was not triggered from the checkout attempt and no prompt to open a shift is present in the checkout UI.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/377e4282-2f43-4618-a436-d2f9defd8010
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC020 Card payment declined shows error and allows retry
- **Test Code:** [TC020_Card_payment_declined_shows_error_and_allows_retry.py](./TC020_Card_payment_declined_shows_error_and_allows_retry.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Card payment option not found on the payment screen; only 'Dinheiro' and 'PIX' options are present.
- Unable to simulate or verify a declined card payment because the 'Card' (Cartão) payment method is not available.
- Retry flow for a declined card payment cannot be validated because the prerequisite payment method to trigger the decline is missing.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/b6407d85-8017-4788-9d93-66d603e63d7b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC023 KDS: Advance an order from PAID to PREPARING to READY
- **Test Code:** [TC023_KDS_Advance_an_order_from_PAID_to_PREPARING_to_READY.py](./TC023_KDS_Advance_an_order_from_PAID_to_PREPARING_to_READY.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- No orders available in the Kitchen Display: the 'RECEBIDOS', 'PREPARANDO', and 'PRONTO / PARCIAL' columns all display 'Vazio', so no PAID or PENDING order card is present to select.
- Unable to perform status transitions because there is no selectable order card (no 'Bump' or order actions visible) on the page.
- The Kitchen Display UI is present, but the test precondition (an order in RECEBIDOS with status PAID or PENDING) is not met, preventing verification of PREPARING and READY status updates.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/175fbed9-2673-4454-9e26-1cc7c362399f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC025 KDS: View PREPARING orders with visible SLA timers
- **Test Code:** [TC025_KDS_View_PREPARING_orders_with_visible_SLA_timers.py](./TC025_KDS_View_PREPARING_orders_with_visible_SLA_timers.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- PREPARANDO column contains no orders; it displays the placeholder text 'Vazio'.
- No SLA timer or age indicator element is visible in the PREPARANDO column or near any order entries.
- The PREPARANDO column header counter shows 0, indicating there are no orders available to display an SLA timer.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/372dd664-175f-4a93-a511-f6c5e02a718a
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC026 KDS: Mark an order item as PARTIAL for partial delivery
- **Test Code:** [TC026_KDS_Mark_an_order_item_as_PARTIAL_for_partial_delivery.py](./TC026_KDS_Mark_an_order_item_as_PARTIAL_for_partial_delivery.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- No orders found in the PREPARANDO column; no PREPARING order is available to select for testing the partial flow.
- Order details panel could not be opened because there was no order to click in PREPARANDO.
- 'Partial' or 'Mark Partial' control cannot be validated because no order item could be selected.
- Test environment did not provide any kitchen orders in PREPARANDO, preventing completion of the verification steps.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/c9dc3c33-5dd9-409e-a6a4-fcc113eb1e4f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC029 Complete kiosk order from splash to receipt with customization and payment
- **Test Code:** [TC029_Complete_kiosk_order_from_splash_to_receipt_with_customization_and_payment.py](./TC029_Complete_kiosk_order_from_splash_to_receipt_with_customization_and_payment.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Splash start button not found on /kiosk page.
- Kiosk shows a user selection screen ('Selecione o Usuário') instead of a customer-facing splash/start screen.
- No visible guest or start area to begin ordering, preventing completion of the kiosk ordering flow.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/4bc7e340-ef9f-422b-8634-d9b00619b100
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC031 Add multiple items to cart and verify cart summary reflects additions
- **Test Code:** [TC031_Add_multiple_items_to_cart_and_verify_cart_summary_reflects_additions.py](./TC031_Add_multiple_items_to_cart_and_verify_cart_summary_reflects_additions.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Add to cart button not found on page interactive elements
- Cart button not found on page interactive elements
- Product cards are present visually but are not exposed as individual interactive elements
- Clicking the product scroll container (index 357) twice did not reveal product details or add controls
- No alternative navigation or controls to open product details/cart are available on the page
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/d3177976-092c-4f9e-8997-77fb6e92965c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC032 Payment method selection is required before confirming payment
- **Test Code:** [TC032_Payment_method_selection_is_required_before_confirming_payment.py](./TC032_Payment_method_selection_is_required_before_confirming_payment.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Cart button not found on product grid page
- 'Add to cart' control not present after selecting product
- 'Proceed to payment' button not found on page
- 'Confirm payment' button not found in UI
- 'Select payment method' prompt did not appear because the payment flow could not be reached
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/26c9d670-cea0-4862-bfbc-37019b00602c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC035 TV board shows expected sections with populated orders
- **Test Code:** [TC035_TV_board_shows_expected_sections_with_populated_orders.py](./TC035_TV_board_shows_expected_sections_with_populated_orders.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Cozinha PIN entry screen prevents access to the /tv status board; the TV sections 'Prontos' and 'Em Preparo' are not visible on the current page.
- Authentication could not be completed: multiple PIN attempts resulted in an incorrect PIN state (e.g., 'PIN Incorreto' shown), so the app did not render the status board.
- The required verifications for the TV board (presence of 'Prontos', 'Em Preparo', and at least one order card in each) could not be executed because the UI remains on the PIN entry screen.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/d8295023-b32b-4c53-8e89-792d8745e3ef
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC036 TV board shows empty state when there are no orders
- **Test Code:** [TC036_TV_board_shows_empty_state_when_there_are_no_orders.py](./TC036_TV_board_shows_empty_state_when_there_are_no_orders.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/36166558-cea0-4719-9478-98c47b132dd3
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC039 Create a new user (or scout) record from Admin and verify it appears in the list
- **Test Code:** [TC039_Create_a_new_user_or_scout_record_from_Admin_and_verify_it_appears_in_the_list.py](./TC039_Create_a_new_user_or_scout_record_from_Admin_and_verify_it_appears_in_the_list.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/58f0bcad-552a-48bc-a351-0ac98c5ded03
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC040 Validation when creating a user/scout with missing required fields
- **Test Code:** [TC040_Validation_when_creating_a_userscout_with_missing_required_fields.py](./TC040_Validation_when_creating_a_userscout_with_missing_required_fields.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Username/password login form not found on /login; the page shows a user-selection screen and PIN entry flow instead of fields to type username/password.
- Admin PIN entry did not authenticate after three attempts using PIN '0000' (numeric keypad clicks and keyboard input), so the admin module was not reached.
- Users/Scouts section could not be accessed because authentication did not complete, preventing access to Create/Save functionality to test required-field validation.
- No visible alternative navigation or login mechanism was found on the current page that would allow reaching the Admin Users Create flow without successful authentication.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/82bb47e2-dfae-49a4-a8c9-df58bab2f84b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC041 Close store session is blocked when a shift is open (shows validation error)
- **Test Code:** [TC041_Close_store_session_is_blocked_when_a_shift_is_open_shows_validation_error.py](./TC041_Close_store_session_is_blocked_when_a_shift_is_open_shows_validation_error.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Admin login did not complete: the PIN keypad remains visible after entering the PIN and attempting submission.
- Sign-in submission did not trigger the Admin module: clicking the submit control (two attempts) and sending the Enter key (one attempt) produced no navigation or success state.
- Cannot reach the Store Control / Store Session screen because authentication did not complete, so the Close Session action could not be tested.
- No validation message regarding closing sessions with open shifts was observed because the test could not proceed past login.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/d60a6ebd-9b33-4748-97ff-e0fd9ea62223
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC042 Resolve open shifts from Admin and close store session successfully
- **Test Code:** [TC042_Resolve_open_shifts_from_Admin_and_close_store_session_successfully.py](./TC042_Resolve_open_shifts_from_Admin_and_close_store_session_successfully.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Store Session panel not found on Admin Backoffice dashboard after multiple attempts to open it.
- No UI control for resolving open shifts (e.g., 'Resolve Open Shifts' or 'Close Shift' for the open cashier) was found on the dashboard or within clicked loja elements.
- Clicking the Loja card and its action icons (indexes 332 twice, 580 once, 337 once) did not reveal any session/shift controls.
- Closing the store is blocked by a warning about open shifts but the UI provides no visible method to list or resolve those open shifts.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/5a332794-a3fa-4425-a425-509ff3d78c8f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC043 Edit product availability in Admin and verify it updates visibly in POS
- **Test Code:** [TC043_Edit_product_availability_in_Admin_and_verify_it_updates_visibly_in_POS.py](./TC043_Edit_product_availability_in_Admin_and_verify_it_updates_visibly_in_POS.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Availability toggle control not present in the Edit Product modal; there is no checkbox, switch, or 'Ativo/Disponível' control available to change product availability from the Admin Edit view.
- The Edit Produto modal only exposes fields for name, price, category, preparation station, image URL, and Save/Cancel actions; no availability control is available to toggle.
- Because product availability cannot be changed in Admin (no UI control found), it is not possible to verify that an Admin-side availability change is reflected in the POS product list.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/0b2fc8b0-c4b1-4ce7-9686-0ec197d86f6f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Switching selected user clears any in-progress PIN entry
- **Test Code:** [TC004_Switching_selected_user_clears_any_in_progress_PIN_entry.py](./TC004_Switching_selected_user_clears_any_in_progress_PIN_entry.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/c3bbad8e-33dd-4c63-8a4c-2dfb6aca8fb8
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Invalid PIN feedback disappears after retrying PIN entry
- **Test Code:** [TC005_Invalid_PIN_feedback_disappears_after_retrying_PIN_entry.py](./TC005_Invalid_PIN_feedback_disappears_after_retrying_PIN_entry.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/1b7c14e3-1d7f-4e84-903b-aff4a4e14d68
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Attempt to open multiple modules sequentially via launcher (POS -> back -> KDS)
- **Test Code:** [TC013_Attempt_to_open_multiple_modules_sequentially_via_launcher_POS___back___KDS.py](./TC013_Attempt_to_open_multiple_modules_sequentially_via_launcher_POS___back___KDS.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- ASSERTION: Login failed - 'PIN Incorreto' error displayed after multiple PIN entry attempts (keyboard and on-screen keypad), preventing authentication.
- ASSERTION: Launcher/dashboard not reached after entering credentials (admin / 0000) and pressing Enter, so the app remained on the PIN entry screen.
- ASSERTION: Module switching cannot be validated because the prerequisite login step failed and POS/KDS modules are not accessible.
- ASSERTION: PIN input shows inconsistent digit registration (only two digits filled despite multiple keypad presses), indicating a possible frontend input bug.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/6d8a41cc-133b-4668-9787-330869d33135
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Launcher remains usable after admin access denial
- **Test Code:** [TC014_Launcher_remains_usable_after_admin_access_denial.py](./TC014_Launcher_remains_usable_after_admin_access_denial.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- 'PIN Incorreto' message displayed after submitting PIN for user 'Caixa 01', preventing authentication.
- Admin module access could not be tested because module cards are only available after successful login and none are visible on the current page.
- Correct PIN for 'Caixa 01' was not provided in the test inputs, so authentication could not be completed.
- POS module could not be opened and 'Trocar Módulo' visibility could not be verified due to failed authentication.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/08365e79-328a-4cae-9af6-9b0fcd464866/36488e3c-8129-484c-b2e3-3f793a0a5ac5
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **33.33** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---