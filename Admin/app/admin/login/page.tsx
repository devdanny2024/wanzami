import { redirect } from "next/navigation";

// The real, branded admin sign-in lives inside the admin shell at `/`
// (src/components/AdminLogin.tsx). This route used to render a second,
// unstyled login form that wrote tokens to localStorage and then went nowhere —
// the dead end invited admins landed on. It now just forwards to the real one
// so any link already in the wild still works.
export default function AdminLoginRedirect() {
  redirect("/");
}
