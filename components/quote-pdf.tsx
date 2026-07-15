import { BRAND_NAME } from '@/lib/constants';
import { Document, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { Quote, TemplateId, computeTotals, formatMoney } from '@/lib/quote';

const SITE_URL = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;

type PdfTheme = {
  bg: string;
  ink: string;
  muted: string;
  accent: string;
  line: string;
  headRule: string;
  band?: string;
  font: string;
  fontBold: string;
};

const THEMES: Record<TemplateId, PdfTheme> = {
  minimal: {
    bg: '#ffffff',
    ink: '#171717',
    muted: '#737373',
    accent: '#171717',
    line: '#e5e5e5',
    headRule: '#171717',
    font: 'Helvetica',
    fontBold: 'Helvetica-Bold'
  },
  clasica: {
    bg: '#ffffff',
    ink: '#171717',
    muted: '#666666',
    accent: '#171717',
    line: '#d4d4d4',
    headRule: '#171717',
    font: 'Times-Roman',
    fontBold: 'Times-Bold'
  },
  calida: {
    bg: '#F7F2ED',
    ink: '#4A403B',
    muted: '#9C8578',
    accent: '#7C5C55',
    line: '#E4D8CC',
    headRule: '#B49286',
    band: '#EDE3D9',
    font: 'Times-Roman',
    fontBold: 'Times-Bold'
  }
};

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export function QuotePdf({ quote }: { quote: Quote }) {
  const t = THEMES[quote.template] ?? THEMES.minimal;
  const totals = computeTotals(quote);
  const money = (v: number) => formatMoney(v, quote.currency);

  const s = StyleSheet.create({
    page: {
      paddingVertical: 52,
      paddingHorizontal: 48,
      backgroundColor: t.bg,
      fontFamily: t.font,
      fontSize: 10,
      color: t.ink,
      lineHeight: 1.5
    },
    eyebrow: {
      fontSize: 7.5,
      letterSpacing: 2,
      color: t.muted,
      textTransform: 'uppercase'
    },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    number: {
      fontSize: 17,
      fontFamily: t.fontBold,
      marginTop: 4,
      color: t.accent
    },
    metaLabel: { color: t.muted },
    logoWrap: t.band
      ? {
          backgroundColor: t.band,
          borderRadius: 8,
          paddingHorizontal: 14,
          paddingVertical: 10
        }
      : {},
    partyName: { fontFamily: t.fontBold, marginTop: 4 },
    partyDetail: { color: t.muted, fontSize: 9 },
    tableHead: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: t.headRule,
      paddingBottom: 4,
      marginTop: 28
    },
    th: {
      fontSize: 7.5,
      letterSpacing: 1,
      color: t.muted,
      textTransform: 'uppercase'
    },
    tr: {
      flexDirection: 'row',
      borderBottomWidth: 0.5,
      borderBottomColor: t.line,
      paddingVertical: 5
    },
    colDesc: { flex: 1, paddingRight: 12 },
    colQty: { width: 50, textAlign: 'right' },
    colPrice: { width: 85, textAlign: 'right' },
    colAmount: { width: 90, textAlign: 'right' },
    totals: { alignItems: 'flex-end', marginTop: 12 },
    totalsBox: { width: 210 },
    totalsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 3
    },
    totalRow: t.band
      ? {
          flexDirection: 'row',
          justifyContent: 'space-between',
          backgroundColor: t.band,
          borderRadius: 4,
          paddingHorizontal: 8,
          paddingVertical: 5,
          marginTop: 3
        }
      : {
          flexDirection: 'row',
          justifyContent: 'space-between',
          borderTopWidth: 1,
          borderTopColor: t.headRule,
          paddingTop: 5,
          marginTop: 3
        },
    totalValue: { fontSize: 13, fontFamily: t.fontBold, color: t.accent },
    notes: { marginTop: 32 },
    notesText: { color: t.muted, fontSize: 9, marginTop: 4 },
    brandFooter: {
      position: 'absolute',
      bottom: 28,
      left: 48,
      right: 48,
      textAlign: 'center'
    },
    brandFooterText: { fontSize: 7.5, color: t.muted },
    brandFooterLink: { color: t.muted, textDecoration: 'underline' }
  });

  return (
    <Document title={`Presupuesto ${quote.number}`} author={quote.from.name || BRAND_NAME}>
      <Page size="A4" style={s.page}>
        <View style={s.row}>
          <View>
            <Text style={s.eyebrow}>Presupuesto</Text>
            <Text style={s.number}>{quote.number}</Text>
            <Text style={{ fontSize: 9, color: t.muted, marginTop: 2 }}>
              Fecha: {fmtDate(quote.date)} &middot; Válido hasta: {fmtDate(quote.validUntil)}
            </Text>
          </View>
          {quote.logo ? (
            <View style={s.logoWrap}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={quote.logo} style={{ width: 110, height: 40, objectFit: 'contain' }} />
            </View>
          ) : null}
        </View>

        <View style={[s.row, { marginTop: 28 }]}>
          {(
            [
              ['De', quote.from],
              ['Para', quote.to]
            ] as const
          ).map(([label, party]) => (
            <View key={label} style={{ width: '46%' }}>
              <Text style={s.eyebrow}>{label}</Text>
              <Text style={s.partyName}>{party.name || '—'}</Text>
              {party.detail ? <Text style={s.partyDetail}>{party.detail}</Text> : null}
            </View>
          ))}
        </View>

        <View style={s.tableHead}>
          <Text style={[s.th, s.colDesc]}>Descripción</Text>
          <Text style={[s.th, s.colQty]}>Cant.</Text>
          <Text style={[s.th, s.colPrice]}>Precio unit.</Text>
          <Text style={[s.th, s.colAmount]}>Importe</Text>
        </View>
        {quote.items
          .filter(it => it.description || it.unitPrice)
          .map(it => (
            <View key={it.id} style={s.tr} wrap={false}>
              <Text style={s.colDesc}>{it.description}</Text>
              <Text style={s.colQty}>{it.quantity}</Text>
              <Text style={s.colPrice}>{money(it.unitPrice)}</Text>
              <Text style={s.colAmount}>{money((it.quantity || 0) * (it.unitPrice || 0))}</Text>
            </View>
          ))}

        <View style={s.totals}>
          <View style={s.totalsBox}>
            <View style={s.totalsRow}>
              <Text style={s.metaLabel}>Subtotal</Text>
              <Text>{money(totals.subtotal)}</Text>
            </View>
            {totals.discount > 0 && (
              <View style={s.totalsRow}>
                <Text style={s.metaLabel}>Descuento ({quote.discountPct}%)</Text>
                <Text>- {money(totals.discount)}</Text>
              </View>
            )}
            {totals.tax > 0 && (
              <View style={s.totalsRow}>
                <Text style={s.metaLabel}>IVA / impuestos ({quote.taxPct}%)</Text>
                <Text>{money(totals.tax)}</Text>
              </View>
            )}
            <View style={s.totalRow}>
              <Text style={{ fontFamily: t.fontBold }}>Total</Text>
              <Text style={s.totalValue}>{money(totals.total)}</Text>
            </View>
          </View>
        </View>

        {quote.notes ? (
          <View style={s.notes}>
            <Text style={s.eyebrow}>Notas y condiciones</Text>
            <Text style={s.notesText}>{quote.notes}</Text>
          </View>
        ) : null}

        <Text style={[s.brandFooter, s.brandFooterText]} fixed>
          <Link src={SITE_URL} style={s.brandFooterLink}>
            Hecho con {BRAND_NAME} - {SITE_URL}
          </Link>
        </Text>
      </Page>
    </Document>
  );
}
