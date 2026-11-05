import type { SubmitEvent } from "react";

import { AlertCircle, Lock, Mail, UserRound, type LucideIcon } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import type { RegisterFormValues } from "../schemas/registerSchema";

interface RegisterFormProps {
  register: UseFormRegister<RegisterFormValues>;
  handleSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  errors: FieldErrors<RegisterFormValues>;
  isSubmitting: boolean;
}

// Same input styling as LoginForm, so the two auth screens match.
const inputBaseClasses =
  "w-full rounded-md border bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 transition-colors " +
  "focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

interface FieldProps {
  id: keyof RegisterFormValues;
  label: string;
  type: string;
  placeholder: string;
  autoComplete: string;
  icon: LucideIcon;
  props: RegisterFormProps;
}

function Field({ id, label, type, placeholder, autoComplete, icon: Icon, props }: FieldProps) {
  const error = props.errors[id];

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
          <Icon aria-hidden="true" className="h-4 w-4" />
        </span>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={props.isSubmitting}
          aria-invalid={error ? true : undefined}
          className={`${inputBaseClasses} ${error ? "border-red-300 focus:ring-red-200" : "border-gray-300"}`}
          {...props.register(id)}
        />
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-red-600">
          {error.message}
        </p>
      )}
    </div>
  );
}

export function RegisterForm(props: RegisterFormProps) {
  const { handleSubmit, errors, isSubmitting } = props;

  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Create your account</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          New accounts start with standard access; an administrator can grant more.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {errors.root && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{errors.root.message}</span>
          </div>
        )}

        <Field id="name" label="Full name" type="text" placeholder="Jane Doe" autoComplete="name" icon={UserRound} props={props} />
        <Field
          id="email"
          label="Email address"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          icon={Mail}
          props={props}
        />
        <Field
          id="password"
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          icon={Lock}
          props={props}
        />
        <Field
          id="confirmPassword"
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          icon={Lock}
          props={props}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}
