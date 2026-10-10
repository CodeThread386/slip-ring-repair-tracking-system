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
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="animate-fade-in-up w-full max-w-md space-y-8 rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold tracking-wide text-white shadow-lg shadow-indigo-500/30 mb-6">
            SR
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
            Welcome back
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
