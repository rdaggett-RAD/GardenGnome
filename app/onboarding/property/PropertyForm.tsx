'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Button,
  FormField,
  Input,
  useToast,
} from '@/components/ui';

interface FormState {
  name: string;
  address: string;
  totalAcreage: string;
}

interface FormErrors {
  name?: string;
  address?: string;
  totalAcreage?: string;
  form?: string;
}

interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export function PropertyForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>({
    name: '',
    address: '',
    totalAcreage: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function setField<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = 'Give your property a name';
    if (!form.address.trim()) next.address = 'Address is required';
    if (form.totalAcreage) {
      const n = Number(form.totalAcreage);
      if (Number.isNaN(n) || n <= 0) next.totalAcreage = 'Must be a positive number';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  /**
   * Try to geocode via the optional Edge Function. Returns null if the function
   * isn't deployed yet — the form continues with no lat/lng. This is intentional
   * graceful degradation: a Phase 1 build doesn't require geocoding to work.
   */
  async function tryGeocode(address: string): Promise<GeocodingResult | null> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address },
      });

      if (error || !data?.latitude) {
        return null;
      }

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        formattedAddress: data.formattedAddress ?? address,
      };
    } catch {
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    const geo = await tryGeocode(form.address);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrors({ form: 'Your session expired. Please sign in again.' });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('properties').insert({
      user_id: user.id,
      name: form.name.trim(),
      address: geo?.formattedAddress ?? form.address.trim(),
      latitude: geo?.latitude ?? null,
      longitude: geo?.longitude ?? null,
      total_acreage: form.totalAcreage ? Number(form.totalAcreage) : null,
      is_primary: true,
    });

    if (error) {
      setErrors({ form: error.message });
      setLoading(false);
      return;
    }

    toast({
      variant: 'success',
      title: 'Property saved',
      description: geo
        ? 'We\'ve got your location. Climate data coming next.'
        : 'Address saved. Set up Google Maps later to enable climate data.',
    });

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormField
        label="Property name"
        htmlFor="name"
        required
        helper="A short label like &quot;Home&quot; or &quot;The Farm&quot;"
        error={errors.name}
      >
        <Input
          id="name"
          type="text"
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          hasError={!!errors.name}
          autoFocus
          disabled={loading}
          maxLength={100}
        />
      </FormField>

      <FormField
        label="Address"
        htmlFor="address"
        required
        helper="Street address, city, state — used to fetch zone and frost dates"
        error={errors.address}
      >
        <Input
          id="address"
          type="text"
          value={form.address}
          onChange={(e) => setField('address', e.target.value)}
          hasError={!!errors.address}
          autoComplete="street-address"
          disabled={loading}
        />
      </FormField>

      <FormField
        label="Total acreage"
        htmlFor="totalAcreage"
        helper="Optional. Helps us scale recommendations."
        error={errors.totalAcreage}
      >
        <Input
          id="totalAcreage"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={form.totalAcreage}
          onChange={(e) => setField('totalAcreage', e.target.value)}
          hasError={!!errors.totalAcreage}
          disabled={loading}
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
        <Link
          href="/onboarding"
          className="text-sm text-ink-muted hover:text-ink underline self-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ivy rounded"
        >
          ← Back
        </Link>
        <Button type="submit" loading={loading}>
          {loading ? 'Saving…' : 'Save and continue'}
        </Button>
      </div>
    </form>
  );
}
