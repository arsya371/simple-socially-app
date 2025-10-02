import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <SignUp 
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