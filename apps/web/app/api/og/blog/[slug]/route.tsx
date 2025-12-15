import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createBlogRepository } from "@/lib/blog/repository";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";

// Obsidian Forge theme colors
const COLORS = {
  background: "#0a0a0f",
  backgroundAlt: "#1a1a2e",
  amethyst: "#8b5cf6",
  gold: "#f59e0b",
  textPrimary: "#ffffff",
  textSecondary: "#a1a1aa",
  overlay: "rgba(10, 10, 15, 0.7)",
};

// Load Space Grotesk font from local file (TTF format required for OG image generation)
async function loadSpaceGroteskFont(): Promise<ArrayBuffer> {
  const fontPath = join(process.cwd(), "public/fonts/SpaceGrotesk-Regular.ttf");
  const fontBuffer = await readFile(fontPath);
  return fontBuffer.buffer.slice(
    fontBuffer.byteOffset,
    fontBuffer.byteOffset + fontBuffer.byteLength
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const repository = createBlogRepository();
    const post = await repository.getPost(slug);

    if (!post) {
      return new Response("Post not found", { status: 404 });
    }

    // If custom OG image exists, redirect to it
    if (post.ogImage) {
      const redirectUrl = post.ogImage.src.startsWith("/")
        ? new URL(post.ogImage.src, request.url).toString()
        : post.ogImage.src;
      return Response.redirect(redirectUrl, 307);
    }

    // If og_generate is explicitly false and no custom image, return 404
    if (post.ogGenerate === false) {
      return new Response("OG generation disabled", { status: 404 });
    }

    // Load font
    const spaceGroteskFont = await loadSpaceGroteskFont();

    // Fetch hero image as ArrayBuffer if available
    let heroImageData: ArrayBuffer | null = null;
    if (post.image?.src) {
      try {
        const imageUrl = post.image.src.startsWith("/")
          ? new URL(post.image.src, request.url).toString()
          : post.image.src;
        const imageResponse = await fetch(imageUrl, { cache: "force-cache" });
        if (imageResponse.ok) {
          heroImageData = await imageResponse.arrayBuffer();
        }
      } catch {
        // Fall back to gradient if image fetch fails
      }
    }

    // Truncate long titles
    const displayTitle =
      post.title.length > 100 ? post.title.substring(0, 97) + "..." : post.title;

    // Generate the OG image
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "60px",
            fontFamily: '"Space Grotesk", sans-serif',
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background layer */}
          {heroImageData ? (
            <>
              {/* Hero image background */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/jpeg;base64,${Buffer.from(heroImageData).toString("base64")}`}
                alt=""
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              {/* Dark overlay for readability */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: `linear-gradient(to bottom, ${COLORS.overlay}, rgba(10, 10, 15, 0.85))`,
                }}
              />
            </>
          ) : (
            /* Fallback gradient background */
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.backgroundAlt} 50%, #0f3460 100%)`,
              }}
            />
          )}

          {/* Site branding - top right */}
          <div
            style={{
              position: "absolute",
              top: "40px",
              right: "40px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                color: COLORS.amethyst,
                fontSize: "28px",
                fontWeight: 600,
              }}
            >
              sbozh.me
            </span>
          </div>

          {/* Content area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: "relative",
              zIndex: 10,
            }}
          >
            {/* Persona badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              {/* Persona color indicator */}
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  backgroundColor: post.persona.color || COLORS.amethyst,
                  boxShadow: `0 0 12px ${post.persona.color || COLORS.amethyst}`,
                }}
              />
              <span
                style={{
                  color: COLORS.textSecondary,
                  fontSize: "24px",
                  fontWeight: 400,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {post.persona.name}
              </span>
            </div>

            {/* Post title */}
            <h1
              style={{
                color: COLORS.textPrimary,
                fontSize: post.title.length > 60 ? "48px" : "64px",
                fontWeight: 700,
                lineHeight: 1.1,
                margin: 0,
                maxWidth: "1000px",
                textShadow: "0 2px 20px rgba(0, 0, 0, 0.5)",
              }}
            >
              {displayTitle}
            </h1>
          </div>

          {/* Decorative accent line */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "4px",
              background: `linear-gradient(90deg, ${COLORS.amethyst}, ${COLORS.gold})`,
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Space Grotesk",
            data: spaceGroteskFont,
            style: "normal",
            weight: 400,
          },
          {
            name: "Space Grotesk",
            data: spaceGroteskFont,
            style: "normal",
            weight: 700,
          },
        ],
      }
    );
  } catch (error) {
    console.error("OG image generation error:", error);
    return new Response("Error generating image", { status: 500 });
  }
}
