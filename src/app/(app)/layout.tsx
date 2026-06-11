import { UserButton } from "@clerk/nextjs";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="h-12 border-b border-[#1f1f1f] flex items-center justify-end px-4">
        <UserButton />
      </header>
      <main>{children}</main>
    </div>
  );
}
