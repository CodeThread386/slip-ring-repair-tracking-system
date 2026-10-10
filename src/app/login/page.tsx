'use client';

import { useActionState } from 'react';
import { login } from './actions';
import { buttonStyles, inputStyles } from '@/components/ui';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: { error?: string } | null, formData: FormData) => {
      const result = await login(formData);
      return result;
    },
    null
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="animate-fade-in-up w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-slate-200/60">
        <div className="text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-bold tracking-wide text-white mb-6 shadow-sm">
            SR
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Sign In
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">Please enter the master password</p>
        </div>
        
        <form action={formAction} className="mt-8 space-y-6">
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className={inputStyles}
              placeholder="Enter password"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isPending}
              className={`${buttonStyles.primary} w-full justify-center text-center`}
            >
              {isPending ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
