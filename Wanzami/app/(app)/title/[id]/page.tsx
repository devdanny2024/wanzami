import type { Metadata } from 'next';
import TitleClient from './TitleClient';
import { fetchTitleWithEpisodes } from '@/lib/contentClient';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Link-preview crawlers (WhatsApp, X, Facebook, ...) send no geo header, so
  // the API can't resolve a country and 404s on any title with a country
  // allowlist. Default to NG here, same as the client does, so the card
  // still renders instead of falling back to the generic site-wide one.
  const title = await fetchTitleWithEpisodes(params.id, { country: 'NG' }).catch(() => null);
  if (!title) return {};

  const image = title.thumbnailUrl || title.posterUrl || undefined;
  const description = title.description ? title.description.slice(0, 200) : undefined;
  // wanzami.tv (no www) 307-redirects to www.wanzami.tv at the DNS/Vercel
  // level, and some link-preview crawlers don't follow redirects, so point
  // og:url straight at the domain that actually serves the page.
  const url = `https://www.wanzami.tv/title/${params.id}`;

  return {
    title: `${title.name} | Wanzami`,
    description,
    openGraph: {
      title: title.name,
      description,
      url,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: title.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function TitlePage({ params }: { params: { id: string } }) {
  return <TitleClient id={params.id} />;
}
