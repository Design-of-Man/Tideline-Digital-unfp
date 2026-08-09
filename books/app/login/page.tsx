import { Field, Input, FormError } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { Logo, Wordmark } from "@/components/logo";
import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  return (
    <div className="dom-masthead min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-7">
          <Logo className="w-11 h-11 mb-3" />
          <Wordmark className="text-2xl text-parchment-100" />
          <div className="mt-1.5 font-mono text-[10px] tracking-[0.22em] uppercase text-brass-400">
            Books &amp; Accounting
          </div>
        </div>
        <div className="bg-card rounded-md border border-border p-6">
          <form action={signIn} className="space-y-4">
            {error && <FormError message={error} />}
            {message && (
              <div className="rounded-md bg-success/10 border border-success/30 px-3 py-2 text-sm text-success">
                {message}
              </div>
            )}
            <Field label="Email">
              <Input name="email" type="email" required autoComplete="email" />
            </Field>
            <Field label="Password">
              <Input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                minLength={6}
              />
            </Field>
            <div className="flex flex-col gap-2 pt-1">
              <SubmitButton className="w-full">Sign in</SubmitButton>
              <button
                type="submit"
                formAction={signUp}
                className="text-xs text-muted-foreground hover:text-foreground text-center"
              >
                First time? Create an account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
