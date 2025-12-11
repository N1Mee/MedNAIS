import { Footer } from "./footer";

interface ServerPageLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
  header?: React.ReactNode;
}

export function ServerPageLayout({ children, showFooter = true, header }: ServerPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {header}
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
