/**
 * Same-site www → apex 301 for ameticapital.com.
 * Prefer zone Single Redirect when Rulesets API is available; this is the Pages fallback.
 * Never redirect to ameti.capital.
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === "www.ameticapital.com") {
    const location =
      "https://ameticapital.com" + url.pathname + url.search;
    return new Response(null, {
      status: 301,
      headers: {
        Location: location,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }
  return context.next();
}
