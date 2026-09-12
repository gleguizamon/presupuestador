import { BRAND_NAME, SITE_HOST, SITE_ORIGIN } from '@/lib/constants';
import { Document, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { FONT_FAMILIES, LAYOUT_THEMES, customPdfTheme, fmtDate } from '@/components/doc/pdf/theme';
import {
  Doc,
  QuoteDoc,
  computeTotals,
  docCreationDate,
  exportTitle,
  formatMoney
} from '@/lib/doc/types';

export function QuotePdf({ doc: docProp }: { doc: Doc }) {
  const doc = docProp as QuoteDoc;
  // On by default — only the Configuración toggle turns it off.
  const showBrandFooter = doc.config.showBrandFooter !== false;
  const layout =
    doc.style.layout === 'personalizado'
      ? customPdfTheme(doc.style.custom)
      : (LAYOUT_THEMES[doc.style.layout] ?? LAYOUT_THEMES.clasico);
  const font = FONT_FAMILIES[doc.style.font] ?? FONT_FAMILIES.sans;
  const t = { ...layout, ...font };
  const totals = computeTotals(doc.body);
  const money = (v: number) => formatMoney(v, doc.style.currencySign);

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
      // Match the on-screen title's line-box ratio (text-2xl → 2rem/1.5rem);
      // without it the descenders sit right on top of the date line below.
      lineHeight: 1.3,
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
    signature: { marginTop: 32 },
    signatureImg: { width: 150, height: 44, objectFit: 'contain', objectPositionX: 0 },
    signatureCaption: {
      marginTop: 3,
      paddingTop: 3,
      borderTopWidth: 0.5,
      borderTopColor: t.headRule,
      width: 150,
      fontSize: 8,
      color: t.muted
    },
    // Flows right under the content (no longer pinned to the page bottom), so
    // the document reads as ending where the content ends.
    brandFooter: {
      marginTop: 44,
      paddingTop: 10,
      borderTopWidth: 0.5,
      borderTopColor: t.line,
      textAlign: 'center'
    },
    brandFooterText: { fontSize: 7.5, color: t.muted, letterSpacing: 0.3 },
    brandFooterLink: { color: t.muted, textDecoration: 'none' }
  });

  return (
    <Document
      title={exportTitle(doc)}
      author={doc.body.from.name || BRAND_NAME}
      keywords={doc.config.keywords?.trim() || undefined}
      creationDate={docCreationDate(doc)}
    >
      <Page size="A4" style={s.page}>
        <View style={s.row}>
          <View>
            <Text style={s.eyebrow}>Presupuesto</Text>
            <Text style={s.number}>{doc.body.name}</Text>
            <Text style={{ fontSize: 9, color: t.muted, marginTop: 5 }}>
              Fecha: {fmtDate(doc.body.date)} &middot; Válido hasta: {fmtDate(doc.body.validUntil)}
            </Text>
          </View>
          {doc.body.logo ? (
            <View style={s.logoWrap}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={doc.body.logo} style={{ width: 110, height: 40, objectFit: 'contain' }} />
            </View>
          ) : null}
        </View>

        <View style={[s.row, { marginTop: 28 }]}>
          {(
            [
              ['De', doc.body.from],
              ['Para', doc.body.to]
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
        {doc.body.items
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
                <Text style={s.metaLabel}>Descuento ({doc.body.discountPct}%)</Text>
                <Text>- {money(totals.discount)}</Text>
              </View>
            )}
            {totals.tax > 0 && (
              <View style={s.totalsRow}>
                <Text style={s.metaLabel}>IVA / impuestos ({doc.body.taxPct}%)</Text>
                <Text>{money(totals.tax)}</Text>
              </View>
            )}
            <View style={s.totalRow}>
              <Text style={{ fontFamily: t.fontBold }}>Total</Text>
              <Text style={s.totalValue}>{money(totals.total)}</Text>
            </View>
          </View>
        </View>

        {doc.body.notes ? (
          <View style={s.notes}>
            <Text style={s.eyebrow}>Notas y condiciones</Text>
            <Text style={s.notesText}>{doc.body.notes}</Text>
          </View>
        ) : null}

        {doc.body.signature ? (
          <View style={s.signature} wrap={false}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={doc.body.signature} style={s.signatureImg} />
            <Text style={s.signatureCaption}>{doc.body.from.name || 'Firma'}</Text>
          </View>
        ) : null}

        {showBrandFooter ? (
          <View style={s.brandFooter} wrap={false}>
            <Text style={s.brandFooterText}>
              <Link src={SITE_ORIGIN} style={s.brandFooterLink}>
                {SITE_HOST}
              </Link>
            </Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
