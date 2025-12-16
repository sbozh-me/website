import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getProject } from "@/lib/projects/data";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";

// Obsidian Forge theme colors
const COLORS = {
  background: "#0a0a0f",
  backgroundAlt: "#1a1a2e",
  amethyst: "#8b5cf6",
  gold: "#f59e0b",
  green: "#22c55e",
  textPrimary: "#ffffff",
  textSecondary: "#a1a1aa",
  overlay: "rgba(10, 10, 15, 0.7)",
};

const STATUS_COLORS = {
  active: COLORS.green,
  beta: COLORS.gold,
  "coming-soon": COLORS.textSecondary,
  archived: COLORS.textSecondary,
};

const STATUS_LABELS = {
  active: "Active",
  beta: "Beta",
  "coming-soon": "Coming Soon",
  archived: "Archived",
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
    const project = getProject(slug);

    if (!project) {
      return new Response("Project not found", { status: 404 });
    }

    // Load font
    const spaceGroteskFont = await loadSpaceGroteskFont();

    // Load hero image from filesystem to avoid container self-referencing issues
    let heroImageData: ArrayBuffer | null = null;
    if (project.heroImage?.src) {
      try {
        // Hero images are in public folder, e.g., /projects/pifagor/hero.png -> public/projects/pifagor/hero.png
        const imagePath = join(process.cwd(), "public", project.heroImage.src);
        const imageBuffer = await readFile(imagePath);
        heroImageData = imageBuffer.buffer.slice(
          imageBuffer.byteOffset,
          imageBuffer.byteOffset + imageBuffer.byteLength
        );
      } catch {
        // Fall back to gradient if image not found
      }
    }

    // Load logo from filesystem to avoid container self-referencing issues
    let logoImageData: ArrayBuffer | null = null;
    try {
      const logoPath = join(process.cwd(), "public/android-chrome-192x192.png");
      const logoBuffer = await readFile(logoPath);
      logoImageData = logoBuffer.buffer.slice(
        logoBuffer.byteOffset,
        logoBuffer.byteOffset + logoBuffer.byteLength
      );
    } catch {
      // Fall back if logo not found
    }

    const statusColor = STATUS_COLORS[project.status];
    const statusLabel = STATUS_LABELS[project.status];

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
            fontFamily: '"Space Grotesk", sans-serif',
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: COLORS.background,
            }}
          />

          { heroImageData ? <img alt='' src={`data:image/png;base64,${Buffer.from(heroImageData).toString("base64")}`} style={{width: '100%', height: '100%', position: 'absolute', 'top': 0}} /> : null }

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
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <span
                style={{
                  color: COLORS.textPrimary,
                  fontSize: "42px",
                  fontWeight: 700,
                }}
              >
              sbozh.me
            </span>
              <span style={{color: COLORS.textPrimary}}>
                Personal startup
                {logoImageData ? <img alt='' src={`data:image/png;base64,${Buffer.from(logoImageData).toString("base64")}`} style={{width: '8px', height: '8px'}} /> : null}
              </span>
            </div>
          </div>

          {/* Content area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: "relative",
              padding: "40px",
              zIndex: 10,
              background: 'rgba(0,0,0,0.75)',
            }}
          >
            {/* Project title */}
            <h1
              style={{
                color: COLORS.textPrimary,
                fontSize: "64px",
                fontWeight: 700,
                lineHeight: 1.1,
                margin: 0,
                maxWidth: "1000px",
                textShadow: "0 2px 20px rgba(0, 0, 0, 0.5)",
              }}
            >
              {project.title}
            </h1>

            {/* Project tagline */}
            <p
              style={{
                color: COLORS.textSecondary,
                fontSize: "28px",
                fontWeight: 400,
                marginTop: "16px",
                maxWidth: "900px",
              }}
            >
              {project.tagline}
            </p>
          </div>

          {/* Decorative accent line */}
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
