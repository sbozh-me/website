import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pathname = vi.hoisted(() => ({ current: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

import { Footer } from "../Footer";
import { Header } from "../Header";

describe("site chrome on client demos", () => {
  beforeEach(() => {
    pathname.current = "/";
  });

  it("renders the header and footer on site pages", () => {
    render(
      <>
        <Header />
        <Footer />
      </>
    );
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("hides the header and footer under /demo", () => {
    pathname.current = "/demo/renesans-inter";
    const { container } = render(
      <>
        <Header />
        <Footer />
      </>
    );
    expect(container).toBeEmptyDOMElement();
  });
});
