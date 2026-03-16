import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <h1 className="font-sans text-2xl font-bold">SA CRM</h1>
          <p className="text-xs text-muted-foreground">
            Sales Pipeline Management
          </p>
        </div>
        <SignUp />
      </div>
    </div>
  )
}
