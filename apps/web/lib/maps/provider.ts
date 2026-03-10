export const mapProviderConfig = {
  provider: process.env.NEXT_PUBLIC_MAP_PROVIDER ?? 'maplibre',
  styleUrl: process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? 'https://demotiles.maplibre.org/style.json',
} as const;
