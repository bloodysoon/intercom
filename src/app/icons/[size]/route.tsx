import { renderAppIcon } from "@/shared/lib/app-icon";

const SIZES = new Set([180, 192, 512]);

export function generateStaticParams() {
  return [...SIZES].map((size) => ({ size: String(size) }));
}

export async function GET(_req: Request, ctx: { params: Promise<{ size: string }> }) {
  const { size } = await ctx.params;
  const n = Number(size);
  if (!SIZES.has(n)) return new Response("Not found", { status: 404 });
  return renderAppIcon(n);
}
