import Link from "next/link";
import { appConfig } from "@/lib/config";
import { BuiltWithBadge } from "@/components/built-with-kit";

const FooterSection = () => {
  return (
    <section className="mx-auto w-full p-4 flex flex-col items-center">
      <div className="rounded-full border bg-background/95 px-6 py-4 shadow-lg backdrop-blur-sm supports-backdrop-filter:bg-background/60 max-w-(--breakpoint-xl) w-full">
        <div className="flex flex-col items-center justify-between gap-4 text-sm sm:flex-row">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-semibold">
              {appConfig.projectName}
            </Link>
            <span className="text-muted-foreground">
              © {new Date().getFullYear()}
            </span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-muted-foreground">
            <Link href="/about" className="hover:text-primary">
              About
            </Link>
            <Link href="/terms" className="hover:text-primary">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-primary">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-primary">
              Contact
            </Link>
            <BuiltWithBadge variant="compact" />
          </nav>
        </div>
      </div>
    </section>
  );
};

export default FooterSection;
