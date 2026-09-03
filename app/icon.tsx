import { ImageResponse } from "next/og";

// Brand mark sebagai favicon (redesign §6: browser/app branding).
export const size = { width: 64, height: 64 };
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
          background: "#000",
          borderRadius: 14,
          color: "#fff",
          fontFamily: "monospace",
          fontWeight: 700,
          fontSize: 24,
        }}
      >
        K&lt;/&gt;
      </div>
    ),
    { ...size },
  );
}
