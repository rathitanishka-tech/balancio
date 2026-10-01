"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { GlassSelect } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usersApi } from "@/lib/api/users";
import { CURRENCIES } from "@/lib/utils/constants";
import { ApiError, friendlyErrorMessage } from "@/lib/api/errors";

const TIMEZONES = ["Asia/Kolkata", "America/New_York", "Europe/London", "Asia/Singapore", "Australia/Sydney", "UTC"];

const preferencesSchema = z.object({
  currency: z.enum(CURRENCIES),
  timezone: z.string().min(1)
});
type PreferencesValues = z.infer<typeof preferencesSchema>;

export function PreferencesForm() {
  const { user, refreshUser } = useAuth();

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting, isDirty }
  } = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    values: user ? { currency: (user as any).currency as PreferencesValues["currency"], timezone: (user as any).timezone } : undefined
  });

  async function onSubmit(values: PreferencesValues) {
    try {
      await usersApi.updateMe(values);
      await refreshUser();
      toast.success("Preferences updated");
    } catch (err) {
      const message = err instanceof ApiError ? friendlyErrorMessage(err) : "Couldn't update your preferences.";
      toast.error(message);
    }
  }

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <GlassSelect
          label="Currency"
          value={watch("currency")}
          onValueChange={(v) => setValue("currency", v as PreferencesValues["currency"], { shouldDirty: true })}
          options={CURRENCIES.map((c) => ({ value: c, label: c }))}
        />
        <GlassSelect
          label="Timezone"
          value={watch("timezone")}
          onValueChange={(v) => setValue("timezone", v, { shouldDirty: true })}
          options={TIMEZONES.map((t) => ({ value: t, label: t }))}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Save preferences
        </Button>
      </div>
    </form>
  );
}
