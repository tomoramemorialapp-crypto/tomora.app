import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web-only root document. Configures PWA / Add-to-Home-Screen icons for light
 * and dark system appearance.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        <link rel="manifest" href="/manifest.webmanifest" />

        <link rel="icon" type="image/png" href="/icon-light.png" media="(prefers-color-scheme: light)" />
        <link rel="icon" type="image/png" href="/icon-dark.png" media="(prefers-color-scheme: dark)" />
        <link rel="icon" type="image/png" href="/favicon.png" />

        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon-light.png"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon-dark.png"
          media="(prefers-color-scheme: dark)"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon-light.png" />

        <meta name="theme-color" content="#F7EFE6" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#101112" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Tomora" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
