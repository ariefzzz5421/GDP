import Observatory from "@/components/Observatory";
import manifest from "@/data/processed/manifest.json";
import { notFound } from "next/navigation";
export function generateStaticParams() {
  return manifest.countries.map((c) => ({ code: c.code.toLowerCase() }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!manifest.countries.some((c) => c.code === code.toUpperCase()))
    notFound();
  return <Observatory view="country" initialCountry={code.toUpperCase()} />;
}
