import { PageHeader } from "@/components/common";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default function ProfilePage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <PageHeader title="Profile" description="Your personal information." />
      <ProfileForm />
    </div>
  );
}
