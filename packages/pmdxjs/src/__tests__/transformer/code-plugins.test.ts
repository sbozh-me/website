import { describe, expect, it } from "vitest";

import { resolveCodePlugin } from "../../transformer/code-plugins";

import type { CodeLanguagePlugin } from "../../types/plugins";

// Mock plugin for testing
const mockMermaidPlugin: CodeLanguagePlugin = {
  languages: ["mermaid", "mmd"],
  component: () => null,
};

const mockTypeScriptPlugin: CodeLanguagePlugin = {
  languages: ["typescript", "ts"],
  component: () => null,
  transform: (content) => content.trim(),
};

const mockJsonPlugin: CodeLanguagePlugin = {
  languages: ["json"],
  component: () => null,
};

describe("resolveCodePlugin", () => {
  it("should return null for null language", () => {
    const result = resolveCodePlugin(null, [mockMermaidPlugin]);
    expect(result).toBeNull();
  });

  it("should return null when no plugins match", () => {
    const result = resolveCodePlugin("python", [mockMermaidPlugin]);
    expect(result).toBeNull();
  });

  it("should return null for empty plugins array", () => {
    const result = resolveCodePlugin("typescript", []);
    expect(result).toBeNull();
  });

  it("should find plugin by primary language", () => {
    const result = resolveCodePlugin("mermaid", [mockMermaidPlugin]);
    expect(result).toBe(mockMermaidPlugin);
  });

  it("should find plugin by language alias", () => {
    const result = resolveCodePlugin("mmd", [mockMermaidPlugin]);
    expect(result).toBe(mockMermaidPlugin);
  });

  it("should match case-insensitively", () => {
    const result = resolveCodePlugin("MERMAID", [mockMermaidPlugin]);
    expect(result).toBe(mockMermaidPlugin);
  });

  it("should match case-insensitively with mixed case", () => {
    const result = resolveCodePlugin("TypeScript", [mockTypeScriptPlugin]);
    expect(result).toBe(mockTypeScriptPlugin);
  });

  it("should return first matching plugin (priority order)", () => {
    const customMermaidPlugin: CodeLanguagePlugin = {
      languages: ["mermaid"],
      component: () => null,
    };

    const result = resolveCodePlugin("mermaid", [
      customMermaidPlugin,
      mockMermaidPlugin,
    ]);
    expect(result).toBe(customMermaidPlugin);
  });

  it("should search through multiple plugins", () => {
    const result = resolveCodePlugin("json", [
      mockMermaidPlugin,
      mockTypeScriptPlugin,
      mockJsonPlugin,
    ]);
    expect(result).toBe(mockJsonPlugin);
  });
});
