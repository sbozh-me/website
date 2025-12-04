import { Header } from '@/components/Header';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-200px)]">{children}</main>
    </>
  );
}
