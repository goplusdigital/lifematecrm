"use client";

import React, { JSX, useMemo } from "react";
import ContentLoader from "react-content-loader";

// deterministic random (กัน pattern กระพริบ)
const seededRandom = (seed: number) => {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

type Props = {
  size?: number;
  cells?: number;
  seed?: number;
  showLogo?: boolean;
};

export default function QRCodeLoaderPro({
  size = 240,
  cells = 29, // QR version กลาง ๆ
  seed = 42,
  showLogo = true,
}: Props) {
  const cellSize = size / cells;

  const blocks = useMemo(() => {
    const elements: JSX.Element[] = [];

    const isInFinder = (r: number, c: number) => {
      const inTopLeft = r < 7 && c < 7;
      const inTopRight = r < 7 && c >= cells - 7;
      const inBottomLeft = r >= cells - 7 && c < 7;
      return inTopLeft || inTopRight || inBottomLeft;
    };

    const addFinder = (startRow: number, startCol: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isBorder =
            r === 0 || r === 6 || c === 0 || c === 6;
          const isCenter =
            r >= 2 && r <= 4 && c >= 2 && c <= 4;

          if (isBorder || isCenter) {
            elements.push(
              <rect
                key={`finder-${startRow}-${startCol}-${r}-${c}`}
                x={(startCol + c) * cellSize}
                y={(startRow + r) * cellSize}
                width={cellSize}
                height={cellSize}
                rx="1"
              />
            );
          }
        }
      }
    };

    // Finder patterns
    addFinder(0, 0);
    addFinder(0, cells - 7);
    addFinder(cells - 7, 0);

    // Timing pattern
    for (let i = 8; i < cells - 8; i++) {
      if (i % 2 === 0) {
        // horizontal
        elements.push(
          <rect
            key={`timing-h-${i}`}
            x={i * cellSize}
            y={6 * cellSize}
            width={cellSize}
            height={cellSize}
          />
        );

        // vertical
        elements.push(
          <rect
            key={`timing-v-${i}`}
            x={6 * cellSize}
            y={i * cellSize}
            width={cellSize}
            height={cellSize}
          />
        );
      }
    }

    // Data modules
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        if (isInFinder(r, c)) continue;
        if (r === 6 || c === 6) continue;

        // กัน logo กลาง
        if (showLogo) {
          const centerStart = Math.floor(cells / 2) - 4;
          const centerEnd = Math.floor(cells / 2) + 4;
          if (
            r >= centerStart &&
            r <= centerEnd &&
            c >= centerStart &&
            c <= centerEnd
          ) {
            continue;
          }
        }

        const rand = seededRandom(r * cells + c + seed);
        if (rand > 0.5) {
          elements.push(
            <rect
              key={`data-${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              rx="0.8"
            />
          );
        }
      }
    }

    return elements;
  }, [cells, cellSize, seed, showLogo]);

  return (
    <div style={{ width: size, height: size, position: "relative" }} className="w-100 m-6">
      <ContentLoader
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        speed={2}
        backgroundColor="#f3f3f3"
        foregroundColor="#e0e0e0"
      >
        {blocks}
      </ContentLoader>

      {/* Logo placeholder */}
      {showLogo && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: size * 0.22,
            height: size * 0.22,
            borderRadius: 12,
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              width: "60%",
              height: "60%",
              background: "#e5e5e5",
              borderRadius: 6,
            }}
          />
        </div>
      )}
    </div>
  );
}