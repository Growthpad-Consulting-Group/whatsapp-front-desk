import { redirect } from "next/navigation";

/**
 * Root route — middleware handles auth-aware redirects,
 * but this catches any direct hits to "/".
 */
export default function RootPage() {
  redirect("/dashboard");
}
