import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const targetUrl = url.searchParams.get("url");
  const referer = url.searchParams.get("referer") || "https://hianime.to/";

  if (!targetUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const headers = new Headers();
    headers.set("Referer", referer);
    headers.set("User-Agent", req.headers.get("user-agent") || "Mozilla/5.0");
    
    try {
      headers.set("Origin", new URL(referer).origin);
    } catch (e) {
      // Invalid referer URL
    }

    const range = req.headers.get("range");
    if (range) {
      headers.set("Range", range);
    }

    const response = await fetch(targetUrl, {
      headers,
      method: "GET",
    });

    const resHeaders = new Headers(response.headers);
    resHeaders.set("Access-Control-Allow-Origin", "*");
    resHeaders.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    resHeaders.set("Access-Control-Allow-Headers", "*");

    const contentType = response.headers.get("content-type") || "";

    // If it's a manifest file (.m3u8), we need to rewrite it to proxy the chunks as well
    if (
      contentType.includes("mpegurl") ||
      contentType.includes("application/vnd.apple.mpegurl") ||
      targetUrl.includes(".m3u8")
    ) {
      let text = await response.text();

      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
      const targetOrigin = new URL(targetUrl).origin;
      const proxyBaseUrl = `${url.origin}/api/stream-proxy?referer=${encodeURIComponent(referer)}&url=`;

      text = text
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return line;

          // Rewrite tags with URIs (e.g., #EXT-X-KEY)
          if (trimmed.startsWith("#")) {
            return line.replace(
              /URI=(['"])([^'"]+)(['"])/g,
              (match, quote, p2, endQuote) => {
                let absoluteUrl = p2;
                if (p2.startsWith("http")) absoluteUrl = p2;
                else if (p2.startsWith("//")) absoluteUrl = `https:${p2}`;
                else if (p2.startsWith("/")) absoluteUrl = `${targetOrigin}${p2}`;
                else absoluteUrl = `${baseUrl}${p2}`;
                return `URI=${quote}${proxyBaseUrl}${encodeURIComponent(
                  absoluteUrl
                )}${endQuote}`;
              }
            );
          }

          // Rewrite segment URLs (.ts)
          let absoluteUrl = trimmed;
          if (trimmed.startsWith("http")) absoluteUrl = trimmed;
          else if (trimmed.startsWith("//")) absoluteUrl = `https:${trimmed}`;
          else if (trimmed.startsWith("/")) absoluteUrl = `${targetOrigin}${trimmed}`;
          else absoluteUrl = `${baseUrl}${trimmed}`;

          return `${proxyBaseUrl}${encodeURIComponent(absoluteUrl)}`;
        })
        .join("\n");

      return new NextResponse(text, {
        status: response.status,
        headers: resHeaders,
      });
    }

    // For .ts video segments, return the raw stream directly.
    return new NextResponse(response.body, {
      status: response.status,
      headers: resHeaders,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Stream proxy error", message: e.message },
      {
        status: 502,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
