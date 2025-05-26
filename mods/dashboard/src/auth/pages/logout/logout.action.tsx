import { redirect } from "react-router";
import {
  destroySession,
  getSessionCookie
} from "~/auth/services/sessions/session.server";
import type { Route } from "./+types/logout.page";

export async function action({ request }: Route.ActionArgs) {
  const headers = request.headers.get("Cookie");
  const sessionCookie = await getSessionCookie(headers);

  return redirect("/auth/login", {
    headers: {
      "Set-Cookie": await destroySession(sessionCookie)
    }
  });
}
