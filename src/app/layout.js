// import { Inter } from "next/font/google";
import "./globals.css";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
 // or `v1X-appRouter` if you are using Next.js v1X
 import { Roboto } from 'next/font/google';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import { StoreProvider } from "@/storeprovider";

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

// const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "True Gamers",
  description: "the app to make you true gamer and make your own identity. found coaches to learn from them",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={roboto.variable}>
      <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
      <StoreProvider>
        {children}
      </StoreProvider>
        </ThemeProvider>
       </AppRouterCacheProvider>  
        </body>
    </html>
  );
}
