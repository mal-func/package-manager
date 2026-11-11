import { Link } from "react-router-dom";

import { ROUTES } from "@/routes/routeConfig";

import { AuthPageLayout, LoginForm } from "../components";
import { useAuthOptions, useLogin } from "../hooks";

export default function LoginPage() {
  const login = useLogin();
  const { data: options } = useAuthOptions();

  return (
    <AuthPageLayout>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <LoginForm {...login} />

        {/* Only offered when the server actually allows it — a link to a
            form that would just be refused is worse than no link. */}
        {options?.selfRegistration && (
          <p className="animate-fade-up text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link to={ROUTES.REGISTER} className="font-medium text-slate-900 underline-offset-4 hover:underline">
              Create one
            </Link>
          </p>
        )}
      </div>
    </AuthPageLayout>
  );
}
