"use client";

import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="flex justify-center items-center py-12">
      <SignUp routing="hash" fallbackRedirectUrl="/dashboard" signInUrl="/login" />
    </div>
  );
}
