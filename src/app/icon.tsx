import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

/* eslint-disable @next/next/no-img-element */

const logoPath = path.join(
  process.cwd(),
  "public",
  "branding",
  "logo-gorila.png"
);
const logoDataUrl = `data:image/png;base64,${readFileSync(logoPath).toString("base64")}`;

export const runtime = "nodejs";
export const size = {
  width: 512,
  height: 512
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent"
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            overflow: "hidden",
            background: "#ffffff"
          }}
        >
          <img
            src={logoDataUrl}
            alt="Gorila Strong"
            width="440"
            height="440"
            style={{
              width: "86%",
              height: "86%"
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
