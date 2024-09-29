import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn
        appearance={{
          elements: {
            footerAction: "hidden",
          },
        }}
        routing="hash"
      />
    </div>
  );
}