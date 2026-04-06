import fs from 'node:fs';
import path from 'node:path';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const endpoint = 'https://wanzami-backend-alb-new-1306074984.eu-north-1.elb.amazonaws.com/api/titles?country=NG';

const res = await fetch(endpoint);
if (!res.ok) {
  throw new Error(`Failed to fetch titles: ${res.status}`);
}

const json = await res.json();
const titles = (json.titles ?? [])
  .filter((t) => t.posterUrl || t.thumbnailUrl)
  .slice(0, 8);

const dir = path.join(process.cwd(), 'public', 'remotion-posters');
fs.mkdirSync(dir, {recursive: true});

const meta = [];
let i = 1;
for (const t of titles) {
  const url = t.posterUrl || t.thumbnailUrl;
  const rr = await fetch(url);
  if (!rr.ok) continue;
  const buf = Buffer.from(await rr.arrayBuffer());
  const type = rr.headers.get('content-type') || '';
  const ext = type.includes('png') ? '.png' : '.jpg';
  const file = `poster-${i}${ext}`;
  fs.writeFileSync(path.join(dir, file), buf);
  meta.push({
    id: t.id,
    title: t.name,
    file: `/remotion-posters/${file}`,
  });
  i += 1;
}

fs.writeFileSync(path.join(dir, 'posters.json'), JSON.stringify(meta, null, 2));
console.log(`saved ${meta.length} posters`);
