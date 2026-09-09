// =============================================================================
// ConMart — Comprehensive English & Amharic (አማርኛ) Translations Dictionary
// =============================================================================
// Tailored for the Ethiopian construction & building materials market (Addis Ababa,
// Oromia, and regional hubs). Covers categories, units, statuses, and workflows.
// =============================================================================

export type Locale = "en" | "am";

export const translations: Record<Locale, Record<string, string>> = {
  en: {
    // -------------------------------------------------------------------------
    // Brand & Navigation
    // -------------------------------------------------------------------------
    brand_name: "ConMart Ethiopia",
    brand_tagline: "B2B Construction Materials Marketplace",
    brand_subtitle: "Wholesale materials with guaranteed depot pricing",
    nav_categories: "Categories",
    nav_all_materials: "All Materials",
    nav_my_orders: "My Orders",
    nav_bank_proformas: "Bank Proformas",
    nav_cart: "Cart",
    nav_sign_in: "Sign In",
    nav_sign_out: "Sign Out",
    nav_get_started: "Get Started",
    nav_seller_portal: "Seller Inventory",
    nav_command_center: "Command Center",
    nav_add_material: "List New Material",
    nav_back_to_catalog: "Back to Catalog",
    nav_back_to_orders: "Back to Orders",

    // -------------------------------------------------------------------------
    // Landing Page
    // -------------------------------------------------------------------------
    hero_badge: "Serving contractors across Ethiopia",
    hero_title_1: "Ethiopia's B2B",
    hero_title_highlight: "Construction Materials",
    hero_title_2: "Marketplace",
    hero_description:
      "Direct wholesale pricing from verified factories and depots across Addis Ababa and Oromia. Lock guaranteed bulk rates and generate bank-ready proformas in seconds.",
    hero_cta_browse: "Browse Materials Catalog",
    hero_cta_register: "Register as Contractor / Supplier",
    hero_btn_start_buying: "Start Buying",
    hero_btn_list_materials: "List Your Materials",
    feature_transparent_title: "Volume Pricing in ETB",
    feature_transparent_desc:
      "Tiered pricing that drops as your order quantity increases. See exact costs in Ethiopian Birr before you commit.",
    feature_depot_title: "Verified Supplier Depots",
    feature_depot_desc:
      "All listings sourced directly from licensed Ethiopian distributors and manufacturers in Merkato, Kality, and Gelan.",
    feature_proforma_title: "Direct Counterparty Introductions",
    feature_proforma_desc:
      "Connect directly with licensed factories and wholesale suppliers across Addis Ababa with zero broker markups or commission cuts.",
    feature_managed_title: "Prepaid Verified Unlocks",
    feature_managed_desc:
      "Suppliers unlock genuine buyer requirements directly from their prepaid wallet, ensuring verified counterparties and immediate contact release.",
    how_it_works_title: "How It Works",
    step_1_title: "1. Compare Competing Offers",
    step_1_desc: "Compare Ex-Works and delivered pricing from multiple verified supplier depots for the same material specification.",
    step_2_title: "2. Submit Purchase Request",
    step_2_desc: "Specify your required quantity, exact delivery sub-city landmark, and truck site access feasibility.",
    step_3_title: "3. Direct Introduction",
    step_3_desc: "The supplier accepts the request, contact details unlock, and both parties transact directly off-platform.",
    footer_tagline: "Direct counterparty introduction service for the Addis Ababa construction materials trade.",
    chat_inbox_title: "Messages",
    chat_inbox_desc: "Direct chats with subscribed suppliers, and agent-mediated channels for everyone else.",
    chat_inbox_empty: "No conversations yet",
    chat_inbox_empty_desc: "Start from a listing or an enquiry. Free suppliers are routed to a local agent.",
    chat_start_direct: "Message supplier",
    chat_start_agent: "Request local agent",
    chat_type_direct: "Direct chat",
    chat_type_buyer_agent: "You ↔ Agent",
    chat_type_seller_agent: "Supplier ↔ Agent",
    chat_no_messages: "No messages yet",
    chat_placeholder: "Write a message…",
    chat_send: "Send",
    chat_direct_hint: "Subscribed supplier — contacts may be exchanged here.",
    chat_mediated_hint: "Phone numbers and messaging handles are stripped from agent channels.",
    seller_sub_title: "Chat subscription",
    seller_sub_active_desc: "Direct 1-on-1 chat with buyers is unlocked.",
    seller_sub_free_desc: "Direct chat is locked. Every buyer conversation is routed to a local agent.",
    seller_sub_expires: "Expires",
    agent_job_board: "Local job board",
    agent_job_board_desc: "Unassigned free-supplier deals in your zone. Claim one to mediate buyer and supplier chat.",
    agent_open_jobs: "Open in your zone",
    agent_no_open: "No unclaimed deals",
    agent_no_open_desc: "New tickets appear when a buyer contacts a free-tier supplier in this zone.",
    agent_claim: "Claim deal",
    agent_my_deals: "My deals",
    agent_my_deals_empty: "Claimed deals will show here.",
    agent_open: "Open",
    agent_no_total: "Total pending",
    agent_commission: "Commission",
    agent_deal_channels: "Keep the buyer and the free supplier on separate channels.",
    agent_chat_buyer: "Buyer channel",
    agent_chat_seller: "Supplier channel",
    agent_start_inspection: "Start inspection",
    agent_order_total: "Closed order total (ETB)",
    agent_complete: "Complete & calculate commission",
    agent_cancel: "Cancel deal",
    agent_platform_share: "Platform",

    // -------------------------------------------------------------------------
    // Categories (Ethiopian Construction Terminology)
    // -------------------------------------------------------------------------
    cat_cement: "Cement",
    cat_cement_desc: "Dangote, Derba, Mugher, National OPC & PPC cement bags and bulk",
    cat_steel: "Rebar & Structural Steel",
    cat_steel_desc: "Deformed steel rebar (10mm - 32mm), hollow sections, and angle iron",
    cat_roofing: "Roofing Sheets & Gutters",
    cat_roofing_desc: "Corrugated galvanized iron (CGI) sheets, G-32, G-28, and color-coated tiles",
    cat_paint: "Paints & Wall Finishes",
    cat_paint_desc: "Super Mega, Bright, Kadisco interior/exterior emulsion and quartz finishes",
    cat_tiles: "Ceramics, Tiles & Granite",
    cat_tiles_desc: "Porcelain floor tiles, wall ceramics, and Ethiopian natural granite slabs",
    cat_electrical: "Electrical & Lighting",
    cat_electrical_desc: "Copper cables, distribution boards, breakers, conduits, and LED lighting",
    cat_plumbing: "Plumbing & PPR Pipes",
    cat_plumbing_desc: "PPR pressure pipes, PVC drainage fittings, water tanks, and gate valves",
    cat_aggregates: "Sand, Gravel & Aggregates",
    cat_aggregates_desc: "River sand, 01/02 aggregate stone, basalt gravel, and red ash",

    // -------------------------------------------------------------------------
    // Product Units
    // -------------------------------------------------------------------------
    unit_BAG: "Bags",
    unit_QUINTAL: "Quintals",
    unit_TON: "Tonnes",
    unit_PIECE: "Pieces",
    unit_M3: "Cubic Meters (m³)",
    unit_singular_BAG: "bag",
    unit_singular_QUINTAL: "quintal",
    unit_singular_TON: "tonne",
    unit_singular_PIECE: "piece",
    unit_singular_M3: "m³",

    // -------------------------------------------------------------------------
    // Order Statuses
    // -------------------------------------------------------------------------
    status_GENERATED: "Proforma Generated",
    status_CALL_RECEIVED: "Call Received",
    status_PROCURED: "Material Procured",
    status_IN_TRANSIT: "In Transit",
    status_DELIVERED: "Delivered",
    status_CANCELLED: "Cancelled",

    // -------------------------------------------------------------------------
    // Cart & Checkout
    // -------------------------------------------------------------------------
    cart_title: "Procurement Cart",
    cart_trigger_btn: "Proforma Cart",
    cart_empty_title: "Your cart is empty",
    cart_empty_desc:
      "Browse the catalog and add construction materials to compile a single, consolidated Proforma Invoice.",
    cart_depot_group: "Dispatched from Depot",
    cart_items_count: "materials across",
    cart_depots_count: "depots",
    cart_bundled_badge: "Single-Depot Bundle! Maximum freight savings on Sino-truck delivery.",
    cart_multi_depot_badge: "Materials will be fulfilled from distinct depots across town.",
    cart_summary: "Financial Summary",
    cart_base_subtotal: "Materials Subtotal",
    cart_fee: "Platform Coordination Fee (10%)",
    cart_vat: "VAT (15%)",
    cart_grand_total: "Consolidated Grand Total",
    cart_btn_checkout: "Generate Master Proforma",
    cart_btn_generating: "Generating Master Proforma...",
    cart_btn_clear: "Clear Cart",
    cart_validity_note: "Official Proforma with ConMart Letterhead · Valid for 48 Hours",

    // -------------------------------------------------------------------------
    // Proforma Invoice & Orders
    // -------------------------------------------------------------------------
    proforma_title: "PROFORMA INVOICE",
    proforma_ref: "Reference Code",
    proforma_date: "Date Issued",
    proforma_buyer: "Buyer / Consignee",
    proforma_depot: "Fulfillment & Supplier Yard",
    proforma_details: "Itemized Materials",
    proforma_material: "Material",
    proforma_location: "Location",
    proforma_qty: "Qty",
    proforma_unit_price: "Unit Price",
    proforma_subtotal: "Subtotal",
    proforma_grand_total: "Grand Total",
    proforma_notes_title: "Important Notes:",
    proforma_note_validity: "This proforma invoice is valid for 7 days from the date of issue.",
    proforma_note_confirm:
      "To confirm this order, call or Telegram our operations team and quote reference",
    proforma_note_payment:
      "Payment is handled offline via bank deposit/transfer to official ConMart accounts.",
    proforma_note_tax:
      "Prices are inclusive of 15% VAT as per Ethiopian Revenue & Customs Authority regulations.",
    proforma_cancelled_notice:
      "This proforma inquiry was cancelled and is no longer active for dispatch.",
    proforma_btn_telegram: "Telegram Desk",
    proforma_btn_print: "Print Proforma",
    proforma_btn_cancel: "Cancel Proforma",
    proforma_commercial_buyer: "Commercial Buyer",
    proforma_verified_depot: "ConMart Verified Supplier Depot",
    proforma_coordinator: "ConMart Desk Coordinator",
    proforma_company_sub: "ConMart Ethiopia — B2B Construction Materials",
    proforma_subtotal_base: "Base Subtotal",
    proforma_platform_fee: "Platform Fee (10%)",
    proforma_vat: "VAT (15%)",

    // -------------------------------------------------------------------------
    // Pricing Calculator
    // -------------------------------------------------------------------------
    calc_title: "Pricing Calculator",
    calc_qty_label: "Quantity",
    calc_min_order: "Minimum order:",
    calc_at: "at",
    calc_exceeds: "Quantity exceeds available pricing tiers.",
    calc_btn_add_cart: "Add to Proforma Cart",
    calc_btn_instant_proforma: "Instant Proforma (Single Item)",
    calc_generating: "Generating...",
    calc_proforma_generated: "Proforma Generated",
    calc_ref_code: "Reference Code",
    calc_managed_steps_title: "ConMart Managed Procurement Steps:",
    calc_step_1: "Connect with the ConMart Operations Desk via WhatsApp or Phone",
    calc_step_2: "Confirm your construction site delivery address and timeline",
    calc_step_3: "ConMart inspects physical yard stock, confirms escrow, and dispatches delivery",
    calc_whatsapp_desk: "WhatsApp ConMart Operations Desk",
    calc_or_call: "Or call ConMart Procurement:",
    calc_view_print: "View & Print Invoice",
    calc_generate_another: "Generate Another Proforma",
    calc_official_verified: "Official pricing tier verified with supplier.",
    calc_no_tiers: "No active pricing tiers available for this listing.",

    // -------------------------------------------------------------------------
    // Buyer Orders Page
    // -------------------------------------------------------------------------
    orders_page_title: "Bank Proformas",
    orders_page_subtitle: "Official proforma invoices generated for bank loan applications, L/C, and commercial procurement.",
    orders_empty_title: "No proformas generated yet",
    orders_empty_desc: "Select materials from the catalog and generate an official proforma invoice with 15% VAT.",
    orders_col_ref: "Reference",
    orders_col_product: "Material Offering",
    orders_col_qty: "Quantity",
    orders_col_total: "Total Value",
    orders_col_status: "Status",
    orders_col_date: "Date",
    orders_col_actions: "Actions",
    orders_btn_view: "View",
    orders_btn_cancel: "Cancel",
    orders_cancel_confirm: "Cancel this inquiry?",
    orders_cancel_yes: "Yes, Cancel",
    orders_cancel_no: "No",

    // -------------------------------------------------------------------------
    // Catalog & Category Showcase
    // -------------------------------------------------------------------------
    catalog_wholesale_from: "Wholesale from",
    catalog_volume_tiers: "volume tiers",
    catalog_volume_tier_single: "volume tier",
    catalog_verified: "Verified",
    catalog_btn_proforma: "Proforma",
    catalog_pricing_upon_inquiry: "Pricing upon inquiry",
    catalog_offers_count: "offers",
    catalog_offer_single: "offer",
    catalog_empty_title: "No matching material offers found",
    catalog_empty_desc: "Try resetting your brand or location filters to see all available listings.",
    catalog_btn_clear_filters: "Clear Filters",
    catalog_verified_depot_stocks: "ConMart Verified Depot Stocks",
    catalog_breadcrumb_categories: "Categories",
    catalog_find_btn: "Find",
    catalog_brands_label: "Brands:",
    catalog_all_brands: "All Brands",

    // -------------------------------------------------------------------------
    // Admin & Seller Controls
    // -------------------------------------------------------------------------
    admin_title: "Dispatch & Fulfillment Operations",
    admin_subtitle: "Real-time multi-vendor orders, supplier logistics, and status tracking.",
    admin_search_placeholder:
      "Search by PRF reference, buyer company, name, phone, or material...",
    admin_btn_export: "Export CSV",
    admin_all_statuses: "All Statuses",
    admin_col_materials_vendors: "Materials / Vendors",
    admin_col_fee: "Fee (10%)",
    admin_col_action: "Action",
    admin_complete_badge: "Complete",
    seller_inventory_title: "Seller Inventory & Listings",
    seller_inventory_subtitle:
      "Manage your listed construction materials, upload batch photos, and configure volume discount tiers.",
    seller_btn_add: "List New Material",
    seller_col_tier: "Tier Quantity",
    seller_col_price: "Unit Price",
    seller_col_valid: "Valid Until",
    seller_col_status: "Status",
    seller_btn_edit: "Edit",
    seller_btn_preview: "Preview",
    seller_my_listings: "My Listings",
    seller_add_material: "Add Material",
    seller_empty_title: "No materials listed yet",
    seller_empty_desc: "Start receiving contractor proforma requests across Ethiopia by publishing your first material offering.",
    seller_btn_list_first: "List Your First Material",
    seller_orders_badge: "orders",
    seller_status_active: "Active",
    seller_status_inactive: "Inactive",
    seller_no_tiers: "No volume price tiers configured for this listing",

    // -------------------------------------------------------------------------
    // Product Detail & Depot Materials
    // -------------------------------------------------------------------------
    detail_back_to_catalog: "Back to {category} Catalog",
    detail_in_stock: "In Stock",
    detail_partner_depot: "ConMart Verified Partner Depot",
    detail_managed_title: "ConMart Managed Procurement",
    detail_managed_subtitle: "Quality Inspected · Escrow Settlement Guarantee",
    detail_freight_badge: "Yard Pickup & Freight Available",
    detail_specs_title: "Technical Specifications & Standards",
    detail_specs_verified: "Verified",
    detail_pricing_title: "Wholesale Volume Pricing",
    detail_supplier_schedule: "Official Supplier Schedule",
    detail_col_tier: "Tier Quantity",
    detail_col_price: "Unit Price",
    detail_col_valid: "Valid Until",
    detail_col_status: "Status",
    detail_tier_active: "Active",
    detail_tier_expired: "Expired",
    detail_yard_label: "Warehouse / Yard",
    detail_escrow_desk_title: "Procurement & Escrow Desk",
    detail_escrow_desk_name: "ConMart Operations Desk (Ethiopia)",
    detail_direct_coordination: "Direct Coordination:",
    depot_other_materials: "Other Materials Available at this Depot",
    depot_freight_advantage: "Single-Trip Freight Advantage",
    depot_bundle_callout: "Combine materials from this physical depot to fill a Sino-truck or Isuzu in a single pickup trip and save up to 40% on dispatch logistics.",
    depot_col_material: "Material",
    depot_col_category: "Category",
    depot_col_wholesale_price: "Wholesale Price",
    depot_col_actions: "Actions",
    depot_btn_add_cart: "Add to Cart",
    depot_price_on_request: "Price on Request",

    // -------------------------------------------------------------------------
    // Auth (Login & Register)
    // -------------------------------------------------------------------------
    auth_sign_in_title: "Sign In",
    auth_sign_in_subtitle: "Enter your credentials to access the marketplace",
    auth_email_label: "Email",
    auth_email_placeholder: "you@company.com",
    auth_password_label: "Password",
    auth_btn_signing_in: "Signing In...",
    auth_btn_sign_in: "Sign In",
    auth_no_account: "Don't have an account?",
    auth_create_account_link: "Create Account",
    auth_register_title: "Create Account",
    auth_register_subtitle: "Join the construction materials marketplace",
    auth_role_label: "Account Type / Role",
    auth_role_buyer: "Buy Materials (Contractor / Project Owner)",
    auth_role_seller: "Sell Materials (Supplier / Depot Yard)",
    auth_role_agent: "Local Agent (Zone Mediator)",
    auth_agent_zone_label: "Service zone",
    auth_agent_zone_placeholder: "Select your coverage area",
    auth_agent_zone_hint: "You will only see and claim free-supplier deals routed to this zone.",
    auth_agent_zone_empty: "No zones are configured yet. Contact ConMart operations.",
    auth_agent_company_placeholder: "e.g. ConMart Field Operations",
    auth_role_admin: "Platform Operations (Admin / Command Center)",
    auth_name_label: "Full Name",
    auth_name_placeholder: "Abebe Kebede",
    auth_phone_label: "Phone Number",
    auth_phone_placeholder: "0911234567",
    auth_company_label: "Company / Business Name",
    auth_company_placeholder: "Kebede Construction PLC",
    auth_confirm_password_label: "Confirm Password",
    auth_btn_registering: "Creating Account...",
    auth_btn_register: "Create Account",
    auth_have_account: "Already have an account?",
    auth_sign_in_link: "Sign In",
    auth_copyright: "ConMart. Industrial-grade procurement.",

    // -------------------------------------------------------------------------
    // Toolbar & Filters
    // -------------------------------------------------------------------------
    filter_all_locations: "All Warehouse Locations",
    filter_all_brands: "All Brands & Manufacturers",
    filter_sort_newest: "Newest Listings",
    filter_sort_price_low: "Price: Low to High",
    filter_sort_price_high: "Price: High to Low",
    filter_search_placeholder: "Search materials by title, brand, or spec...",
    filter_reset: "Reset Filters",

    // -------------------------------------------------------------------------
    // Wallet & Introductions (Programmer's Guide)
    // -------------------------------------------------------------------------
    wallet_title: "Prepaid Introduction Wallet",
    wallet_subtitle: "Manage your prepaid unlock balances and top-up requests.",
    wallet_cash_balance: "Cash Balance (ETB)",
    wallet_cash_desc: "Deposited via CBE / Telebirr. Withdrawable.",
    wallet_credit_balance: "Refund Credit (ETB)",
    wallet_credit_desc: "80% deal failure credit. Non-withdrawable, used for unlocks.",
    wallet_total_spendable: "Total Spendable Balance",
    wallet_total_spendable_desc: "Available immediately to accept enquiries and unlock counterparties.",
    wallet_top_up_btn: "Deposit Funds",
    wallet_top_up_modal_title: "Prepaid Wallet Top-Up",
    wallet_top_up_modal_desc: "Transfer funds to ConMart official accounts and submit your confirmation reference.",
    wallet_payment_method: "Payment Gateway / Channel",
    wallet_method_cbe: "Commercial Bank of Ethiopia (CBE)",
    wallet_method_telebirr: "Telebirr (Ethio Telecom)",
    wallet_cbe_account: "CBE Account: 1000 4829 19283 (ConMart Construction Trading PLC)",
    wallet_telebirr_account: "Telebirr Merchant: 0911000000 / Merchant Code: 554321",
    wallet_amount_label: "Deposit Amount (ETB)",
    wallet_reference_label: "Transaction Reference / SMS Code",
    wallet_reference_placeholder: "e.g. FT26095..., CBE-...",
    wallet_receipt_label: "Proof of Payment / Transfer Slip",
    wallet_submit_topup: "Submit Top-Up Request",
    wallet_submitting: "Submitting Request...",
    wallet_pending_approvals: "Pending Deposit Requests",
    wallet_pending_empty: "No pending top-up requests.",
    wallet_history_title: "Wallet Transaction Ledger",
    wallet_history_empty: "No wallet transactions recorded yet.",
    wallet_col_date: "Date & Time",
    wallet_col_type: "Type",
    wallet_col_amount: "Amount",
    wallet_col_reference: "Reference",
    wallet_col_status: "Status",
    wallet_tx_DEPOSIT: "Cash Top-Up",
    wallet_tx_UNLOCK_FEE: "Contact Unlock Fee",
    wallet_tx_REFUND: "Deal Failure Refund (80%)",
    wallet_tx_ADJUSTMENT: "System Adjustment",

    // -------------------------------------------------------------------------
    // Enquiries & Unlocks (Zero-Leakage Counterparties)
    // -------------------------------------------------------------------------
    enquiries_title: "Purchase Enquiries Inbox",
    enquiries_subtitle: "Review incoming purchase enquiries from verified contractors. Unlock counterparty contacts to close deals.",
    enquiries_tab_all: "All Enquiries",
    enquiries_tab_pending: "Pending Decisions",
    enquiries_tab_unlocked: "Active & Unlocked",
    enquiries_tab_completed: "Completed Deals",
    enquiries_empty: "No enquiries found in this category.",
    enquiry_card_masked_buyer: "Verified Contractor (ID #{id})",
    enquiry_card_subcity: "Delivery Sub-City",
    enquiry_card_quantity: "Requested Quantity",
    enquiry_card_payment_mode: "Preferred Payment Mode",
    enquiry_card_expected_date: "Required Delivery Date",
    enquiry_card_unlock_fee: "Introduction Unlock Fee",
    enquiry_accept_btn: "Accept & Unlock Contact",
    enquiry_decline_btn: "Decline",
    enquiry_accept_confirm_title: "Confirm Contact Unlock",
    enquiry_accept_confirm_desc: "Accepting will deduct the category introduction fee from your prepaid wallet and permanently reveal the contractor's direct phone number, company name, and delivery address.",
    enquiry_fee_burn_credit: "Deducted from Refund Credit:",
    enquiry_fee_burn_cash: "Deducted from Cash Balance:",
    enquiry_fee_total: "Total Deducted:",
    enquiry_confirm_unlock_btn: "Confirm Unlock & Deduct Fee",
    enquiry_unlocking: "Unlocking...",
    enquiry_unlocked_badge: "Contact Unlocked",
    enquiry_buyer_revealed_title: "Verified Buyer Contact Info",
    enquiry_buyer_name: "Contact Person",
    enquiry_buyer_company: "Contractor Company",
    enquiry_buyer_phone: "Direct Phone Number",
    enquiry_buyer_site: "Site / Delivery Address",
    enquiry_unlock_cert: "Unlock Reference ID",
    enquiry_call_buyer: "Call Contractor Now",
    enquiry_btn_complete_deal: "Mark Deal Completed",
    enquiry_btn_report_failed: "Report Deal Failed (80% Credit Refund)",
    enquiry_btn_raise_dispute: "Raise Dispute with Operations",
    enquiry_modal_fail_title: "Report Failed Deal",
    enquiry_modal_fail_desc: "If this deal could not close, 80% of your unlock fee will be instantly refunded to your Credit Balance.",
    enquiry_fail_reason_label: "Reason for Deal Failure",
    enquiry_fail_reason_unresponsive: "Contractor was unresponsive to phone calls",
    enquiry_fail_reason_stock: "Requested material specification currently out of stock",
    enquiry_fail_reason_price: "Could not agree on final payment or logistics terms",
    enquiry_fail_reason_cancelled: "Contractor cancelled project / procurement requirements",
    enquiry_fail_notes_label: "Additional Notes (Optional)",
    enquiry_fail_submit: "Confirm Deal Failure & Claim 80% Refund",
    enquiry_insufficient_wallet: "Insufficient spendable balance to unlock this enquiry.",
    enquiry_topup_wallet_link: "Top up your wallet now",
    enquiry_status_PENDING: "Pending Decision",
    enquiry_status_ACCEPTED: "Accepted & Unlocked",
    enquiry_status_DECLINED: "Declined",
    enquiry_status_COMPLETED: "Deal Completed",
    enquiry_status_FAILED: "Deal Failed (Refunded)",
    enquiry_status_DISPUTED: "In Dispute",

    // -------------------------------------------------------------------------
    // Buyer Enquiry Modal & Purchase Requests
    // -------------------------------------------------------------------------
    buyer_request_enquiry_btn: "Send Purchase Enquiry",
    buyer_enquiry_modal_title: "Submit Purchase Enquiry",
    buyer_enquiry_modal_desc: "Send your project requirements directly to verified suppliers. Your contact information is masked until the supplier confirms availability.",
    buyer_enquiry_qty: "Order Quantity",
    buyer_enquiry_delivery_pref: "Logistics & Delivery Option",
    buyer_delivery_ex_works: "Ex-Works (I will pick up from depot)",
    buyer_delivery_delivered: "Delivered (Deliver directly to site)",
    buyer_enquiry_subcity: "Addis Ababa Sub-City / Destination",
    buyer_enquiry_address: "Exact Construction Site Address / Landmark",
    buyer_enquiry_unload: "Site Unloading Assistance Required?",
    buyer_enquiry_unload_yes: "Yes, supplier must arrange offloading labor",
    buyer_enquiry_payment_mode: "Intended Payment Mode",
    buyer_pay_CASH: "Cash on Delivery (COD)",
    buyer_pay_BANK_TRANSFER: "Bank Transfer (CBE / Telebirr / Awash)",
    buyer_pay_CHEQUE: "Bank Certified Cheque (CPO)",
    buyer_pay_LETTER_OF_CREDIT: "Letter of Credit (LC)",
    buyer_enquiry_date: "Desired Delivery Date",
    buyer_enquiry_notes: "Special Notes & Quality Requirements",
    buyer_enquiry_notes_placeholder: "e.g. Need factory test certificate, 12-meter lengths only...",
    buyer_enquiry_submit: "Submit Verified Enquiry",
    buyer_enquiry_submitting: "Submitting Enquiry...",
    buyer_enquiries_title: "My Purchase Enquiries",
    buyer_enquiries_subtitle: "Track your procurement enquiries with verified Ethiopian suppliers.",
    buyer_enquiry_supplier_masked: "ConMart Verified Supplier Depot (#{id})",
    buyer_enquiry_supplier_revealed: "Supplier: {company}",
    buyer_enquiry_supplier_phone: "Supplier Contact: {phone}",
    buyer_enquiry_supplier_location: "Depot: {location}",

    // -------------------------------------------------------------------------
    // Purchase Request Modal & Truck Logistics
    // -------------------------------------------------------------------------
    modal_base_price_label: "Est. Base Unit Price",
    modal_live_market_rate: "Live Market Rate",
    modal_site_delivered_title: "Site Delivered",
    modal_site_delivered_desc: "Delivered directly to your project site",
    modal_ex_works_title: "Ex-Works Pickup",
    modal_ex_works_desc: "Pick up directly from supplier depot yard",
    modal_vehicle_access_label: "Job Site Vehicle Access Feasibility",
    modal_vehicle_sino: "Sino Truck (30-40 Tonne Heavy Tipper Access)",
    modal_vehicle_fsr: "Isuzu FSR (8-12 Tonne Medium Flatbed Access)",
    modal_vehicle_npr: "Isuzu NPR (3.5-5 Tonne Narrow Urban Access)",
    modal_vehicle_trailer: "Low-bed Semi-Trailer (40ft for 12m Deformed Rebar)",
    modal_vehicle_pickup: "Small Site Pickup / Van",
    modal_address_placeholder: "e.g. Near Gerji Imperial roundabout, behind NOC station...",
    modal_payment_method_label: "Payment Method",
    modal_payment_bank: "Bank Transfer (CBE / Awash / Telebirr)",
    modal_payment_cash: "Cash on Dispatch",
    modal_payment_cpo: "Certified Cheque (CPO)",
    modal_payment_lc: "Letter of Credit (LC)",
    modal_required_date_label: "Required Delivery Date",
    modal_notes_label: "Specific Notes or Offloading Instructions",
    modal_notes_placeholder: "e.g. Trailer access after 8pm, dump truck clearance needed...",
    modal_submitting: "Submitting Request...",
    modal_submit_btn: "Send Purchase Request",
    modal_redirecting: "Redirecting you to your enquiries tracker...",

    // -------------------------------------------------------------------------
    // Product Competing Offers Comparison View
    // -------------------------------------------------------------------------
    offers_spec_verified: "Factory Spec Verified",
    offers_competing_count: "Competing Supplier Offers",
    offers_best_rate: "Best Available Rate",
    offers_per_unit_ex_works: "per {unit} (Ex-Works Depot)",
    offers_competing_depots_title: "Competing Supplier Depots",
    offers_competing_depots_desc: "Compare wholesale pricing, minimum order quantities, and depot locations across Addis Ababa.",
    offers_indicative_title: "Notice on Indicative Pricing:",
    offers_indicative_desc: "All wholesale figures displayed are indicative references. Because material costs fluctuate in Addis Ababa, exact contractual prices are confirmed directly with the supplier depot upon contact unlock.",
    offers_lowest_rate: "Lowest Rate",
    offers_vat_included: "VAT Invoice Included",
    offers_standard_price: "Standard Price",
    offers_moq_label: "MOQ:",
    offers_ex_works_wholesale: "Ex-Works Wholesale",
    offers_volume_tiers_toggle: "Volume Pricing Tiers",
    offers_freight_available: "Site delivery & offloading available upon inquiry",
    offers_btn_proforma: "Proforma Calculator",
    offers_btn_send_enquiry: "Send Purchase Enquiry",
    offers_empty_notice: "No active supplier listings currently available for this specification.",

    // -------------------------------------------------------------------------
    // Catalog Interactive Filters
    // -------------------------------------------------------------------------
    filter_what_needed: "What do you need for your project?",
    filter_click_to_filter: "(Click to filter products)",
    filter_subtitle: "Direct procurement from certified manufacturers & warehouse yards across Ethiopia",
    filter_all_materials: "All Materials",
    catalog_search_placeholder: "Search materials, brands (e.g. Dangote, Kadisco, 12mm rebar)...",
    filter_all_cities: "All Cities / Regions",
    filter_clear_btn: "Clear Filters",
    filter_active_label: "Active Filters:",
    filter_matching_count: "Matching Materials",

    // -------------------------------------------------------------------------
    // Seller Listing Creation & Edit Form
    // -------------------------------------------------------------------------
    seller_form_back: "Back to Dashboard",
    seller_form_create_title: "List New Material Offer",
    seller_form_create_subtitle: "Publish wholesale volume price tiers for contractors and builders across Addis Ababa.",
    seller_form_edit_title: "Edit Material Offer",
    seller_form_edit_subtitle: "Update pricing tiers, warehouse location, and product details.",
    seller_form_basic_info: "Basic Information",
    seller_form_curated_product: "Curated Material Specification",
    seller_form_curated_desc: "Select pre-approved standard specification or create custom item",
    seller_form_select_standard: "Select from verified Ethiopian standard catalog...",
    seller_form_custom_spec: "+ Custom / Unlisted Specification",
    seller_form_title_label: "Material Display Title",
    seller_form_title_placeholder: "e.g. Dangote OPC Cement 42.5N (50kg Bag)",
    seller_form_category_label: "Product Category",
    seller_form_unit_label: "Unit of Measure",
    seller_form_location_label: "Warehouse Yard Location",
    seller_form_location_placeholder: "e.g. Addis Ababa, Kaliti Industrial Zone",
    seller_form_specs_title: "Technical Specifications",
    seller_form_spec_brand: "Brand / Manufacturer",
    seller_form_spec_grade: "Grade / Strength",
    seller_form_spec_standard: "Quality Standard (ES / ASTM)",
    seller_form_spec_origin: "Country of Origin",
    seller_form_tiers_title: "Wholesale Volume Pricing Tiers",
    seller_form_tiers_desc: "Reward contractors ordering larger bulk volumes with lower unit rates. Tiers must not overlap.",
    seller_form_tier_num: "Tier {num}",
    seller_form_min_qty: "Min Quantity",
    seller_form_max_qty: "Max Quantity",
    seller_form_unit_price: "Unit Price (ETB)",
    seller_form_validity_days: "Validity (Days)",
    seller_form_add_tier: "Add Volume Tier",
    seller_form_submit_btn: "Save and Publish Listing",
    seller_form_submitting_btn: "Publishing Listing...",
    seller_status_live: "Active (Live)",
    seller_status_paused: "Paused",
    seller_status_pause_title: "Click to Pause Listing",
    seller_status_activate_title: "Click to Activate Listing",

    // -------------------------------------------------------------------------
    // Image Uploader & Presets
    // -------------------------------------------------------------------------
    uploader_replace: "Replace",
    uploader_ready: "Ready for listing publication",
    uploader_uploading: "Uploading image...",
    uploader_persisting: "Persisting securely to storage",
    uploader_drop_title: "Click to browse device or drag photo here",
    uploader_drop_desc: "Supports PNG, JPEG, WEBP up to 5MB",
    uploader_quick_presets: "Quick Material Presets (Instant Visuals)",
    uploader_stored_local: "Stored Locally (High Speed)",
    uploader_cloud_storage: "Cloud Storage",

    // -------------------------------------------------------------------------
    // General Utilities
    // -------------------------------------------------------------------------
    print_invoice_btn: "Print Proforma Invoice",
    wallet_copy_btn: "Copy",
    wallet_copied_badge: "Copied!",
    wallet_cbe_label: "ConMart CBE Account",
    wallet_telebirr_label: "ConMart Telebirr Merchant",
    filter_yard_location: "Yard Location:",
    filter_reset_btn: "Reset Filters",
    wallet_verifying_badge: "Verifying",
    wallet_col_desc: "Description",
    wallet_col_balance_after: "Cash / Credit After",
    wallet_ledger_desc: "Immutable transaction record for introduction fee deductions, refunds, and top-ups.",
    btn_cancel: "Cancel",
    seller_form_pro_tip_title: "💡 Pro Seller Tip",
    seller_form_pro_tip_desc: "Listings with clear volume tiers (e.g. 10–99 vs 500+ quintals) receive 3x more bulk order inquiries from Ethiopian commercial contractors.",
    seller_form_live_preview: "Live Catalog Preview",
    seller_form_live_preview_desc: "This is exactly how contractors and buyers will view your material in the catalog.",
    seller_form_starting_from: "Starting from",
    uploader_click_drag: "Click to upload from device or drag & drop",
    uploader_file_support: "High-res JPEG, PNG, or WebP (up to 5MB)",
    uploader_or_preset: "Or select an Ethiopian construction material preset:",

    // -------------------------------------------------------------------------
    // About Us & Trust Pillars
    // -------------------------------------------------------------------------
    nav_about: "About Us",
    nav_home: "Home",
    nav_support: "Support",
    about_hero_badge: "Ethiopia's Premier B2B Construction Marketplace",
    about_hero_title: "Direct Factory Procurement.",
    about_hero_highlight: "Zero Broker Markups.",
    about_hero_desc: "ConMart connects commercial building contractors, developers, and project engineers directly with certified manufacturer depots and wholesale warehouse yards across Addis Ababa and Oromia.",
    about_mission_badge: "Our Mission",
    about_mission_title: "Building Transparency into Ethiopian Construction",
    about_mission_desc: "For decades, procuring bulk construction materials in Ethiopia meant dealing with untraceable phone brokers, volatile price gouging, fake quality specs, and uncoordinated truck deliveries. ConMart replaces informal speculation with verified factory-grade catalog pricing, transparent volume tiers, and formal proforma documentation.",
    about_pillar_1_title: "Depot-Direct Wholesale",
    about_pillar_1_desc: "All pricing tiers are published directly by licensed suppliers and factories in Kaliti, Gelan, Sebeta, and Merkato with genuine 15% VAT documentation.",
    about_pillar_2_title: "Verified Contact Unlocks",
    about_pillar_2_desc: "We mask sensitive contact information until qualified intent is established. Suppliers unlock real contractor details using their prepaid wallet, eliminating spam and tire-kickers.",
    about_pillar_3_title: "80% Failure Refund Guarantee",
    about_pillar_3_desc: "If a buyer is unresponsive, invalid, or out of stock, sellers are guaranteed an immediate 80% non-withdrawable credit refund to protect their marketing capital.",
    about_pillar_4_title: "Freight & Sino-Truck Logistics",
    about_pillar_4_desc: "Coordinated ex-works yard pickup or site-delivered logistics across Sino-trucks, Isuzu FSR/NPR, and low-bed trailers tailored to your site access class.",
    about_model_title: "How ConMart Works for You",
    about_model_buyers_title: "For Contractors & Builders",
    about_model_buyers_step1: "Browse live factory specs and competitive volume pricing tiers for free.",
    about_model_buyers_step2: "Generate official, printable multi-material bank proformas in seconds.",
    about_model_buyers_step3: "Send purchase enquiries and get connected directly with authorized supplier depots.",
    about_model_sellers_title: "For Suppliers & Depots",
    about_model_sellers_step1: "List cement, steel, rebar, and finishing materials with tiered volume pricing.",
    about_model_sellers_step2: "Receive high-intent, qualified purchase requests from active construction sites.",
    about_model_sellers_step3: "Unlock verified contractor contacts for a small category fee with 80% dispute protection.",
    about_contact_office_title: "Headquarters & Physical Office",
    about_contact_address_line: "Addis Ababa, Ethiopia · Bole Sub-City, Commercial District",
    about_contact_phone_title: "Support & Verification Hotline",
    about_contact_hours: "Monday – Saturday: 8:00 AM – 6:00 PM (EAT)",
    about_cta_title: "Ready to Modernize Your Construction Procurement?",
    about_cta_desc: "Join hundreds of contractors and supplier depots building Ethiopia faster, cleaner, and cheaper.",
    about_cta_buyer_btn: "Start Procuring Materials",
    about_cta_seller_btn: "Register as Supplier Depot",
  },

  am: {
    // -------------------------------------------------------------------------
    // Brand & Navigation
    // -------------------------------------------------------------------------
    brand_name: "ኮንማርት ኢትዮጵያ",
    brand_tagline: "የኢትዮጵያ የሕንፃ ግንባታ ዕቃዎች የጅምላ ገበያ",
    brand_subtitle: "ከአስተማማኝ መጋዘኖች በቀጥታ ዋስትና ያለው የጅምላ ዋጋ",
    nav_categories: "የዕቃዎች ምድብ",
    nav_all_materials: "ሁሉም ዕቃዎች",
    nav_my_orders: "የታዘዙ ዕቃዎች",
    nav_bank_proformas: "የባንክ ፕሮፎርማ",
    nav_cart: "የዕቃ ጋሪ",
    nav_sign_in: "ይግቡ",
    nav_sign_out: "ይውጡ",
    nav_get_started: "አሁኑኑ ይጀምሩ",
    nav_seller_portal: "የአቅራቢ ዕቃዎች",
    nav_command_center: "የአስተዳዳሪ ማዕከል",
    nav_add_material: "አዲስ ዕቃ ጨምር",
    nav_back_to_catalog: "ወደ ዕቃዎች ዝርዝር ተመለስ",
    nav_back_to_orders: "ወደ ትዕዛዞች ተመለስ",

    // -------------------------------------------------------------------------
    // Landing Page
    // -------------------------------------------------------------------------
    hero_badge: "በመላው ኢትዮጵያ ላሉ ተቋራጮችና ግንበኞች",
    hero_title_1: "የኢትዮጵያ የጅምላ",
    hero_title_highlight: "የግንባታ ዕቃዎች",
    hero_title_2: "ዲጂታል ገበያ",
    hero_description:
      "ከአዲስ አበባና ኦሮሚያ ታማኝ ፋብሪካዎችና መጋዘኖች በቀጥታ የጅምላ ዋጋ ያግኙ። የጅምላ ዋጋ ዋስትና ያግኙ፤ በሰከንዶች ውስጥ የባንክና የሂሳብ ፕሮፎርማ ያውጡ።",
    hero_cta_browse: "የዕቃዎችን ዝርዝር ይመልከቱ",
    hero_cta_register: "እንደ ተቋራጭ ወይም አቅራቢ ይመዝገቡ",
    hero_btn_start_buying: "ግዢ ይጀምሩ",
    hero_btn_list_materials: "የግንባታ ዕቃዎችን ይመዝግቡ",
    feature_transparent_title: "ግልጽ የጅምላ ዋጋ በብር (ETB)",
    feature_transparent_desc:
      "የትዕዛዝ መጠኑ በጨመረ ቁጥር ዋጋው ይቀንሳል። ከመግዛትዎ በፊት ትክክለኛውን ወጪ በኢትዮጵያ ብር ይመልከቱ።",
    feature_depot_title: "የተረጋገጡ አቅራቢ መጋዘኖች",
    feature_depot_desc:
      "በመርካቶ፣ በቃሊቲ፣ በሰበታ እና በገላን ከሚገኙ ህጋዊ አከፋፋዮችና አምራች ፋብሪካዎች የቀረቡ ጥራት ያላቸው ዕቃዎች።",
    feature_proforma_title: "የቀጥታ አቅራቢዎች ትስስር",
    feature_proforma_desc:
      "ያለ ምንም ደላላ እና ተጨማሪ የኮሚሽን ጭማሪ በአዲስ አበባ ከሚገኙ ታማኝ አምራች ፋብሪካዎችና የጅምላ አከፋፋዮች ጋር በቀጥታ ይገናኙ።",
    feature_managed_title: "በቅድመ ክፍያ የተረጋገጠ አድራሻ መክፈቻ",
    feature_managed_desc:
      "አቅራቢዎች እውነተኛ የገዢዎችን ፍላጎት ከቅድመ ክፍያ ዋሌታቸው ክፍያ በመፈጸም አድራሻ ይከፍታሉ፤ ይህም ትክክለኛና ፈጣን የንግድ ግንኙነትን ያረጋግጣል።",
    how_it_works_title: "የአሰራር ሂደት",
    step_1_title: "1. የዋጋ አማራጮችን ያወዳድሩ",
    step_1_desc: "ለአንድ ዓይነት የግንባታ ዕቃ ከተለያዩ የተረጋገጡ የመጋዘን አቅራቢዎች የቀረቡትን የፋብሪካና የማድረሻ ዋጋዎች ጎን ለጎን ያወዳድሩ።",
    step_2_title: "2. የግዢ ፍላጎትዎን ያስገቡ",
    step_2_desc: "የሚፈልጉትን መጠን፣ የግንባታ ቦታዎን መገኛ (ክፍለ ከተማና ልዩ ቦታ) እንዲሁም የከባድ መኪና መግቢያ ሁኔታን ይግለጹ።",
    step_3_title: "3. የቀጥታ ግንኙነትና ግብይት",
    step_3_desc: "አቅራቢው ጥያቄውን ሲቀበል የእርስ በርስ አድራሻ ወዲያውኑ ይከፈታል፤ ሁለቱም ወገኖች ግብይታቸውን በቀጥታ ያከናውናሉ።",
    footer_tagline: "ለአዲስ አበባ የግንባታ ዕቃዎች ግብይት የታመነ የቀጥታ አቅራቢዎች ትስስር አገልግሎት።",
    chat_inbox_title: "መልዕክቶች",
    chat_start_direct: "አቅራቢን ይጻፉ",
    chat_start_agent: "የአካባቢ ወኪል ይጠይቁ",
    chat_type_direct: "ቀጥተኛ ውይይት",
    chat_type_buyer_agent: "እርስዎ ↔ ወኪል",
    chat_type_seller_agent: "አቅራቢ ↔ ወኪል",
    chat_no_messages: "መልዕክት የለም",
    chat_placeholder: "መልዕክት ይጻፉ…",
    chat_send: "ላክ",
    seller_sub_title: "የውይይት ምዝገባ",
    seller_sub_active_desc: "ከገዢዎች ጋር ቀጥተኛ ውይይት ክፍት ነው።",
    seller_sub_free_desc: "ቀጥተኛ ውይይት ተቆልፏል። ግንኙነቶች በአካባቢ ወኪል ይመራሉ።",
    agent_job_board: "የአካባቢ ስራ ሰሌዳ",
    agent_claim: "ስምምነቱን ይውሰዱ",
    agent_my_deals: "የእኔ ስምምነቶች",
    agent_complete: "ጨርስ እና ኮሚሽን አስላ",
    agent_cancel: "ሰርዝ",

    // -------------------------------------------------------------------------
    // Categories (Ethiopian Construction Terminology)
    // -------------------------------------------------------------------------
    cat_cement: "ሲሚንቶ",
    cat_cement_desc: "የዳንጎቴ፣ ደርባ፣ ሙገር፣ ናሽናል ኦፒሲና ፒፒሲ ሲሚንቶ በከረጢትና በባልጅምላ",
    cat_steel: "የኮንክሪት ብረትና መዋቅራዊ ብረታብረት",
    cat_steel_desc: "የተቆረጠፈ የኮንክሪት ብረት (10ሚሜ - 32ሚሜ)፣ ቱቦ፣ ፕሮፋይልና ኤል አይረን",
    cat_roofing: "ቆርቆሮና የጣሪያ የውሃ መውረጃ",
    cat_roofing_desc: "የጣሪያ ቆርቆሮ ጌጅ-32፣ ጌጅ-28፣ የቀለም ቆርቆሮና የውሃ ቦይ",
    cat_paint: "ቀለሞችና የማጠናቀቂያ ግብአቶች",
    cat_paint_desc: "የሱፐር ሜጋ፣ ብራይት፣ ካዲስኮ የውስጥና የውጭ ግድግዳ ቀለም፣ ኳርትዝና ቫርኒሽ",
    cat_tiles: "ሴራሚክ፣ ሸክላና ግራናይት",
    cat_tiles_desc: "የወለልና የግድግዳ ሴራሚክ፣ የሀገር ውስጥ የተፈጨ ግራናይትና ማርብል ድንጋይ",
    cat_electrical: "የኤሌክትሪክ ዕቃዎችና መብራቶች",
    cat_electrical_desc: "የመዳብ ገመዶች፣ ሰርኪውት ብሬከሮች፣ የዲቢ ሳጥኖች፣ ኮንዲዩትና የኤልኢዲ መብራቶች",
    cat_plumbing: "የቧንቧና የፍሳሽ ማስወገጃ ዕቃዎች",
    cat_plumbing_desc: "የፒፒአር (PPR) የውሃ ቧንቧዎች፣ የቆሻሻ ማስተላለፊያ ፒቪሲ፣ ታንከሮችና ቫልቮች",
    cat_aggregates: "አሸዋ፣ ጠጠርና የተፈጨ ድንጋይ",
    cat_aggregates_desc: "የወንዝ አሸዋ፣ የኮንክሪት 01 እና 02 ጠጠር፣ የባሳልት ድንጋይና ቀይ አመድ",

    // -------------------------------------------------------------------------
    // Product Units
    // -------------------------------------------------------------------------
    unit_BAG: "ከረጢት",
    unit_QUINTAL: "ኩንታል",
    unit_TON: "ቶን",
    unit_PIECE: "ፍሬ / ቁራጭ",
    unit_M3: "ሜትር ኩብ (m³)",
    unit_singular_BAG: "ከረጢት",
    unit_singular_QUINTAL: "ኩንታል",
    unit_singular_TON: "ቶን",
    unit_singular_PIECE: "ፍሬ",
    unit_singular_M3: "ሜ.ኩብ",

    // -------------------------------------------------------------------------
    // Order Statuses
    // -------------------------------------------------------------------------
    status_GENERATED: "ፕሮፎርማ ተዘጋጅቷል",
    status_CALL_RECEIVED: "ጥሪ ደርሷል",
    status_PROCURED: "ዕቃው ተዘጋጅቷል",
    status_IN_TRANSIT: "በመጓጓዝ ላይ",
    status_DELIVERED: "ደርሷል",
    status_CANCELLED: "ተሰርዟል",

    // -------------------------------------------------------------------------
    // Cart & Checkout
    // -------------------------------------------------------------------------
    cart_title: "የግዢ ጋሪ",
    cart_trigger_btn: "የዕቃ ጋሪ",
    cart_empty_title: "ጋሪዎ ባዶ ነው",
    cart_empty_desc:
      "የተጠቃለለ ይፋዊ የፕሮፎርማ ደረሰኝ ለማዘጋጀት ከዕቃዎች ዝርዝር ውስጥ የሚፈልጉትን የግንባታ ዕቃዎች ይምረጡ።",
    cart_depot_group: "የመጋዘን መገኛ",
    cart_items_count: "ዕቃዎች ከተለያዩ",
    cart_depots_count: "መጋዘኖች",
    cart_bundled_badge: "የአንድ መጋዘን ጥቅል ጭነት! በሳይኖ ትራክ የትራንስፖርት ወጪ ይቆጥባሉ።",
    cart_multi_depot_badge: "ዕቃዎች ከተለያዩ መጋዘኖች ተጭነው ይላካሉ።",
    cart_summary: "የሂሳብ ማጠቃለያ",
    cart_base_subtotal: "የዕቃዎቹ ዋጋ ድምር",
    cart_fee: "የኮንማርት አገልግሎትና ማጓጓዣ (10%)",
    cart_vat: "የተጨማሪ እሴት ታክስ (15% ቫት)",
    cart_grand_total: "ጠቅላላ የሚከፈል ድምር",
    cart_btn_checkout: "የጅምላ ፕሮፎርማ አውጣ",
    cart_btn_generating: "የጅምላ ፕሮፎርማ በመዘጋጀት ላይ...",
    cart_btn_clear: "ጋሪውን አጽዳ",
    cart_validity_note: "ይፋዊ የኮንማርት ፕሮፎርማ ደረሰኝ · ለ 48 ሰዓታት የፀና",

    // -------------------------------------------------------------------------
    // Proforma Invoice & Orders
    // -------------------------------------------------------------------------
    proforma_title: "የፕሮፎርማ ደረሰኝ",
    proforma_ref: "የማጣቀሻ ቁጥር",
    proforma_date: "የተሰጠበት ቀን",
    proforma_buyer: "የገዢው / የተቋራጩ መረጃ",
    proforma_depot: "የአቅራቢው መጋዘንና ዴፖ",
    proforma_details: "የታዘዙ ዕቃዎች ዝርዝር",
    proforma_material: "የዕቃው አይነት",
    proforma_location: "የመጋዘን መገኛ",
    proforma_qty: "መጠን",
    proforma_unit_price: "የአንዱ ዋጋ",
    proforma_subtotal: "ድምር ዋጋ",
    proforma_grand_total: "ጠቅላላ ድምር",
    proforma_notes_title: "አስፈላጊ ማስታወሻዎች፡",
    proforma_note_validity: "ይህ የፕሮፎርማ ደረሰኝ ከተሰጠበት ቀን ጀምሮ ለ7 ቀናት የፀና ነው።",
    proforma_note_confirm:
      "ትዕዛዝዎን ለማረጋገጥ የማጣቀሻ ቁጥሩን በመጥቀስ ለኦፕሬሽን ቢሮው በስልክ ወይም በቴሌግራም ያሳውቁ፡",
    proforma_note_payment:
      "ክፍያ የሚፈጸመው በባንክ ዝውውር ወይም በደረሰኝ ወደ ይፋዊ የኮንማርት የባንክ ሂሳቦች ነው።",
    proforma_note_tax:
      "ዋጋው የኢትዮጵያን የ15% የተጨማሪ እሴት ታክስ (ቫት) ያካተተ ነው።",
    proforma_cancelled_notice:
      "ይህ የፕሮፎርማ ትዕዛዝ የተሰረዘ በመሆኑ ዕቃው አይላክም።",
    proforma_btn_telegram: "የቴሌግራም ቢሮ",
    proforma_btn_print: "ፕሮፎርማውን አትም",
    proforma_btn_cancel: "ትዕዛዙን ሰርዝ",
    proforma_commercial_buyer: "ተቋራጭ / ገዢ",
    proforma_verified_depot: "የተረጋገጠ የኮንማርት አቅራቢ መጋዘን",
    proforma_coordinator: "የኮንማርት ትዕዛዝ አስተባባሪ",
    proforma_company_sub: "ኮንማርት ኢትዮጵያ — የሕንፃ ግንባታ ዕቃዎች",
    proforma_subtotal_base: "የዕቃዎች ዋጋ ድምር",
    proforma_platform_fee: "የአገልግሎትና ማጓጓዣ ክፍያ (10%)",
    proforma_vat: "ተጨማሪ እሴት ታክስ (15% ቫት)",

    // -------------------------------------------------------------------------
    // Pricing Calculator
    // -------------------------------------------------------------------------
    calc_title: "የዋጋ ማስያ",
    calc_qty_label: "መጠን",
    calc_min_order: "አነስተኛ ትዕዛዝ፡",
    calc_at: "በ",
    calc_exceeds: "የተጠየቀው መጠን ካሉት የዋጋ እርከኖች በላይ ነው።",
    calc_btn_add_cart: "ወደ ግዢ ጋሪ ጨምር",
    calc_btn_instant_proforma: "የአንድ ዕቃ ፕሮፎርማ አውጣ",
    calc_generating: "በመዘጋጀት ላይ...",
    calc_proforma_generated: "የፕሮፎርማ ደረሰኝ ተዘጋጅቷል",
    calc_ref_code: "የማጣቀሻ ቁጥር",
    calc_managed_steps_title: "የኮንማርት የትዕዛዝ ማስተናገጃ ደረጃዎች፡",
    calc_step_1: "በስልክ ወይም በዋትስአፕ ለኮንማርት ኦፕሬሽን ደውለው ትዕዛዝዎን ያሳውቁ",
    calc_step_2: "የግንባታ ቦታዎን መገኛና ዕቃው የሚፈለግበትን ጊዜ ያረጋግጡ",
    calc_step_3: "ኮንማርት ዕቃውን ከመጋዘን መርምሮ ጭነቱን ያከናውናል",
    calc_whatsapp_desk: "በዋትስአፕ ለኦፕሬሽን ቢሮው አሳውቅ",
    calc_or_call: "ወይም በስልክ ይደውሉ፡",
    calc_view_print: "ደረሰኙን እይና አትም",
    calc_generate_another: "ሌላ ፕሮፎርማ አውጣ",
    calc_official_verified: "ከአቅራቢው ጋር የተረጋገጠ ይፋዊ የጅምላ ዋጋ።",
    calc_no_tiers: "ለዚህ ዕቃ የተዘጋጀ የዋጋ እርከን የለም።",

    // -------------------------------------------------------------------------
    // Buyer Orders Page
    // -------------------------------------------------------------------------
    orders_page_title: "የባንክ ፕሮፎርማዎች",
    orders_page_subtitle: "ለባንክ ብድር ማመልከቻ፣ ለኤል/ሲ እና ለግዢ የተዘጋጁ ይፋዊ ፕሮፎርማዎች።",
    orders_empty_title: "እስካሁን የተፈጠረ ፕሮፎርማ የለም",
    orders_empty_desc: "ከዕቃዎች ዝርዝር ውስጥ መርጠው 15% የተጨማሪ እሴት ታክስ (VAT) ያካተተ ይፋዊ ፕሮፎርማ ያውጡ።",
    orders_col_ref: "ማጣቀሻ",
    orders_col_product: "የዕቃው አይነት",
    orders_col_qty: "መጠን",
    orders_col_total: "ጠቅላላ ዋጋ",
    orders_col_status: "ሁኔታ",
    orders_col_date: "ቀን",
    orders_col_actions: "እርምጃ",
    orders_btn_view: "እይ",
    orders_btn_cancel: "ሰርዝ",
    orders_cancel_confirm: "ይህ ትዕዛዝ ይሰረዝ?",
    orders_cancel_yes: "አዎ፣ ሰርዝ",
    orders_cancel_no: "አይ",

    // -------------------------------------------------------------------------
    // Catalog & Category Showcase
    // -------------------------------------------------------------------------
    catalog_wholesale_from: "የጅምላ መነሻ ዋጋ",
    catalog_volume_tiers: "የዋጋ እርከኖች",
    catalog_volume_tier_single: "የዋጋ እርከን",
    catalog_verified: "የተረጋገጠ",
    catalog_btn_proforma: "ፕሮፎርማ",
    catalog_pricing_upon_inquiry: "ዋጋ በስልክ ይጠይቁ",
    catalog_offers_count: "አማራጮች",
    catalog_offer_single: "አማራጭ",
    catalog_empty_title: "ምንም የሚዛመድ የግንባታ ዕቃ አልተገኘም",
    catalog_empty_desc: "ሁሉንም ዕቃዎች ለማየት የፋብሪካ ወይም የመጋዘን ማጣሪያዎችን ያጽዱ።",
    catalog_btn_clear_filters: "ማጣሪያዎችን አጽዳ",
    catalog_verified_depot_stocks: "በኮንማርት የተረጋገጠ የመጋዘን ክምችት",
    catalog_breadcrumb_categories: "የዕቃዎች ምድቦች",
    catalog_find_btn: "ፈልግ",
    catalog_brands_label: "ፋብሪካዎች፡",
    catalog_all_brands: "ሁሉም ፋብሪካዎች",

    // -------------------------------------------------------------------------
    // Admin & Seller Controls
    // -------------------------------------------------------------------------
    admin_title: "የትዕዛዞችና የትራንስፖርት ኦፕሬሽን",
    admin_subtitle: "የቀጥታ ባለብዙ አቅራቢ ትዕዛዞች፣ የመጋዘን ዝውውርና የክትትል ማዕከል",
    admin_search_placeholder:
      "በማጣቀሻ ቁጥር፣ በተቋራጭ ስም፣ በስልክ ወይም በዕቃ ፈልግ...",
    admin_btn_export: "በኤክሴል አውርድ",
    admin_all_statuses: "ሁሉም ሁኔታዎች",
    admin_col_materials_vendors: "ዕቃዎችና አቅራቢዎች",
    admin_col_fee: "አገልግሎት (10%)",
    admin_col_action: "እርምጃ",
    admin_complete_badge: "ተጠናቋል",
    seller_inventory_title: "የአቅራቢው የዕቃዎች መጋዘንና ዝርዝር",
    seller_inventory_subtitle:
      "የቀረቡ የግንባታ ዕቃዎችን ያስተዳድሩ፣ ፎቶዎችን ይጫኑ፣ እና የጅምላ ቅናሽ ዋጋዎችን ያዘጋጁ።",
    seller_btn_add: "አዲስ ዕቃ መዝግብ",
    seller_col_tier: "የእርከን መጠን",
    seller_col_price: "የአንዱ ዋጋ",
    seller_col_valid: "ፀንቶ የሚቆይበት",
    seller_col_status: "ሁኔታ",
    seller_btn_edit: "አስተካክል",
    seller_btn_preview: "በገዢ እይታ",
    seller_my_listings: "የእኔ ዕቃዎች",
    seller_add_material: "አዲስ ዕቃ ጨምር",
    seller_empty_title: "እስካሁን የተመዘገበ ዕቃ የለም",
    seller_empty_desc: "የመጀመሪያውን የግንባታ ዕቃዎን በመመዝገብ በመላው ኢትዮጵያ ካሉ ተቋራጮች የጅምላ ግዥ ጥያቄዎችን መቀበል ይጀምሩ።",
    seller_btn_list_first: "የመጀመሪያውን ዕቃዎን ይመዝግቡ",
    seller_orders_badge: "ትዕዛዞች",
    seller_status_active: "ይሰራል",
    seller_status_inactive: "ቦዝኗል",
    seller_no_tiers: "ለዚህ ዕቃ የተዘጋጀ የዋጋ እርከን የለም",

    // -------------------------------------------------------------------------
    // Product Detail & Depot Materials
    // -------------------------------------------------------------------------
    detail_back_to_catalog: "ወደ {category} ዝርዝር ተመለስ",
    detail_in_stock: "ክምችት አለ",
    detail_partner_depot: "የተረጋገጠ የኮንማርት አጋር መጋዘን",
    detail_managed_title: "የተረጋገጠ የኮንማርት ግዥና ቁጥጥር",
    detail_managed_subtitle: "ጥራቱ የተረጋገጠ · አስተማማኝ የክፍያ ዋስትና",
    detail_freight_badge: "ከመጋዘን ጫኝና ትራንስፖርት አለ",
    detail_specs_title: "ቴክኒካዊ ዝርዝሮችና መስፈርቶች",
    detail_specs_verified: "የተረጋገጠ",
    detail_pricing_title: "የጅምላ ዋጋ ዝርዝር",
    detail_supplier_schedule: "ይፋዊ የአቅራቢው የዋጋ ሰሌዳ",
    detail_col_tier: "የእርከን መጠን",
    detail_col_price: "የአንዱ ዋጋ",
    detail_col_valid: "ፀንቶ የሚቆይበት",
    detail_col_status: "ሁኔታ",
    detail_tier_active: "ይሰራል",
    detail_tier_expired: "ጊዜው ያለፈበት",
    detail_yard_label: "መጋዘን / ዴፖ",
    detail_escrow_desk_title: "የኦፕሬሽንና ክፍያ ቢሮ",
    detail_escrow_desk_name: "የኮንማርት ኦፕሬሽን ቢሮ (ኢትዮጵያ)",
    detail_direct_coordination: "ቀጥታ ግንኙነት፡",
    depot_other_materials: "በዚህ መጋዘን የሚገኙ ሌሎች የግንባታ ዕቃዎች",
    depot_freight_advantage: "የአንድ ጉዞ ትራንስፖርት ቅናሽ",
    depot_bundle_callout: "ከዚህ መጋዘን ዕቃዎችን በማጣመር በአንድ የሳይኖ ትራክ ወይም አይሱዙ ጉዞ እስከ 40% የትራንስፖርት ወጪ ይቆጥቡ።",
    depot_col_material: "የዕቃው አይነት",
    depot_col_category: "ምድብ",
    depot_col_wholesale_price: "የጅምላ ዋጋ",
    depot_col_actions: "እርምጃ",
    depot_btn_add_cart: "ወደ ጋሪ ጨምር",
    depot_price_on_request: "ዋጋ በስልክ ይጠይቁ",

    // -------------------------------------------------------------------------
    // Auth (Login & Register)
    // -------------------------------------------------------------------------
    auth_sign_in_title: "ይግቡ",
    auth_sign_in_subtitle: "ወደ ገበያው ለመግባት መለያዎን ያስገቡ",
    auth_email_label: "ኢሜይል",
    auth_email_placeholder: "እርስዎ@ድርጅት.com",
    auth_password_label: "የይለፍ ቃል",
    auth_btn_signing_in: "በመግባት ላይ...",
    auth_btn_sign_in: "ይግቡ",
    auth_no_account: "አካውንት የለዎትም?",
    auth_create_account_link: "አዲስ አካውንት ይክፈቱ",
    auth_register_title: "አዲስ አካውንት ይክፈቱ",
    auth_register_subtitle: "የግንባታ ዕቃዎች ዲጂታል ገበያን ይቀላቀሉ",
    auth_role_label: "የአካውንት አይነት",
    auth_role_buyer: "ዕቃዎችን መግዛት (ተቋራጭ / አልሚ)",
    auth_role_seller: "ዕቃዎችን መሸጥ (አቅራቢ / መጋዘን)",
    auth_role_agent: "የአካባቢ ወኪል",
    auth_agent_zone_label: "የአገልግሎት ዞን",
    auth_agent_zone_placeholder: "የሚሸፍኑት አካባቢ ይምረጡ",
    auth_agent_zone_hint: "በዚህ ዞን የሚመጡ ነጻ-አቅራቢ ስምምነቶችን ብቻ ያያሉ።",
    auth_agent_zone_empty: "ዞኖች አልተዋቀሩም። ኮንማርትን ያግኙ።",
    auth_agent_company_placeholder: "ለምሳሌ ConMart Field Operations",
    auth_role_admin: "የፕላትፎርም አስተዳደር (አድሚን / ኦፕሬሽን)",
    auth_name_label: "ሙሉ ስም",
    auth_name_placeholder: "አበበ ከበደ",
    auth_phone_label: "ስልክ ቁጥር",
    auth_phone_placeholder: "0911234567",
    auth_company_label: "የድርጅት ስም",
    auth_company_placeholder: "ከበደ ኮንስትራክሽን ኃ/የተ/የግ/ማ",
    auth_confirm_password_label: "የይለፍ ቃል ያረጋግጡ",
    auth_btn_registering: "በመመዝገብ ላይ...",
    auth_btn_register: "ይመዝገቡ",
    auth_have_account: "ቀደም ሲል የተከፈተ አካውንት አለዎት?",
    auth_sign_in_link: "ይግቡ",
    auth_copyright: "ኮንማርት። ለግንባታ ኢንዱስትሪው ጥራት ያለው የጅምላ አቅርቦት።",

    // -------------------------------------------------------------------------
    // Toolbar & Filters
    // -------------------------------------------------------------------------
    filter_all_locations: "ሁሉም የመጋዘን ከተሞች",
    filter_all_brands: "ሁሉም ፋብሪካዎችና ብራንዶች",
    filter_sort_newest: "አዳዲስ ዕቃዎች",
    filter_sort_price_low: "ዋጋ፡ ከዝቅተኛ ወደ ከፍተኛ",
    filter_sort_price_high: "ዋጋ፡ ከከፍተኛ ወደ ዝቅተኛ",
    filter_search_placeholder: "ዕቃዎችን በስም፣ በፋብሪካ ወይም በስፔሲፊኬሽን ፈልግ...",
    filter_reset: "ማጣሪያዎችን አጽዳ",

    // -------------------------------------------------------------------------
    // Wallet & Introductions (Programmer's Guide)
    // -------------------------------------------------------------------------
    wallet_title: "የቅድመ-ክፍያ የኪስ ቦርሳ (Wallet)",
    wallet_subtitle: "የእውቂያ መክፈቻ ቀሪ ሂሳብዎንና የገንዘብ ማስገቢያ ጥያቄዎችን ያስተዳድሩ።",
    wallet_cash_balance: "ጥሬ ገንዘብ (ETB)",
    wallet_cash_desc: "በኢትዮጵያ ንግድ ባንክ ወይም ቴሌብር የተከፈለ። በማንኛውም ጊዜ ሊወጣ ይችላል።",
    wallet_credit_balance: "የተመላሽ ክሬዲት (ETB)",
    wallet_credit_desc: "ስምምነት ሳይሳካ ሲቀር 80% የሚመለስ። ለቀጣይ እውቂያ መክፈቻ ብቻ ይውላል።",
    wallet_total_spendable: "አጠቃላይ ጥቅም ላይ የሚውል ቀሪ ሂሳብ",
    wallet_total_spendable_desc: "የገዢዎችን ጥያቄ ተቀብሎ የቀጥታ ስልክ ቁጥር ለመክፈት አሁን ዝግጁ የሆነ ገንዘብ።",
    wallet_top_up_btn: "ሂሳብ ይሙሉ (Deposit)",
    wallet_top_up_modal_title: "የኪስ ቦርሳ ሂሳብ መሙያ",
    wallet_top_up_modal_desc: "ወደ ኮንማርት ይፋዊ የባንክ ወይም ቴሌብር ሂሳብ ያስተላልፉ እና የማረጋገጫ ኮዱን ያስገቡ።",
    wallet_payment_method: "የመክፈያ መንገድ",
    wallet_method_cbe: "የኢትዮጵያ ንግድ ባንክ (CBE)",
    wallet_method_telebirr: "ቴሌብር (Telebirr)",
    wallet_cbe_account: "የኢ.ንግድ ባንክ ሂሳብ ቁጥር፡ 1000 4829 19283 (ኮንማርት ኮንስትራክሽን ትሬዲንግ ኃ/የተ/የግ/ማ)",
    wallet_telebirr_account: "የቴሌብር መለያ፡ 0911000000 / የነጋዴ ኮድ፡ 554321",
    wallet_amount_label: "የሚሞሉት የገንዘብ መጠን (በብር)",
    wallet_reference_label: "የግብይት ማረጋገጫ ቁጥር / SMS ኮድ",
    wallet_reference_placeholder: "ምሳሌ፡ FT26095..., CBE-...",
    wallet_receipt_label: "የክፍያ ማረጋገጫ ደረሰኝ / ስክሪንሾት",
    wallet_submit_topup: "የክፍያ ማረጋገጫ ጥያቄ ላክ",
    wallet_submitting: "በመላክ ላይ...",
    wallet_pending_approvals: "በማረጋገጥ ላይ ያሉ የክፍያ ጥያቄዎች",
    wallet_pending_empty: "በማረጋገጥ ላይ ያለ ክፍያ የለም።",
    wallet_history_title: "የሂሳብ እንቅስቃሴ መዝገብ",
    wallet_history_empty: "እስካሁን ምንም የሂሳብ እንቅስቃሴ አልተመዘገበም።",
    wallet_col_date: "ቀንና ሰዓት",
    wallet_col_type: "ዓይነት",
    wallet_col_amount: "መጠን",
    wallet_col_reference: "ማጣቀሻ",
    wallet_col_status: "ሁኔታ",
    wallet_tx_DEPOSIT: "የጥሬ ገንዘብ ገቢ",
    wallet_tx_UNLOCK_FEE: "የእውቂያ መክፈቻ ክፍያ",
    wallet_tx_REFUND: "ያልተሳካ ግብይት ተመላሽ (80%)",
    wallet_tx_ADJUSTMENT: "የስርዓት ማስተካከያ",

    // -------------------------------------------------------------------------
    // Enquiries & Unlocks
    // -------------------------------------------------------------------------
    enquiries_title: "የግዢ ጥያቄዎች ሳጥን",
    enquiries_subtitle: "ከተረጋገጡ ተቋራጮች የቀረቡ የግዢ ጥያቄዎችን ይመልከቱ። ስምምነት ለመፈጸም የቀጥታ ስልክ ቁጥራቸውን ይክፈቱ።",
    enquiries_tab_all: "ሁሉም ጥያቄዎች",
    enquiries_tab_pending: "ውሳኔ የሚጠብቁ",
    enquiries_tab_unlocked: "የተከፈቱና ንቁ",
    enquiries_tab_completed: "የተጠናቀቁ ግብይቶች",
    enquiries_empty: "በዚህ ክፍል ውስጥ ምንም ጥያቄ የለም።",
    enquiry_card_masked_buyer: "የተረጋገጠ ተቋራጭ (መለያ #{id})",
    enquiry_card_subcity: "የማስረከቢያ ክፍለ ከተማ",
    enquiry_card_quantity: "የተጠየቀው መጠን",
    enquiry_card_payment_mode: "የተመረጠው የክፍያ መንገድ",
    enquiry_card_expected_date: "የሚፈለግበት ቀን",
    enquiry_card_unlock_fee: "የእውቂያ መክፈቻ ክፍያ",
    enquiry_accept_btn: "ተቀበልና ስልክ ክፈት",
    enquiry_decline_btn: "አልቀበልም",
    enquiry_accept_confirm_title: "እውቂያውን ለመክፈት ያረጋግጡ",
    enquiry_accept_confirm_desc: "ጥያቄውን ሲቀበሉ የዕቃው ምድብ የእውቂያ መክፈቻ ክፍያ ከቅድመ-ክፍያ ሂሳብዎ ይቀነሳል፤ የተቋራጩ ትክክለኛ ስልክ፣ የድርጅት ስም እና የግንባታ ቦታ አድራሻ ይገለጣል።",
    enquiry_fee_burn_credit: "ከተመላሽ ክሬዲት የሚቀነስ፡",
    enquiry_fee_burn_cash: "ከጥሬ ገንዘብ የሚቀነስ፡",
    enquiry_fee_total: "በአጠቃላይ የሚቀነስ፡",
    enquiry_confirm_unlock_btn: "ክፍያውን ቀንስና እውቂያውን ክፈት",
    enquiry_unlocking: "እየከፈተ ነው...",
    enquiry_unlocked_badge: "እውቂያው ተከፍቷል",
    enquiry_buyer_revealed_title: "የተረጋገጠ የገዢው የቀጥታ መረጃ",
    enquiry_buyer_name: "የእውቂያ ሰው",
    enquiry_buyer_company: "የተቋራጩ ድርጅት ስም",
    enquiry_buyer_phone: "የቀጥታ ስልክ ቁጥር",
    enquiry_buyer_site: "የግንባታ ቦታ አድራሻ",
    enquiry_unlock_cert: "የመክፈቻ ማረጋገጫ ቁጥር",
    enquiry_call_buyer: "አሁን ለተቋራጩ ይደውሉ",
    enquiry_btn_complete_deal: "ግብይቱ ተጠናቋል",
    enquiry_btn_report_failed: "ስምምነቱ እንዳልተሳካ አሳውቅ (80% ተመላሽ)",
    enquiry_btn_raise_dispute: "ለኦፕሬሽን ቡድን ቅሬታ አቅርብ",
    enquiry_modal_fail_title: "ያልተሳካ ስምምነት ማሳወቂያ",
    enquiry_modal_fail_desc: "ስምምነቱ ካልተሳካ ከከፈሉት የመክፈቻ ክፍያ ውስጥ 80% ወዲያውኑ ወደ ተመላሽ ክሬዲት ሂሳብዎ ይመለሳል።",
    enquiry_fail_reason_label: "ያልተሳካበት ምክንያት",
    enquiry_fail_reason_unresponsive: "ተቋራጩ ስልክ አያነሳም / አይመልስም",
    enquiry_fail_reason_stock: "የተጠየቀው የዕቃ ዓይነት በመጋዘን አልተገኘም",
    enquiry_fail_reason_price: "በዋጋ ወይም በትራንስፖርት ሁኔታዎች ላይ መስማማት አልተቻለም",
    enquiry_fail_reason_cancelled: "ተቋራጩ የግዢ ፍላጎቱን ሰርዟል",
    enquiry_fail_notes_label: "ተጨማሪ ማብራሪያ (አማራጭ)",
    enquiry_fail_submit: "ያልተሳካ መሆኑን አረጋግጥና 80% ተመላሽ ውሰድ",
    enquiry_insufficient_wallet: "ይህንን እውቂያ ለመክፈት በቂ ቀሪ ሂሳብ የለዎትም።",
    enquiry_topup_wallet_link: "የኪስ ቦርሳዎን አሁኑኑ ይሙሉ",
    enquiry_status_PENDING: "ውሳኔ የሚጠብቅ",
    enquiry_status_ACCEPTED: "ተቀባይነት አግኝቶ የተከፈተ",
    enquiry_status_DECLINED: "ውድቅ የተደረገ",
    enquiry_status_COMPLETED: "የተጠናቀቀ ግብይት",
    enquiry_status_FAILED: "ያልተሳካ (ተመላሽ የተደረገ)",
    enquiry_status_DISPUTED: "በክርክር ላይ ያለ",

    // -------------------------------------------------------------------------
    // Buyer Purchase Requests
    // -------------------------------------------------------------------------
    buyer_request_enquiry_btn: "የግዢ ጥያቄ ላክ",
    buyer_enquiry_modal_title: "የግዢ ፍላጎት ጥያቄ ማቅረቢያ",
    buyer_enquiry_modal_desc: "የፕሮጀክትዎን ፍላጎት በቀጥታ ለተረጋገጡ አቅራቢዎች ይላኩ። አቅራቢው ክምችት እንዳለው እስኪያረጋግጥ ድረስ የስልክ ቁጥርዎ አይገለጥም።",
    buyer_enquiry_qty: "የዕቃው መጠን",
    buyer_enquiry_delivery_pref: "የትራንስፖርትና ማድረሻ ምርጫ",
    buyer_delivery_ex_works: "ከመጋዘን ርክክብ (Ex-Works - ራሴ እወስዳለሁ)",
    buyer_delivery_delivered: "እስከ ግንባታ ቦታ ማድረስ (Delivered)",
    buyer_enquiry_subcity: "የአዲስ አበባ ክፍለ ከተማ / መዳረሻ",
    buyer_enquiry_address: "ትክክለኛ የግንባታ ቦታ አድራሻና መለያ",
    buyer_enquiry_unload: "በግንባታ ቦታው ላይ የማውረጃ የጉልበት ሠራተኛ ይፈለጋል?",
    buyer_enquiry_unload_yes: "አዎ፣ አቅራቢው የማውረድ ሥራውን እንዲያመቻች እፈልጋለሁ",
    buyer_enquiry_payment_mode: "የታሰበው የክፍያ መንገድ",
    buyer_pay_CASH: "በጥሬ ገንዘብ በርክክብ ወቅት (COD)",
    buyer_pay_BANK_TRANSFER: "በባንክ ዝውውር (ንግድ ባንክ / ቴሌብር / አዋሽ)",
    buyer_pay_CHEQUE: "በሲፒኦ / የተረጋገጠ ቼክ (CPO)",
    buyer_pay_LETTER_OF_CREDIT: "በኤልሲ (Letter of Credit)",
    buyer_enquiry_date: "የሚፈለግበት ቀን",
    buyer_enquiry_notes: "ልዩ ማስታወሻዎችና የጥራት መስፈርቶች",
    buyer_enquiry_notes_placeholder: "ምሳሌ፡ የላቦራቶሪ ምርመራ ሰርተፊኬት ያስፈልጋል፣ የ12 ሜትር ርዝመት ብቻ...",
    buyer_enquiry_submit: "የተረጋገጠ የግዢ ጥያቄ ላክ",
    buyer_enquiry_submitting: "በመላክ ላይ...",
    buyer_enquiries_title: "የእኔ የግዢ ጥያቄዎች",
    buyer_enquiries_subtitle: "ለተረጋገጡ የኢትዮጵያ አቅራቢዎች የላኳቸውን የግዢ ጥያቄዎች ይከታተሉ።",
    buyer_enquiry_supplier_masked: "በኮንማርት የተረጋገጠ አቅራቢ መጋዘን (መለያ #{id})",
    buyer_enquiry_supplier_revealed: "አቅራቢ ድርጅት፡ {company}",
    buyer_enquiry_supplier_phone: "የአቅራቢው ስልክ፡ {phone}",
    buyer_enquiry_supplier_location: "የመጋዘን ቦታ፡ {location}",

    // -------------------------------------------------------------------------
    // Purchase Request Modal & Truck Logistics
    // -------------------------------------------------------------------------
    modal_base_price_label: "ግምታዊ የመነሻ ዋጋ",
    modal_live_market_rate: "የወቅቱ የገበያ ዋጋ",
    modal_site_delivered_title: "ወደ ግንባታ ቦታ የሚደርስ",
    modal_site_delivered_desc: "ወደ ፕሮጀክትዎ ቦታ በቀጥታ ይጓጓዛል",
    modal_ex_works_title: "ከመጋዘን ጫኝ (Ex-Works)",
    modal_ex_works_desc: "ከአቅራቢው መጋዘን በራስዎ ይረከቡ",
    modal_vehicle_access_label: "የግንባታ ቦታው የከባድ መኪና መግቢያ ሁኔታ",
    modal_vehicle_sino: "ሳይኖ ትራክ (30-40 ቶን የከባድ መኪና መግቢያ)",
    modal_vehicle_fsr: "ኢሱዙ ኤፍ ኤስ አር / FSR (8-12 ቶን መካከለኛ መኪና)",
    modal_vehicle_npr: "ኢሱዙ ኤን ፒ አር / NPR (3.5-5 ቶን ጠባብ መንገድ መግቢያ)",
    modal_vehicle_trailer: "ሎው-ቤድ ተሳቢ ትሬለር (ለ12 ሜትር ፌሮ ብረት)",
    modal_vehicle_pickup: "አነስተኛ ፒክአፕ መኪና / ቫን",
    modal_address_placeholder: "ምሳሌ፡ ገርጂ ኢምፔሪያል አደባባይ አጠገብ፣ ከኖክ ማደያ ጀርባ...",
    modal_payment_method_label: "የክፍያ ዘዴ",
    modal_payment_bank: "የባንክ ዝውውር (ንግድ ባንክ / አዋሽ / ቴሌብር)",
    modal_payment_cash: "ዕቃው ሲጫን በጥሬ ገንዘብ",
    modal_payment_cpo: "የባንክ ሲፒኦ (CPO)",
    modal_payment_lc: "የብድር ደብዳቤ (Letter of Credit)",
    modal_required_date_label: "ዕቃው የሚፈለግበት ቀን",
    modal_notes_label: "ተጨማሪ ማስታወሻ ወይም የማውረጃ መመሪያዎች",
    modal_notes_placeholder: "ምሳሌ፡ ተሳቢ ትሬለር ከምሽቱ 2 ሰዓት በኋላ ይገባል፣ የቆሻሻ መኪና ክፍተት ያስፈልጋል...",
    modal_submitting: "በመላክ ላይ...",
    modal_submit_btn: "የግዢ ፍላጎት ጥያቄ ላክ",
    modal_redirecting: "ወደ የፍላጎት ጥያቄዎች ዝርዝር በማስተላለፍ ላይ...",

    // -------------------------------------------------------------------------
    // Product Competing Offers Comparison View
    // -------------------------------------------------------------------------
    offers_spec_verified: "የፋብሪካ ጥራት የተረጋገጠ",
    offers_competing_count: "ተፎካካሪ የአቅራቢ ዋጋዎች",
    offers_best_rate: "ምርጥ የመነሻ ዋጋ",
    offers_per_unit_ex_works: "በ{unit} (ከመጋዘን ጫኝ)",
    offers_competing_depots_title: "ተፎካካሪ የአቅራቢ መጋዘኖች",
    offers_competing_depots_desc: "የጅምላ ዋጋን፣ አነስተኛ የትዕዛዝ መጠንንና የመጋዘን መገኛዎችን በአዲስ አበባ ያወዳድሩ።",
    offers_indicative_title: "የዋጋ ማረጋገጫ ማስታወሻ፦",
    offers_indicative_desc: "በኮንማርት ላይ የሚታዩ ዋጋዎች ሁሉ ገላጭ (Indicative) ናቸው። የግንባታ ዕቃዎች ዋጋ እንደ ገበያው ሁኔታ ስለሚለዋወጥ፣ ትክክለኛውን ዋጋ አቅራቢው የፍላጎት ጥያቄዎን ተቀብሎ አድራሻ ሲለዋወጥ በቀጥታ ያረጋግጣል።",
    offers_lowest_rate: "ዝቅተኛው ዋጋ",
    offers_vat_included: "ህጋዊ የቫት ደረሰኝ ያካተተ",
    offers_standard_price: "መደበኛ ዋጋ",
    offers_moq_label: "ዝቅተኛ ትዕዛዝ፡",
    offers_ex_works_wholesale: "የጅምላ መነሻ ዋጋ",
    offers_volume_tiers_toggle: "የብዛት የዋጋ እርከኖች",
    offers_freight_available: "ወደ ግንባታ ቦታ ማጓጓዝ እና ማውረድ በጥያቄ መሰረት ይቀርባል",
    offers_btn_proforma: "የፕሮፎርማ ማስያ",
    offers_btn_send_enquiry: "የግዢ ፍላጎት ጥያቄ ላክ",
    offers_empty_notice: "ለዚህ ምርት ዝርዝር በአሁኑ ወቅት ንቁ የአቅራቢ ዋጋ አልተገኘም።",

    // -------------------------------------------------------------------------
    // Catalog Interactive Filters
    // -------------------------------------------------------------------------
    filter_what_needed: "ለግንባታ ፕሮጀክትዎ ምን ይፈልጋሉ?",
    filter_click_to_filter: "(ዕቃዎችን ለመምረጥ ይጫኑ)",
    filter_subtitle: "ከታመኑ የኢትዮጵያ አምራች ፋብሪካዎችና መጋዘኖች በቀጥታ የጅምላ ግዢ ያከናውኑ",
    filter_all_materials: "ሁሉም ዕቃዎች",
    catalog_search_placeholder: "ዕቃዎችን ወይም ብራንዶችን ይፈልጉ (ምሳሌ፡ ዳንጎቴ፣ ካዲስኮ፣ 12ሚሜ ብረት)...",
    filter_all_cities: "ሁሉም ከተሞች / ክልሎች",
    filter_clear_btn: "ሁሉንም አጽዳ",
    filter_active_label: "የተመረጡ ማጣሪያዎች፡",
    filter_matching_count: "የተገኙ የግንባታ ዕቃዎች",

    // -------------------------------------------------------------------------
    // Seller Listing Creation & Edit Form
    // -------------------------------------------------------------------------
    seller_form_back: "ወደ ዳሽቦርድ ተመለስ",
    seller_form_create_title: "አዲስ የግንባታ ዕቃ ዋጋ መዝግብ",
    seller_form_create_subtitle: "በአዲስ አበባ ላሉ ተቋራጮችና ግንበኞች የጅምላ ዋጋ እርከኖችን ያቅርቡ።",
    seller_form_edit_title: "የግንባታ ዕቃ ዋጋን አሻሽል",
    seller_form_edit_subtitle: "የዋጋ እርከኖችን፣ የመጋዘን መገኛንና የምርት ዝርዝሮችን ያስተካክሉ።",
    seller_form_basic_info: "መሰረታዊ መረጃ",
    seller_form_curated_product: "የተረጋገጠ መደበኛ የዕቃ ዝርዝር",
    seller_form_curated_desc: "ከኮንማርት መደበኛ የዕቃዎች ካታሎግ ይምረጡ ወይም አዲስ ልዩ ዝርዝር ይፍጠሩ",
    seller_form_select_standard: "ከኮንማርት መደበኛ የዕቃዎች ካታሎግ ይምረጡ...",
    seller_form_custom_spec: "+ በካታሎግ ውስጥ የሌለ አዲስ ዕቃ መዝግብ",
    seller_form_title_label: "የዕቃው መጠሪያ ስም",
    seller_form_title_placeholder: "ምሳሌ፡ የዳንጎቴ ኦፒሲ ሲሚንቶ 42.5N (50 ኪ.ግ ከረጢት)",
    seller_form_category_label: "የዕቃው ዘርፍ / ምድብ",
    seller_form_unit_label: "የመለኪያ አሃድ",
    seller_form_location_label: "የመጋዘን / ያርድ መገኛ ቦታ",
    seller_form_location_placeholder: "ምሳሌ፡ አዲስ አበባ፣ ቃሊቲ የኢንዱስትሪ ዞን",
    seller_form_specs_title: "ቴክኒካዊ ዝርዝሮች",
    seller_form_spec_brand: "ብራንድ / አምራች ፋብሪካ",
    seller_form_spec_grade: "ግሬድ / ጥንካሬ",
    seller_form_spec_standard: "የጥራት ደረጃ (ES / ASTM)",
    seller_form_spec_origin: "የትውልድ ሀገር",
    seller_form_tiers_title: "የጅምላ ብዛት የዋጋ እርከኖች",
    seller_form_tiers_desc: "በትልቅ መጠን ለሚያዙ ተቋራጮች ዝቅተኛ ዋጋ በማቅረብ ሽያጭዎን ያሳድጉ። የዋጋ እርከኖች እርስ በርስ መደራረብ የለባቸውም።",
    seller_form_tier_num: "እርከን {num}",
    seller_form_min_qty: "አነስተኛ መጠን",
    seller_form_max_qty: "ከፍተኛ መጠን",
    seller_form_unit_price: "የአንዱ ዋጋ (በብር)",
    seller_form_validity_days: "የሚቆይበት ጊዜ (በቀናት)",
    seller_form_add_tier: "ተጨማሪ የዋጋ እርከን ጨምር",
    seller_form_submit_btn: "መዝግብና ለገበያ አቅርብ",
    seller_form_submitting_btn: "በመመዝገብ ላይ...",
    seller_status_live: "ንቁ (በገበያ ላይ)",
    seller_status_paused: "የቆመ",
    seller_status_pause_title: "ዝርዝሩን ለጊዜው ለማቆም ይጫኑ",
    seller_status_activate_title: "ዝርዝሩን ወደ ገበያ ለማስገባት ይጫኑ",

    // -------------------------------------------------------------------------
    // Image Uploader & Presets
    // -------------------------------------------------------------------------
    uploader_replace: "ቀይር",
    uploader_ready: "ለህትመት ዝግጁ ነው",
    uploader_uploading: "ምስሉ በመጫን ላይ...",
    uploader_persisting: "በአስተማማኝ ሁኔታ በመቀመጥ ላይ",
    uploader_drop_title: "ምስል ለመምረጥ እዚህ ይጫኑ ወይም ምስሉን ጎትተው ያስቀምጡ",
    uploader_drop_desc: "PNG, JPEG, WEBP እስከ 5 ሜጋባይት (5MB) ይቀበላል",
    uploader_quick_presets: "ፈጣን የዕቃዎች ናሙና ምስሎች (በአንድ ንክኪ)",
    uploader_stored_local: "በፍጥነት ተቀምጧል",
    uploader_cloud_storage: "ክላውድ ላይ ተቀምጧል",

    // -------------------------------------------------------------------------
    // General Utilities
    // -------------------------------------------------------------------------
    print_invoice_btn: "የፕሮፎርማ ደረሰኙን አትም",
    wallet_copy_btn: "ገልብጥ",
    wallet_copied_badge: "ተገልብጧል!",
    wallet_cbe_label: "የኮንማርት ንግድ ባንክ ሂሳብ",
    wallet_telebirr_label: "የኮንማርት ቴሌብር ነጋዴ ቁጥር",
    filter_yard_location: "የመጋዘን መገኛ፡",
    filter_reset_btn: "ማጣሪያዎችን አጽዳ",
    wallet_verifying_badge: "በማጣራት ላይ",
    wallet_col_desc: "ዝርዝር መግለጫ",
    wallet_col_balance_after: "የቀረ ካሽ / ክሬዲት",
    wallet_ledger_desc: "የአድራሻ መክፈቻ ክፍያ፣ ተመላሽና የገንዘብ ማስገቢያ ዝርዝር የሂሳብ መዝገብ።",
    btn_cancel: "ተመለስ",
    seller_form_pro_tip_title: "💡 ጠቃሚ የአቅራቢዎች ምክር",
    seller_form_pro_tip_desc: "ግልጽ የጅምላ ብዛት የዋጋ እርከን ያላቸው ዕቃዎች ከተቋራጮች በሦስት እጥፍ የበለጠ የግዥ ጥያቄዎችን ይቀበላሉ።",
    seller_form_live_preview: "የካታሎግ የቀጥታ ገዢ እይታ",
    seller_form_live_preview_desc: "ተቋራጮችና ገዢዎች በካታሎጉ ላይ ዕቃዎን የሚያዩት በዚህ መልክ ነው።",
    seller_form_starting_from: "መነሻ ዋጋ",
    uploader_click_drag: "ምስል ለመጫን እዚህ ይጫኑ ወይም ምስሉን ጎትተው ያስቀምጡ",
    uploader_file_support: "ከፍተኛ ጥራት ያለው JPEG, PNG, ወይም WebP (እስከ 5MB)",
    uploader_or_preset: "ወይም የናሙና የግንባታ ዕቃ ምስል ይምረጡ፦",

    // -------------------------------------------------------------------------
    // About Us & Trust Pillars
    // -------------------------------------------------------------------------
    nav_about: "ስለ እኛ",
    nav_home: "ዋና ገጽ",
    nav_support: "እርዳታና ድጋፍ",
    about_hero_badge: "የኢትዮጵያ ቀዳሚ የሕንፃ ግንባታ ዕቃዎች የጅምላ የገበያ መድረክ",
    about_hero_title: "ቀጥታ የፋብሪካና መጋዘን ግዢ።",
    about_hero_highlight: "ያለ ደላላ ጣልቃ ገብነት።",
    about_hero_desc: "ኮንማርት የሕንፃ ተቋራጮችን፣ አልሚዎችንና መሀንዲሶችን በአዲስ አበባና በኦሮሚያ ከሚገኙ ህጋዊ አምራች ፋብሪካዎችና የጅምላ መጋዘኖች ጋር በቀጥታ ያገናኛል።",
    about_mission_badge: "ተልዕኳችን",
    about_mission_title: "በኢትዮጵያ የግንባታ ዘርፍ ውስጥ ግልጽነትን መገንባት",
    about_mission_desc: "ለዓመታት በኢትዮጵያ የጅምላ ግንባታ ዕቃዎችን መግዛት ባልታወቁ ስልክ ደላሎች፣ ባልተረጋጋ የዋጋ ጭማሪ እና የጥራት ደረጃቸው ባልተረጋገጠ ዕቃዎች የተሞላ ነበር። ኮንማርት ይህንን አሰራር በታመኑ የፋብሪካ ዋጋዎች፣ ግልጽ የጅምላ ቅናሾች እና ህጋዊ የፕሮፎርማ ደረሰኞች ይተካል።",
    about_pillar_1_title: "ቀጥታ ከመጋዘን የጅምላ ዋጋ",
    about_pillar_1_desc: "ሁሉም የዋጋ እርከኖች በቃሊቲ፣ በገላን፣ በሰበታ እና በመርካቶ በሚገኙ ህጋዊ አቅራቢዎችና ፋብሪካዎች በቀጥታ የተዘጋጁ ሲሆኑ ህጋዊ የ15% የተጨማሪ እሴት ታክስ (VAT) ያካተቱ ናቸው።",
    about_pillar_2_title: "የተረጋገጠ የቀጥታ ግንኙነት",
    about_pillar_2_desc: "ትክክለኛ የግዢ ፍላጎት እስኪረጋገጥ ድረስ አድራሻዎችን በደህንነት እንጠብቃለን። አቅራቢዎች የተቋራጮችን ትክክለኛ አድራሻ በዋሌታቸው ሲከፍቱ አላስፈላጊ ውዥንብር ይወገዳል።",
    about_pillar_3_title: "የ80% ተመላሽ ዋስትና",
    about_pillar_3_desc: "ገዢው ምላሽ የማይሰጥ ከሆነ ወይም የተፈጠረ ችግር ካለ፣ የአቅራቢውን ወጪ ለመጠበቅ 80% የዋሌት ክሬዲት ወዲያውኑ ተመላሽ ይደረጋል።",
    about_pillar_4_title: "የሳይኖ ትራክ የትራንስፖርት ድጋፍ",
    about_pillar_4_desc: "ከመጋዘን ጫኝ ወይም ወደ ግንባታ ቦታ ድረስ በሳይኖ ትራክ፣ በኢሱዙ FSR/NPR እና በትሬለር የሚቀርብ የተቀናጀ የትራንስፖርት አገልግሎት።",
    about_model_title: "ኮንማርት ለእርስዎ እንዴት ይሰራል?",
    about_model_buyers_title: "ለተቋራጮችና ለግንበኞች",
    about_model_buyers_step1: "የፋብሪካ ስፔስፊኬሽኖችን እና የጅምላ ዋጋ እርከኖችን በነጻ ይመልከቱ።",
    about_model_buyers_step2: "ለባንክና ለሂሳብ የሚሆን ህጋዊ የፕሮፎርማ ደረሰኝ በሰከንዶች ውስጥ ያውጡ።",
    about_model_buyers_step3: "የግዢ ጥያቄ በመላክ ከአቅራቢ መጋዘኖች ጋር በቀጥታ ይገናኙ።",
    about_model_sellers_title: "ለአቅራቢዎችና ለመጋዘኖች",
    about_model_sellers_step1: "ሲሚንቶ፣ ፌሮ ብረት እና ሌሎች የግንባታ ዕቃዎችን በጅምላ ዋጋ እርከን ይመዝግቡ።",
    about_model_sellers_step2: "ከግንባታ ሳይቶች የሚመጡ ጥራት ያላቸውን የቀጥታ የግዢ ጥያቄዎች ይቀበሉ።",
    about_model_sellers_step3: "በአነስተኛ ክፍያ የተቋራጩን ስልክ በመክፈት በቀጥታ ይገበያዩ፤ የ80% ተመላሽ ዋስትና አለው።",
    about_contact_office_title: "ዋና ቢሮና የመገኛ አድራሻ",
    about_contact_address_line: "አዲስ አበባ፣ ኢትዮጵያ · ቦሌ ክ/ከተማ",
    about_contact_phone_title: "የደንበኞች ድጋፍና ማረጋገጫ ስልክ",
    about_contact_hours: "ከሰኞ – ቅዳሜ፡ ከጠዋቱ 2:00 – ማታ 12:00",
    about_cta_title: "የግንባታ ዕቃዎች ግዢዎን ዘመናዊ ለማድረግ ዝግጁ ነዎት?",
    about_cta_desc: "ከመቶዎች በላይ ከሚሆኑ ተቋራጮችና አቅራቢ መጋዘኖች ጋር በመቀላቀል ግንባታዎን ያፋጥኑ።",
    about_cta_buyer_btn: "ግዢ ይጀምሩ",
    about_cta_seller_btn: "እንደ አቅራቢ መጋዘን ይመዝገቡ",
  },
};

/**
 * Resolves localized category name from slug or title
 */
export function getCategoryTitle(slug: string, fallback: string, locale: Locale): string {
  const normalized = slug.toLowerCase().replace(/[^a-z]/g, "");
  const dict = translations[locale] || translations.en;

  if (normalized.includes("cement")) return dict.cat_cement ?? fallback;
  if (normalized.includes("steel") || normalized.includes("rebar")) return dict.cat_steel ?? fallback;
  if (normalized.includes("roof")) return dict.cat_roofing ?? fallback;
  if (normalized.includes("paint")) return dict.cat_paint ?? fallback;
  if (normalized.includes("tile") || normalized.includes("ceramic")) return dict.cat_tiles ?? fallback;
  if (normalized.includes("electric")) return dict.cat_electrical ?? fallback;
  if (normalized.includes("plumb") || normalized.includes("pipe")) return dict.cat_plumbing ?? fallback;
  if (normalized.includes("aggregate") || normalized.includes("sand")) return dict.cat_aggregates ?? fallback;

  return fallback;
}

/**
 * Resolves localized category description
 */
export function getCategoryDescription(slug: string, fallback: string, locale: Locale): string {
  const normalized = slug.toLowerCase().replace(/[^a-z]/g, "");
  const dict = translations[locale] || translations.en;

  if (normalized.includes("cement")) return dict.cat_cement_desc ?? fallback;
  if (normalized.includes("steel") || normalized.includes("rebar")) return dict.cat_steel_desc ?? fallback;
  if (normalized.includes("roof")) return dict.cat_roofing_desc ?? fallback;
  if (normalized.includes("paint")) return dict.cat_paint_desc ?? fallback;
  if (normalized.includes("tile") || normalized.includes("ceramic")) return dict.cat_tiles_desc ?? fallback;
  if (normalized.includes("electric")) return dict.cat_electrical_desc ?? fallback;
  if (normalized.includes("plumb") || normalized.includes("pipe")) return dict.cat_plumbing_desc ?? fallback;
  if (normalized.includes("aggregate") || normalized.includes("sand")) return dict.cat_aggregates_desc ?? fallback;

  return fallback;
}

/**
 * Resolves localized unit label
 */
export function getLocalizedUnit(unit: string, locale: Locale): string {
  const dict = translations[locale] || translations.en;
  const key = `unit_${unit.toUpperCase()}`;
  return dict[key] ?? unit;
}

/**
 * Resolves localized singular unit label
 */
export function getLocalizedSingularUnit(unit: string, locale: Locale): string {
  const dict = translations[locale] || translations.en;
  const key = `unit_singular_${unit.toUpperCase()}`;
  return dict[key] ?? unit.toLowerCase();
}

/**
 * Resolves localized status label
 */
export function getLocalizedStatus(status: string, locale: Locale): string {
  const dict = translations[locale] || translations.en;
  const key = `status_${status.toUpperCase()}`;
  return dict[key] ?? status;
}

/**
 * Resolves localized Ethiopian depot / warehouse location names
 */
export function getLocalizedLocation(location: string, locale: Locale): string {
  if (locale !== "am") return location;
  const lower = location.toLowerCase();

  if (lower.includes("addis")) return "አዲስ አበባ";
  if (lower.includes("adama") || lower.includes("nazret")) return "አዳማ (ናዝሬት)";
  if (lower.includes("bahir")) return "ባሕር ዳር";
  if (lower.includes("hawassa") || lower.includes("awassa")) return "ሐዋሳ";
  if (lower.includes("dire")) return "ድሬዳዋ";
  if (lower.includes("sululta")) return "ሱሉልታ";
  if (lower.includes("mekelle") || lower.includes("mekele")) return "መቀሌ";
  if (lower.includes("gelan")) return "ገላን";
  if (lower.includes("kality")) return "ቃሊቲ";
  if (lower.includes("merkato")) return "መርካቶ";
  if (lower.includes("sebeta")) return "ሰበታ";
  if (lower.includes("bishoftu") || lower.includes("debre zeyit")) return "ቢሾፍቱ (ደብረ ዘይት)";

  return location;
}

/**
 * Formats price with appropriate Ethiopian currency representation
 */
export function formatPrice(amount: number, locale: Locale = "en"): string {
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return locale === "am" ? `${formatted} ብር` : `ETB ${formatted}`;
}
