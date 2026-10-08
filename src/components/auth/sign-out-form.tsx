import { signOut } from "@/app/login/actions";

type SignOutFormProps = Readonly<{
  label: string;
}>;

export function SignOutForm({ label }: SignOutFormProps) {
  return (
    <form action={signOut} className="account-summary">
      <span title={label}>{label}</span>
      <button type="submit">Cerrar sesión</button>
    </form>
  );
}
