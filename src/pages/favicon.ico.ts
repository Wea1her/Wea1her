import type { APIRoute } from "astro";

export const GET: APIRoute = ({ redirect }) => {
  return redirect("/avatar.png?v=20260521", 302);
};
