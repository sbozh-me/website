import type { ComponentType, ReactNode } from "react";

import { glitchMdxComponents } from "./glitch/mdx-components";
import { compileTitle, hasTitleMarkup } from "./title";

const titleComponents: Record<string, ComponentType<any>> = {
  ...glitchMdxComponents,
  // The <h1> wraps it: no paragraph inside
  p: ({ children }: { children?: ReactNode }) => <>{children}</>,
};

/** The post title as the post page's <h1> content; the raw text if it doesn't compile. */
export async function renderTitle(title: string): Promise<ReactNode> {
  if (!hasTitleMarkup(title)) return title;
  try {
    const { Title } = await compileTitle(title);
    return <Title components={titleComponents} />;
  } catch {
    return title;
  }
}
