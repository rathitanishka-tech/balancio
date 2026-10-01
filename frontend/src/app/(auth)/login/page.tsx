import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center py-12">
      <SignIn routing="hash" />
    </div>
  );
}
