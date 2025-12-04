import { SocialLinks } from './SocialLinks';

export function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-6">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} sbozh.me
          </p>
          <SocialLinks />
        </div>
      </div>
    </footer>
  );
}
