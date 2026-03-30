#!/usr/bin/env node

/**
 * Generate PWA icons in PNG format
 * Creates all required icon sizes for the PWA manifest
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

/**
 * Generate SVG for a given size
 */
function generateSVG(size) {
  const borderRadius = Math.floor(size * 0.2);
  const strokeWidth = Math.max(2, Math.floor(size * 0.03));
  const batteryWidth = Math.floor(size * 0.5);
  const batteryHeight = Math.floor(size * 0.3);
  const batteryX = Math.floor((size - batteryWidth) / 2);
  const batteryY = Math.floor((size - batteryHeight) / 2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${borderRadius}" fill="#2563eb"/>

  <!-- Battery Icon -->
  <g transform="translate(${batteryX}, ${batteryY})">
    <!-- Battery body -->
    <rect x="0" y="0" width="${batteryWidth}" height="${batteryHeight}" rx="${strokeWidth * 2}"
          fill="none" stroke="white" stroke-width="${strokeWidth}"/>

    <!-- Battery terminal -->
    <rect x="${batteryWidth - strokeWidth * 3}" y="${batteryHeight * 0.35}"
          width="${strokeWidth * 3}" height="${batteryHeight * 0.3}" rx="${strokeWidth}"
          fill="white"/>

    <!-- Charge level indicator (75% full) -->
    <rect x="${strokeWidth * 2}" y="${strokeWidth * 2}"
          width="${batteryWidth * 0.65 - strokeWidth * 3}" height="${batteryHeight - strokeWidth * 4}"
          rx="${strokeWidth}" fill="white"/>

    <!-- Lightning bolt -->
    <path d="M ${batteryWidth * 0.4} ${strokeWidth * 3}
             L ${batteryWidth * 0.55} ${batteryHeight * 0.4}
             L ${batteryWidth * 0.45} ${batteryHeight * 0.4}
             L ${batteryWidth * 0.6} ${batteryHeight - strokeWidth * 3}
             L ${batteryWidth * 0.35} ${batteryHeight * 0.6}
             L ${batteryWidth * 0.45} ${batteryHeight * 0.6}
             Z"
          fill="#2563eb" stroke="white" stroke-width="${strokeWidth}"/>
  </g>

  <!-- ES text -->
  <text x="${size / 2}" y="${size - borderRadius * 1.5}"
        font-family="Arial, sans-serif" font-size="${size * 0.15}"
        font-weight="bold" fill="white" text-anchor="middle">ES</text>
</svg>`;
}

/**
 * Check if sharp is available for PNG conversion
 */
async function convertToPNG() {
  try {
    // Try to use sharp for high-quality PNG generation
    const sharp = (await import('sharp')).default;
    return async (svgContent, size, outputPath) => {
      await sharp(Buffer.from(svgContent))
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${outputPath}`);
    };
  } catch (e) {
    // Fallback: save as SVG and warn user
    console.log('⚠ sharp package not found. Saving as SVG files.');
    console.log('  Install sharp for PNG conversion: npm install sharp');
    return async (svgContent, size, outputPath) => {
      fs.writeFileSync(outputPath, svgContent);
      console.log(`✓ Generated ${outputPath} (SVG format)`);
    };
  }
}

/**
 * Main generation function
 */
async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  const convert = await convertToPNG();

  for (const size of sizes) {
    const svg = generateSVG(size);
    const filename = `icon-${size}x${size}.png`;
    const outputPath = path.join(iconsDir, filename);

    await convert(svg, size, outputPath);
  }

  console.log(`\n✅ Generated ${sizes.length} icon files in ${iconsDir}`);
  console.log('\n📱 Icon sizes:', sizes.join('x', ', '));
}

// Run
generateIcons().catch(console.error);
