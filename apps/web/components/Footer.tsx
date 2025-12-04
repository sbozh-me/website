import { SocialLinks } from "./SocialLinks";

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto px-6 md:px-12 lg:px-24">
        <div className="flex items-center justify-center gap-8">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} sbozh.me
          </p>
          <SocialLinks />
        </div>
      </div>
    </footer>
  );
}
