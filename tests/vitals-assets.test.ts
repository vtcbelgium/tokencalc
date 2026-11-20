import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf-8');

describe('live vitals assets', () => {
  it('_headers has security headers', () => {
    const h = read('public/_headers');
    expect(h).toContain('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    expect(h).toContain('X-Content-Type-Options: nosniff');
    expect(h).toContain('X-Frame-Options: DENY');
    expect(h).toContain('Referrer-Policy: strict-origin-when-cross-origin');
  });

  it('sitemap.xml is XML with canonical URL', () => {
    const s = read('public/sitemap.xml');
    expect(s.startsWith('<?xml')).toBe(true);
    expect(s).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(s).toContain('<loc>https://tokencalc.othrys.be/</loc>');
  });

  it('robots.txt references sitemap', () => {
    const r = read('public/robots.txt');
    expect(r).toContain('User-agent: *');
    expect(r).toContain('Sitemap: https://tokencalc.othrys.be/sitemap.xml');
  });

  it('og-image.svg is a local 1200x630 svg', () => {
    const v = read('public/og-image.svg');
    expect(v).toContain('<svg');
    expect(v).toContain('width="1200"');
    expect(v).toContain('height="630"');
    expect(v.replace('http://www.w3.org/2000/svg', '')).not.toMatch(/https?:\/\//);
  });

  it('index.html has social tags and valid JSON-LD', () => {
    const html = read('index.html');
    expect(html).toContain('property="og:image" content="https://tokencalc.othrys.be/og-image.svg"');
    expect(html).toContain('twitter:card" content="summary_large_image"');
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const types = blocks.map((b) => b['@type']);
    expect(types).toContain('WebApplication');
    expect(types).toContain('FAQPage');
    expect(html).not.toContain('"Person"');
    expect(html).not.toMatch(/zero ads|never ads|ad-free forever/i);
  });
});
