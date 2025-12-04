import { describe, expect, it, vi } from "vitest";

import { compile, compileAsync } from "../../runtime/compile";

describe("compile", () => {
  it("compiles valid PMDXJS source", () => {
    const source = `
:::page
# John Doe
:::page-end
`;

    const result = compile(source);

    expect(result.element).not.toBeNull();
    expect(result.error).toBeNull();
  });

  it("returns error for invalid source", () => {
    // Create a source that will throw during parsing
    const source = null as unknown as string;

    const result = compile(source);

    expect(result.element).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
  });

  it("calls onError callback when compilation fails", () => {
    const onError = vi.fn();
    const source = null as unknown as string;

    compile(source, { onError });

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it("passes transform options to transformer", () => {
    const source = `
:::page
# Custom Name
:::page-end
`;

    const CustomHeader = ({ name }: { name: string }) => (
      <div data-testid="custom">{name}</div>
    );

    const result = compile(source, {
      components: { Header: CustomHeader },
    });

    expect(result.element).not.toBeNull();
    expect(result.error).toBeNull();
  });

  it("handles empty source", () => {
    const result = compile("");

    expect(result.element).not.toBeNull();
    expect(result.error).toBeNull();
  });
});

describe("compileAsync", () => {
  it("compiles asynchronously", async () => {
    const source = `
:::page
# John Doe
:::page-end
`;

    const result = await compileAsync(source);

    expect(result.element).not.toBeNull();
    expect(result.error).toBeNull();
  });

  it("returns error for invalid source asynchronously", async () => {
    const source = null as unknown as string;

    const result = await compileAsync(source);

    expect(result.element).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
  });
});
