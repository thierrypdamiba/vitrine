import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Chrome 149+ paints these while an agent fills the declarative filter form. The
// bundler's CSS minifier does not know :tool-form-active yet and warns on every
// build, so the rules ship as a raw string instead of through globals.css.
const WEBMCP_FORM_CSS = `@supports selector(form:tool-form-active) {
  form:tool-form-active { outline: light-dark(#1c1917, #fff) dashed 1px; outline-offset: 4px; }
  button:tool-submit-active { box-shadow: 0 0 0 3px #1c1917; }
}`;

export const metadata: Metadata = {
  title: 'Vitrine',
  description:
    'A jacket shop. The agent can use the trip. The catalog search only gets size, features, and colors.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Chrome-only WebMCP form styling, kept out of the minified CSS bundle. */}
        <style dangerouslySetInnerHTML={{ __html: WEBMCP_FORM_CSS }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
