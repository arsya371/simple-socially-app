import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <SignIn 
        appearance={{
          elements: {
            card: {
              boxShadow: "none",
              backgroundColor: "transparent",
            }
          }
        }}
      />
    </div>
  );
}