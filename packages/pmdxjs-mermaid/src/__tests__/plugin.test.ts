import { describe, expect, it } from "vitest";

import { createMermaidPlugin, mermaidPlugin } from "../plugin";

describe("mermaidPlugin", () => {
  it("should have correct languages", () => {
    expect(mermaidPlugin.languages).toEqual(["mermaid", "mmd"]);
  });

  it("should have a component", () => {
    expect(mermaidPlugin.component).toBeDefined();
    expect(typeof mermaidPlugin.component).toBe("function");
  });
});

describe("createMermaidPlugin", () => {
  it("should create plugin with default options", () => {
    const plugin = createMermaidPlugin();

    expect(plugin.languages).toEqual(["mermaid", "mmd"]);
    expect(plugin.component).toBeDefined();
  });

  it("should create plugin with custom options", () => {
    const CustomLoading = () => null;
    const plugin = createMermaidPlugin({
      theme: "forest",
      LoadingComponent: CustomLoading,
    });

    expect(plugin.languages).toEqual(["mermaid", "mmd"]);
    expect(plugin.component).toBeDefined();
  });

  it("should return a valid CodeLanguagePlugin", () => {
    const plugin = createMermaidPlugin();

    // Check plugin interface
    expect(plugin).toHaveProperty("languages");
    expect(plugin).toHaveProperty("component");
    expect(Array.isArray(plugin.languages)).toBe(true);
    expect(typeof plugin.component).toBe("function");
  });
});
