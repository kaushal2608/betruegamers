import { cookies } from 'next/headers';
import ThemeRegistry from '@/theme/ThemeRegistry';
import StoreProvider from '@/store/StoreProvider';
import GlobalSnackbar from '@/components/common/GlobalSnackbar';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://betruegamers.vercel.app'),
  title: 'BeTrueGamers — Level Up Your Game',
  description: 'The premier social gaming & coaching platform. Connect with gamers, book live 1-on-1 coaching sessions with real-time screen sharing, and dominate the leaderboards.',
  keywords: ['gaming', 'coaching', 'esports', 'screen share', 'gamer network', 'valorant coach', 'game sessions'],
  openGraph: {
    title: 'BeTrueGamers — Level Up Your Game',
    description: 'The premier social gaming & coaching platform. Connect with gamers, book live 1-on-1 coaching sessions with real-time screen sharing, and dominate the leaderboards.',
    url: 'https://betruegamers.vercel.app',
    siteName: 'BeTrueGamers',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'BeTrueGamers - Level Up Your Game'
      }
    ],
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BeTrueGamers — Level Up Your Game',
    description: 'The premier social gaming & coaching platform. Connect with gamers, book live 1-on-1 coaching sessions with real-time screen sharing, and dominate the leaderboards.',
    images: ['/og-image.jpg']
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png'
  }
};

export default function RootLayout({ children }) {
  let initialTheme = 'dark';
  try {
    const cookieStore = cookies();
    const themeCookie = cookieStore.get('btg_theme')?.value;
    if (themeCookie === 'light' || themeCookie === 'dark') {
      initialTheme = themeCookie;
    }
  } catch (e) {}

  return (
    <html lang="en" data-theme={initialTheme} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var m = document.cookie.match(/(^|;)\\s*btg_theme=([^;]+)/);
                  var t = m ? m[2] : localStorage.getItem('btg_theme_mode');
                  if (!t) t = '${initialTheme}';
                  if (t === 'light') {
                    document.documentElement.setAttribute('data-theme', 'light');
                    document.documentElement.style.colorScheme = 'light';
                    document.documentElement.style.backgroundColor = '#f8fafc';
                    document.documentElement.style.color = '#0f172a';
                  } else {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    document.documentElement.style.colorScheme = 'dark';
                    document.documentElement.style.backgroundColor = '#080a0f';
                    document.documentElement.style.color = '#f3f4f6';
                  }
                } catch(e) {}
              })();
            `
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body {
                min-height: 100vh;
                margin: 0;
                padding: 0;
              }
              html[data-theme="light"],
              html[data-theme="light"] body,
              html[data-theme="light"] .btg-loading-screen,
              html[data-theme="light"] [data-loading-screen="true"] {
                background-color: #f8fafc !important;
                color: #0f172a !important;
              }
              html[data-theme="light"] .btg-loading-screen .MuiTypography-root,
              html[data-theme="light"] [data-loading-screen="true"] .MuiTypography-root {
                color: #64748b !important;
              }
              html[data-theme="dark"],
              html[data-theme="dark"] body,
              html[data-theme="dark"] .btg-loading-screen,
              html[data-theme="dark"] [data-loading-screen="true"] {
                background-color: #080a0f !important;
                color: #f3f4f6 !important;
              }
              html[data-theme="dark"] .btg-loading-screen .MuiTypography-root,
              html[data-theme="dark"] [data-loading-screen="true"] .MuiTypography-root {
                color: #94a3b8 !important;
              }
            `
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Rajdhani:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={initialTheme === 'light' ? 'light-mode' : 'dark-mode'}>
        <StoreProvider initialTheme={initialTheme}>
          <ThemeRegistry initialTheme={initialTheme}>
            {children}
            <GlobalSnackbar />
          </ThemeRegistry>
        </StoreProvider>
      </body>
    </html>
  );
}
