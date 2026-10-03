// =============================================================================
// ConMart — Proforma Invoice PDF Document
// =============================================================================
// Rendered server-side via @react-pdf/renderer and streamed as a PDF download.
// Mirrors the visual layout of proforma-view.tsx faithfully.
// =============================================================================

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { OrderDetails } from "@/app/actions/orders";
import { formatETB } from "@/lib/types";

// ---------------------------------------------------------------------------
// Fonts — register a Unicode-capable font so Amharic glyphs survive PDF export
// ---------------------------------------------------------------------------
// We use Noto Sans Ethiopic for Amharic text and Noto Sans for Latin.
// These are loaded from Google Fonts CDN at render time (server-side only).
Font.register({
  family: "NotoSans",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/notosans/v36/o-0IIpQlx3QUlC5A4PNr5TRASf6M7Q.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/notosans/v36/o-0NIpQlx3QUlC5A4PNjXhFVatyBx2pqPIif.ttf",
      fontWeight: "bold",
    },
  ],
});

Font.register({
  family: "NotoSansEthiopic",
  src: "https://fonts.gstatic.com/s/notosansethiopic/v45/0FlxfHEM2cNTmOQbDQjHAVjMc6_-s2Q97e6dSXBNLTe-G1JrIm-3A_nfBFOH.ttf",
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const C = {
  primary: "#f59e0b",   // amber-400
  dark: "#111827",      // gray-900
  muted: "#6b7280",     // gray-500
  border: "#e5e7eb",    // gray-200
  bg: "#ffffff",
  accent: "#fef3c7",    // amber-100
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSans",
    backgroundColor: C.bg,
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 52,
    fontSize: 9,
    color: C.dark,
    lineHeight: 1.5,
  },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  brandName: { fontSize: 18, fontWeight: "bold", color: C.dark },
  brandSub: { fontSize: 8, color: C.muted, marginTop: 2 },
  refBlock: { alignItems: "flex-end" },
  refCode: { fontSize: 14, fontWeight: "bold", color: C.primary, fontFamily: "NotoSans" },
  refDate: { fontSize: 8, color: C.muted, marginTop: 2 },

  // Status badge
  badgeRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 4 },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 8,
    fontWeight: "bold",
  },
  badgeGenerated: { backgroundColor: "#fef3c7", color: "#92400e" },
  badgeDelivered: { backgroundColor: "#d1fae5", color: "#065f46" },
  badgeCancelled: { backgroundColor: "#fee2e2", color: "#991b1b" },

  // Divider
  divider: { borderBottomWidth: 1, borderBottomColor: C.border, marginVertical: 16 },

  // Parties section
  partiesRow: { flexDirection: "row", gap: 32 },
  partyBlock: { flex: 1 },
  sectionLabel: {
    fontSize: 7,
    fontWeight: "bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  partyName: { fontSize: 10, fontWeight: "bold", color: C.dark, marginBottom: 2 },
  partyLine: { fontSize: 8.5, color: C.muted, marginBottom: 1 },

  // Items table
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 5,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 5,
  },
  colMaterial: { flex: 3 },
  colLocation: { flex: 2 },
  colQty: { flex: 1.2, textAlign: "right" },
  colUnit: { flex: 1.5, textAlign: "right" },
  colSubtotal: { flex: 1.8, textAlign: "right" },
  thText: { fontSize: 7.5, fontWeight: "bold", color: C.muted, textTransform: "uppercase" },
  tdText: { fontSize: 8.5, color: C.dark },
  tdMuted: { fontSize: 8.5, color: C.muted },

  // Totals
  totalsBlock: { alignSelf: "flex-end", width: 200, marginTop: 12 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  totalLabel: { fontSize: 8.5, color: C.muted },
  totalValue: { fontSize: 8.5, color: C.muted },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1.5,
    borderTopColor: C.dark,
  },
  grandTotalLabel: { fontSize: 11, fontWeight: "bold", color: C.dark },
  grandTotalValue: { fontSize: 11, fontWeight: "bold", color: C.primary },

  // Notes
  noteTitle: { fontSize: 8.5, fontWeight: "bold", color: C.dark, marginBottom: 6 },
  noteItem: { fontSize: 7.5, color: C.muted, marginBottom: 3, paddingLeft: 8 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 32,
    left: 52,
    right: 52,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { fontSize: 7, color: C.muted },
  footerBrand: { fontSize: 8, fontWeight: "bold", color: C.dark },
  watermark: {
    position: "absolute",
    top: 280,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 64,
    color: "#f3f4f6",
    fontWeight: "bold",
    opacity: 0.5,
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------


function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getBadgeStyle(status: string) {
  if (status === "DELIVERED") return styles.badgeDelivered;
  if (status === "CANCELLED") return styles.badgeCancelled;
  return styles.badgeGenerated;
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    GENERATED: "GENERATED",
    CONFIRMED: "CONFIRMED",
    PAID: "PAID",
    DISPATCHED: "DISPATCHED",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
  };
  return map[status] ?? status;
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------
const NOTES = [
  "This proforma is valid for 72 hours from the date of issue.",
  "Contact ECON Operations to confirm stock availability before payment.",
  "Payment must be made via bank transfer or Chapa/TeleBirr to the account confirmed by ECON Operations.",
  "15% VAT is included in the grand total as required by Ethiopian tax law.",
  "Prices are in Ethiopian Birr (ETB) and include depot loading fees.",
];

// ---------------------------------------------------------------------------
// PDF Document Component
// ---------------------------------------------------------------------------
interface ProformaDocumentProps {
  order: OrderDetails;
  adminPhone: string;
}

export function ProformaDocument({ order, adminPhone }: ProformaDocumentProps) {
  const badgeStyle = getBadgeStyle(order.status);

  return (
    <Document
      title={`ECON Proforma Invoice #${order.referenceCode}`}
      author="ECON Ethiopia"
      subject="Proforma Invoice"
      keywords="econ, ethiopia, construction, cement, proforma"
      creator="ECON Platform"
      producer="ECON Ethiopia"
    >
      <Page size="A4" style={styles.page}>
        {/* Faint watermark for cancelled orders */}
        {order.status === "CANCELLED" && (
          <Text style={styles.watermark}>CANCELLED</Text>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* HEADER                                                           */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>ECON Ethiopia</Text>
            <Text style={styles.brandSub}>
              B2B Construction Materials Marketplace
            </Text>
          </View>
          <View style={styles.refBlock}>
            <Text style={styles.refCode}>#{order.referenceCode}</Text>
            <Text style={styles.refDate}>
              Issued: {formatDate(order.createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <Text style={[styles.badge, badgeStyle]}>
            {statusLabel(order.status)}
          </Text>
        </View>

        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: C.dark,
            marginTop: 8,
            marginBottom: 2,
          }}
        >
          PROFORMA INVOICE
        </Text>
        <Text style={{ fontSize: 8, color: C.muted }}>
          Official document for bank financing and procurement approval
        </Text>

        <View style={styles.divider} />

        {/* ---------------------------------------------------------------- */}
        {/* PARTIES                                                          */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.partiesRow}>
          <View style={styles.partyBlock}>
            <Text style={styles.sectionLabel}>Bill To (Buyer)</Text>
            <Text style={styles.partyName}>
              {order.buyer.companyName || "Commercial Buyer"}
            </Text>
            <Text style={styles.partyLine}>{order.buyer.name}</Text>
            <Text style={styles.partyLine}>{order.buyer.phone}</Text>
          </View>
          <View style={styles.partyBlock}>
            <Text style={styles.sectionLabel}>Supplied By (Depot)</Text>
            <Text style={styles.partyName}>
              {order.seller.companyName || "ECON Verified Depot"}
            </Text>
            <Text style={styles.partyLine}>Verified Supplier</Text>
            <Text style={styles.partyLine}>
              {order.items[0]?.location ?? "Addis Ababa"}, Ethiopia
            </Text>
          </View>
          <View style={styles.partyBlock}>
            <Text style={styles.sectionLabel}>ECON Operations</Text>
            <Text style={styles.partyName}>ECON Ethiopia</Text>
            <Text style={styles.partyLine}>{adminPhone}</Text>
            <Text style={styles.partyLine}>operations@econ.et</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ---------------------------------------------------------------- */}
        {/* LINE ITEMS TABLE                                                 */}
        {/* ---------------------------------------------------------------- */}
        <Text style={styles.sectionLabel}>
          Order Details ({order.items.length}{" "}
          {order.items.length === 1 ? "Item" : "Items"})
        </Text>

        {/* Table header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.thText, styles.colMaterial]}>Material</Text>
          <Text style={[styles.thText, styles.colLocation]}>Depot Location</Text>
          <Text style={[styles.thText, styles.colQty]}>Qty</Text>
          <Text style={[styles.thText, styles.colUnit]}>Unit Price</Text>
          <Text style={[styles.thText, styles.colSubtotal]}>Subtotal</Text>
        </View>

        {/* Table rows */}
        {order.items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.tdText, styles.colMaterial]}>
              {item.productTitle}
            </Text>
            <Text style={[styles.tdMuted, styles.colLocation]}>
              {item.location}
            </Text>
            <Text style={[styles.tdMuted, styles.colQty]}>
              {item.qty.toLocaleString()} {item.productUnit}
            </Text>
            <Text style={[styles.tdMuted, styles.colUnit]}>
              {formatETB(item.unitPrice)}
            </Text>
            <Text style={[styles.tdText, styles.colSubtotal]}>
              {formatETB(item.subtotal)}
            </Text>
          </View>
        ))}

        {/* ---------------------------------------------------------------- */}
        {/* TOTALS                                                           */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatETB(order.baseSubtotal)}</Text>
          </View>
          {order.platformFee > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Platform Fee</Text>
              <Text style={styles.totalValue}>{formatETB(order.platformFee)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>VAT (15%)</Text>
            <Text style={styles.totalValue}>{formatETB(order.tax)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>{formatETB(order.grandTotal)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ---------------------------------------------------------------- */}
        {/* NOTES                                                            */}
        {/* ---------------------------------------------------------------- */}
        <Text style={styles.noteTitle}>Terms & Conditions</Text>
        {NOTES.map((note, i) => (
          <Text key={i} style={styles.noteItem}>
            {i + 1}. {note}
          </Text>
        ))}

        {/* ---------------------------------------------------------------- */}
        {/* FOOTER                                                           */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated by ECON Ethiopia Platform · Ref #{order.referenceCode}
          </Text>
          <Text style={styles.footerBrand}>econ.et</Text>
          <Text style={styles.footerText}>{adminPhone}</Text>
        </View>
      </Page>
    </Document>
  );
}
