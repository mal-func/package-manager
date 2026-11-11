import { Link } from "react-router-dom";

import { ROUTES } from "@/routes/routeConfig";

import { AuthPageLayout, RegisterForm } from "../components";
import { useAuthOptions, useRegister } from "../hooks";

export default function RegisterPage() {
  const registration = useRegister();
  const { data: options, isPending } = useAuthOptions();

  const signInLink = (
    <Link to={ROUTES.LOGIN} className="font-medium text-slate-900 underline-offset-4 hover:underline">
      Sign in
    </Link>
  );

  return (
    <AuthPageLayout>
      <div className="flex w-full max-w-sm flex-col gap-6">
        {isPending ? null : options?.selfRegistration ? (
          <RegisterForm {...registration} />
        ) : (
          // Reached by direct URL on a deployment with sign-up turned off
          // (the login page hides the link then). The server refuses
          // registration either way; this just says so up front.
          <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-700">
            <h1 className="mb-1 text-base font-semibold text-gray-900">Sign-up is turned off</h1>
            <p>Accounts on this deployment are created by an administrator. Ask yours for access.</p>
          </div>
        )}

        <p className="animate-fade-up text-center text-sm text-gray-500">Already have an account? {signInLink}</p>
      </div>
    </AuthPageLayout>
  );
}
