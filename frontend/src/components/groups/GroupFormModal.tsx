"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { GlassModal, GlassInput, GlassSelect } from "@/components/glass";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCreateGroup, useUpdateGroup } from "@/hooks/useGroups";
import { createGroupSchema, type CreateGroupFormValues } from "@/lib/validations/group";
import { CURRENCIES } from "@/lib/utils/constants";
import { ApiError, friendlyErrorMessage } from "@/lib/api/errors";
import type { Group } from "@/types/group";

export interface GroupFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: Group;
}

export function GroupFormModal({ open, onOpenChange, group }: GroupFormModalProps) {
  const router = useRouter();
  const isEditing = Boolean(group);
  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup(group?._id ?? "");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: group?.name ?? "", description: group?.description ?? "", currency: (group?.currency as CreateGroupFormValues["currency"]) ?? "INR" }
  });

  React.useEffect(() => {
    if (open) {
      reset({ name: group?.name ?? "", description: group?.description ?? "", currency: (group?.currency as CreateGroupFormValues["currency"]) ?? "INR" });
    }
  }, [open, group, reset]);

  async function onSubmit(values: CreateGroupFormValues) {
    try {
      if (isEditing && group) {
        await updateGroup.mutateAsync(values);
        toast.success("Group updated");
      } else {
        const created = await createGroup.mutateAsync(values);
        toast.success("Group created");
        router.push(`/groups/${created._id}`);
      }
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof ApiError ? friendlyErrorMessage(err) : "Couldn't save this group.";
      toast.error(message);
    }
  }

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit group" : "Create a group"}
      description={isEditing ? undefined : "Give it a name your friends will recognize."}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <GlassInput label="Group name" placeholder="Goa Trip" error={errors.name?.message} {...register("name")} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="group-description">Description</Label>
          <Textarea id="group-description" placeholder="Optional" {...register("description")} />
          {errors.description && <p className="text-xs text-accent-rose">{errors.description.message}</p>}
        </div>
        <GlassSelect
          label="Currency"
          value={watch("currency")}
          onValueChange={(v) => setValue("currency", v as CreateGroupFormValues["currency"])}
          options={CURRENCIES.map((c) => ({ value: c, label: c }))}
        />

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEditing ? "Save changes" : "Create group"}
          </Button>
        </div>
      </form>
    </GlassModal>
  );
}
