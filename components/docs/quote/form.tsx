'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { DateField } from '@/components/date-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FORM_INPUT_TRIGGER_CLASS,
  FormField,
  FormRepeatableCard,
  FormSection,
  LogoField
} from '@/components/doc/form-fields';
import { SignaturePad } from '@/components/doc/signature-pad';
import { SheetProps } from '@/lib/doc/types';
import { Party, QuoteDoc, QuoteItem, newItem, resolveSignatureColor } from '@/lib/doc/types';

const PARTY_PLACEHOLDERS: Record<'from' | 'to', { name: string; detail: string }> = {
  from: { name: 'Tu nombre o empresa', detail: 'CUIT, email, teléfono, dirección…' },
  to: { name: 'Nombre del cliente', detail: 'Empresa, email, dirección…' }
};

/** All the fields that make up a presupuesto — the counterpart to
 *  QuoteSheet, which only ever renders the result. Everything the user types
 *  lives in `doc.body`. */
export function QuoteForm({ doc: docProp, onChange, onLogoFile, onEditStyle }: SheetProps) {
  const doc = docProp as QuoteDoc;

  // Whether the discount/tax fields show at all — separate from the % value
  // itself, so ticking the box doesn't force a number. Defaults to "already
  // has a value" so a loaded draft/share link opens showing what it carries.
  const [discountOn, setDiscountOn] = React.useState(doc.body.discountPct > 0);
  const [taxOn, setTaxOn] = React.useState(doc.body.taxPct > 0);
  const showDiscount = discountOn || doc.body.discountPct > 0;
  const showTax = taxOn || doc.body.taxPct > 0;

  const patchBody = (patch: Partial<QuoteDoc['body']>) =>
    onChange?.({ body: { ...doc.body, ...patch } });
  const patchParty = (key: 'from' | 'to', patch: Partial<Party>) =>
    patchBody({ [key]: { ...doc.body[key], ...patch } });
  const patchItem = (id: string, patch: Partial<QuoteItem>) =>
    patchBody({ items: doc.body.items.map(it => (it.id === id ? { ...it, ...patch } : it)) });
  const addItem = () => patchBody({ items: [...doc.body.items, newItem()] });
  const removeItem = (id: string) =>
    patchBody({ items: doc.body.items.filter(it => it.id !== id) });

  const numField = (value: number, onValue: (v: number) => void) => ({
    type: 'number' as const,
    min: 0,
    step: 'any',
    value: value === 0 ? '' : value,
    placeholder: '0',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onValue(Number.isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)
  });

  return (
    <div className="flex flex-col gap-4">
      <FormSection title="Documento">
        <FormField label="Nombre" htmlFor="q-name">
          <Input
            id="q-name"
            value={doc.body.name}
            onChange={e => patchBody({ name: e.target.value })}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Fecha">
            <DateField
              label="Fecha"
              value={doc.body.date}
              onChange={iso => patchBody({ date: iso })}
              triggerClassName={FORM_INPUT_TRIGGER_CLASS}
            />
          </FormField>
          <FormField label="Válido hasta">
            <DateField
              label="Válido hasta"
              value={doc.body.validUntil}
              onChange={iso => patchBody({ validUntil: iso })}
              triggerClassName={FORM_INPUT_TRIGGER_CLASS}
            />
          </FormField>
        </div>
        <FormField label="Logo (opcional)">
          <LogoField
            logo={doc.body.logo}
            onLogoFile={file => onLogoFile?.(file)}
            onRemove={() => patchBody({ logo: undefined })}
          />
        </FormField>
      </FormSection>

      <FormSection title="De">
        <FormField label="Nombre" htmlFor="q-from-name">
          <Input
            id="q-from-name"
            value={doc.body.from.name}
            onChange={e => patchParty('from', { name: e.target.value })}
            placeholder={PARTY_PLACEHOLDERS.from.name}
          />
        </FormField>
        <FormField label="Datos de contacto" htmlFor="q-from-detail">
          <Textarea
            id="q-from-detail"
            value={doc.body.from.detail}
            onChange={e => patchParty('from', { detail: e.target.value })}
            placeholder={PARTY_PLACEHOLDERS.from.detail}
          />
        </FormField>
      </FormSection>

      <FormSection title="Para">
        <FormField label="Nombre" htmlFor="q-to-name">
          <Input
            id="q-to-name"
            value={doc.body.to.name}
            onChange={e => patchParty('to', { name: e.target.value })}
            placeholder={PARTY_PLACEHOLDERS.to.name}
          />
        </FormField>
        <FormField label="Datos de contacto" htmlFor="q-to-detail">
          <Textarea
            id="q-to-detail"
            value={doc.body.to.detail}
            onChange={e => patchParty('to', { detail: e.target.value })}
            placeholder={PARTY_PLACEHOLDERS.to.detail}
          />
        </FormField>
      </FormSection>

      <FormSection
        title="Ítems"
        action={
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={addItem}
            className="text-muted-foreground hover:text-foreground"
          >
            <Plus /> Agregar línea
          </Button>
        }
      >
        {doc.body.items.map((it, i) => (
          <FormRepeatableCard
            key={it.id}
            label={`Línea ${i + 1}`}
            onRemove={() => removeItem(it.id)}
            removeDisabled={doc.body.items.length === 1}
            removeLabel="Eliminar línea"
          >
            <FormField label="Descripción" htmlFor={`q-item-desc-${it.id}`}>
              <Textarea
                id={`q-item-desc-${it.id}`}
                value={it.description}
                onChange={e => patchItem(it.id, { description: e.target.value })}
                placeholder="Servicio o producto"
                className="min-h-9"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Cantidad" htmlFor={`q-item-qty-${it.id}`}>
                <Input
                  id={`q-item-qty-${it.id}`}
                  {...numField(it.quantity, v => patchItem(it.id, { quantity: v }))}
                />
              </FormField>
              <FormField label="Precio unitario" htmlFor={`q-item-price-${it.id}`}>
                <Input
                  id={`q-item-price-${it.id}`}
                  {...numField(it.unitPrice, v => patchItem(it.id, { unitPrice: v }))}
                />
              </FormField>
            </div>
          </FormRepeatableCard>
        ))}
      </FormSection>

      <FormSection title="Totales">
        <div className="flex items-center gap-2">
          <Checkbox
            id="q-discount-on"
            checked={showDiscount}
            onCheckedChange={c => setDiscountOn(c === true)}
          />
          <label htmlFor="q-discount-on" className="text-sm">
            Descuento
          </label>
        </div>
        {showDiscount && (
          <FormField label="Porcentaje de descuento" htmlFor="q-discount-pct" className="max-w-32">
            <Input
              id="q-discount-pct"
              max={100}
              {...numField(doc.body.discountPct, v => patchBody({ discountPct: v }))}
            />
          </FormField>
        )}
        <div className="flex items-center gap-2">
          <Checkbox id="q-tax-on" checked={showTax} onCheckedChange={c => setTaxOn(c === true)} />
          <label htmlFor="q-tax-on" className="text-sm">
            Impuesto
          </label>
        </div>
        {showTax && (
          <FormField label="Porcentaje de impuesto" htmlFor="q-tax-pct" className="max-w-32">
            <Input id="q-tax-pct" {...numField(doc.body.taxPct, v => patchBody({ taxPct: v }))} />
          </FormField>
        )}
      </FormSection>

      <FormSection title="Notas y condiciones">
        <Textarea
          value={doc.body.notes}
          onChange={e => patchBody({ notes: e.target.value })}
          placeholder="Forma de pago, plazos de entrega, alcance del trabajo…"
          aria-label="Notas y condiciones"
        />
      </FormSection>

      <FormSection title="Firma">
        <SignaturePad
          value={doc.body.signature}
          onChange={dataUrl => patchBody({ signature: dataUrl })}
          color={resolveSignatureColor(doc)}
          onEditStyle={onEditStyle}
        />
      </FormSection>
    </div>
  );
}
