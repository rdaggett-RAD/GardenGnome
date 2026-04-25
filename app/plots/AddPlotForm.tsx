'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Map, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  Button,
  EmptyState,
  FormField,
  Input,
  Modal,
  Select,
  Textarea,
  useToast,
} from '@/components/ui';
import type { PlotCategory } from '@/lib/supabase/types';

const categoryOptions: Array<{ value: PlotCategory; label: string }> = [
  { value: 'orchard', label: 'Orchard' },
  { value: 'kitchen_garden', label: 'Kitchen garden' },
  { value: 'cut_flower_bed', label: 'Cut flower bed' },
  { value: 'field_crop', label: 'Field crop' },
  { value: 'mixed', label: 'Mixed use' },
];

const sunExposureOptions = [
  { value: 'full_sun', label: 'Full sun' },
  { value: 'part_shade', label: 'Part shade' },
  { value: 'shade', label: 'Shade' },
];

interface FormState {
  name: string;
  category: PlotCategory;
  lengthFt: string;
  widthFt: string;
  sunHours: string;
  sunExposure: string;
  description: string;
}

interface FormErrors {
  name?: string;
  category?: string;
  lengthFt?: string;
  widthFt?: string;
  sunHours?: string;
  sunExposure?: string;
  description?: string;
  form?: string;
}

const initialForm: FormState = {
  name: '',
  category: 'kitchen_garden',
  lengthFt: '',
  widthFt: '',
  sunHours: '',
  sunExposure: 'full_sun',
  description: '',
};

function deriveSunExposure(hours: number): string {
  if (hours >= 6) return 'full_sun';
  if (hours >= 3) return 'part_shade';
  return 'shade';
}

function parsePositiveNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.NaN;
}

function parseSunHours(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 14
    ? parsed
    : Number.NaN;
}

export function AddPlotForm({
  propertyId,
  userId,
  triggerLabel = 'Add plot',
  trigger = 'button',
}: {
  propertyId: string;
  userId: string;
  triggerLabel?: string;
  trigger?: 'button' | 'empty';
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const calculatedArea = useMemo(() => {
    const length = Number(form.lengthFt);
    const width = Number(form.widthFt);
    if (!Number.isFinite(length) || !Number.isFinite(width)) return null;
    if (length <= 0 || width <= 0) return null;
    return Math.round(length * width * 100) / 100;
  }, [form.lengthFt, form.widthFt]);

  function resetAndClose() {
    setOpen(false);
    setLoading(false);
    setErrors({});
    setForm(initialForm);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function setSunHours(value: string) {
    const parsed = Number(value);
    setForm((prev) => ({
      ...prev,
      sunHours: value,
      sunExposure: Number.isFinite(parsed)
        ? deriveSunExposure(parsed)
        : prev.sunExposure,
    }));
    if (errors.sunHours || errors.sunExposure) {
      setErrors((prev) => ({
        ...prev,
        sunHours: undefined,
        sunExposure: undefined,
      }));
    }
  }

  function validate(): boolean {
    const next: FormErrors = {};
    const length = parsePositiveNumber(form.lengthFt);
    const width = parsePositiveNumber(form.widthFt);
    const sunHours = parseSunHours(form.sunHours);

    if (!form.name.trim()) next.name = 'Give this plot a name';
    if (!form.category) next.category = 'Choose a plot category';
    if (Number.isNaN(length)) next.lengthFt = 'Use a positive number';
    if (Number.isNaN(width)) next.widthFt = 'Use a positive number';
    if (Number.isNaN(sunHours)) {
      next.sunHours = 'Use a whole number from 0 to 14';
    }
    if (!form.sunExposure) next.sunExposure = 'Choose sun exposure';
    if (form.description.length > 500) {
      next.description = 'Keep the description under 500 characters';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    const length = parsePositiveNumber(form.lengthFt);
    const width = parsePositiveNumber(form.widthFt);
    const sunHours = parseSunHours(form.sunHours);

    const supabase = createClient();
    const { error } = await supabase.from('plots').insert({
      property_id: propertyId,
      user_id: userId,
      name: form.name.trim(),
      category: form.category,
      length_ft: Number.isNaN(length) ? null : length,
      width_ft: Number.isNaN(width) ? null : width,
      sun_hours: Number.isNaN(sunHours) ? null : sunHours,
      sun_exposure: form.sunExposure,
      description: form.description.trim() || null,
    });

    if (error) {
      setErrors({ form: error.message });
      setLoading(false);
      return;
    }

    toast({
      variant: 'success',
      title: 'Plot saved',
      description: `${form.name.trim()} is ready for planning.`,
    });
    resetAndClose();
    router.refresh();
  }

  return (
    <>
      {trigger === 'empty' ? (
        <EmptyState
          icon={Map}
          title="No plots yet"
          description="Define your first garden area so the plan has somewhere to put trees, vegetables, flowers, or field crops."
          actionLabel={triggerLabel}
          onAction={() => setOpen(true)}
        />
      ) : (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          leftIcon={<Plus size={18} aria-hidden="true" />}
        >
          {triggerLabel}
        </Button>
      )}

      <Modal
        open={open}
        onClose={resetAndClose}
        title="Add plot"
        description="Define a garden area for this property."
        size="lg"
        preventBackdropClose={loading}
      >
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <FormField
            label="Plot name"
            htmlFor="plot-name"
            required
            helper="A short label like South Orchard or Raised Bed 1"
            error={errors.name}
          >
            <Input
              id="plot-name"
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              hasError={!!errors.name}
              disabled={loading}
              maxLength={100}
              autoFocus
            />
          </FormField>

          <FormField
            label="Category"
            htmlFor="plot-category"
            required
            error={errors.category}
          >
            <Select
              id="plot-category"
              value={form.category}
              onChange={(e) =>
                setField('category', e.target.value as PlotCategory)
              }
              hasError={!!errors.category}
              disabled={loading}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Length"
              htmlFor="plot-length"
              helper="Feet"
              error={errors.lengthFt}
            >
              <Input
                id="plot-length"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                value={form.lengthFt}
                onChange={(e) => setField('lengthFt', e.target.value)}
                hasError={!!errors.lengthFt}
                disabled={loading}
              />
            </FormField>

            <FormField
              label="Width"
              htmlFor="plot-width"
              helper={
                calculatedArea ? `Area: ${calculatedArea} sq ft` : 'Feet'
              }
              error={errors.widthFt}
            >
              <Input
                id="plot-width"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                value={form.widthFt}
                onChange={(e) => setField('widthFt', e.target.value)}
                hasError={!!errors.widthFt}
                disabled={loading}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Sun hours"
              htmlFor="plot-sun-hours"
              helper="Direct sun per day, 0 to 14"
              error={errors.sunHours}
            >
              <Input
                id="plot-sun-hours"
                type="number"
                inputMode="numeric"
                min="0"
                max="14"
                step="1"
                value={form.sunHours}
                onChange={(e) => setSunHours(e.target.value)}
                hasError={!!errors.sunHours}
                disabled={loading}
              />
            </FormField>

            <FormField
              label="Sun exposure"
              htmlFor="plot-sun-exposure"
              helper="Auto-filled from sun hours; adjust if needed"
              error={errors.sunExposure}
            >
              <Select
                id="plot-sun-exposure"
                value={form.sunExposure}
                onChange={(e) => setField('sunExposure', e.target.value)}
                hasError={!!errors.sunExposure}
                disabled={loading}
              >
                {sunExposureOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField
            label="Description"
            htmlFor="plot-description"
            helper="Optional notes about location, soil, or irrigation"
            error={errors.description}
          >
            <Textarea
              id="plot-description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              hasError={!!errors.description}
              disabled={loading}
              rows={3}
              maxLength={500}
            />
          </FormField>

          {errors.form && (
            <div
              role="alert"
              className="text-sm text-terra-deep bg-terra/10 border border-terra/30 rounded-md px-3 py-2"
            >
              {errors.form}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={resetAndClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {loading ? 'Saving...' : 'Save plot'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
