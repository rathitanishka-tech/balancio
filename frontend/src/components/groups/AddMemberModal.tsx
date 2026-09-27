"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { GlassModal, GlassInput } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { useAddMember, useInviteMember } from "@/hooks/useGroups";
import { ApiError, friendlyErrorMessage } from "@/lib/api/errors";

interface FormValues {
  email: string;
}

export function AddMemberModal({
  open,
  onOpenChange,
  groupId
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}) {
  const addMember = useAddMember(groupId);
  const inviteMember = useInviteMember(groupId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    try {
      await addMember.mutateAsync({ email: values.email });
      toast.success("Member added");
      reset();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        // No account exists yet for that email - fall back to an invitation.
        try {
          await inviteMember.mutateAsync(values.email);
          toast.success("Invitation sent");
          reset();
          onOpenChange(false);
          return;
        } catch (inviteErr) {
          const message = inviteErr instanceof ApiError ? friendlyErrorMessage(inviteErr) : "Couldn't send an invitation.";
          toast.error(message);
          return;
        }
      }
      const message = err instanceof ApiError ? friendlyErrorMessage(err) : "Couldn't add this member.";
      toast.error(message);
    }
  }

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add a member"
      description="If they already have an account, they're added immediately. Otherwise, we'll send an invitation."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <GlassInput
          label="Email address"
          type="email"
          placeholder="friend@example.com"
          error={errors.email?.message}
          {...register("email", { required: "Enter an email address" })}
        />
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Add member
          </Button>
        </div>
      </form>
    </GlassModal>
  );
}
