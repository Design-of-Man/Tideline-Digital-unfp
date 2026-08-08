import { Field, Input, FormError } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-xl font-semibold text-slate-900">Design of Man</div>
          <div className="text-sm text-slate-500">Books &amp; Accounting</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <form action={signIn} className="space-y-4">
            {error && <FormError message={error} />}
            {message && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
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
                className="text-xs text-slate-500 hover:text-slate-700 text-center"
              >
                First time? Create an account
              </button>
            </div>
          </form>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">
          Restrict sign-ups to the owners in your Supabase Auth settings.
        </p>
      </div>
    </div>
  );
}
