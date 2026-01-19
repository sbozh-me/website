# mermaid-0.0.6 - Image Directive

## Goal

Add an `:::image` directive to PMDXJS for embedding images with optional dimensions.

## Syntax

```markdown
:::image /path/to/image.png
:::image /path/to/image.png | 200
:::image /path/to/image.png | 200 | 150
:::image https://example.com/image.jpg | 100%
```

**Format:** `:::image src | width? | height?`

- `src` - Required. Image URL or path
- `width` - Optional. Width in pixels or percentage (e.g., `200`, `100%`, `50%`)
- `height` - Optional. Height in pixels or percentage

## Deliverables

- [ ] Add `ImageNode` AST type
- [ ] Add image tokenizer pattern
- [ ] Parse image directive in parser
- [ ] Transform to React `Image` component
- [ ] Add default `Image` component
- [ ] Support custom `Image` component override
- [ ] Unit tests for parsing and transformation

## Dependencies

Requires existing PMDXJS parser infrastructure.

## Files to Modify

```
packages/pmdxjs/src/
  types/
    ast.ts              # Add ImageNode type
  parser/
    tokenizer.ts        # Add image pattern
    index.ts            # Parse image directive
  transformer/
    transform.ts        # Transform ImageNode
  components/
    cv/
      Image.tsx         # NEW: Default image component
      index.ts          # Export Image
  __tests__/
    parser.test.ts      # Image parsing tests
    transformer.test.tsx # Image transform tests
```

## Type Definitions

```typescript
// types/ast.ts
export interface ImageNode {
  type: "image";
  src: string;
  width?: string;
  height?: string;
  position: Position;
}

// Add to ContentNode union
export type ContentNode =
  | HeaderNode
  | SectionNode
  | ...
  | ImageNode;  // NEW
```

## Tokenizer Pattern

```typescript
// parser/tokenizer.ts
const PATTERNS = {
  // ... existing patterns
  // :::image src | width | height
  image: /^:::image\s+(\S+)(?:\s*\|\s*(\S+))?(?:\s*\|\s*(\S+))?\s*$/,
};
```

## Parser Implementation

```typescript
// parser/index.ts
function parseImage(line: string): ImageNode | null {
  const match = line.match(PATTERNS.image);
  if (!match) return null;

  const [, src, width, height] = match;

  return {
    type: "image",
    src,
    width: width || undefined,
    height: height || undefined,
    position: currentPosition(),
  };
}
```

## Transformer Implementation

```typescript
// transformer/transform.ts
function transformImage(
  node: ImageNode,
  options: TransformOptions,
  key: number
): ReactElement {
  const ImageComponent = options.components?.Image ?? DefaultImage;

  return createElement(ImageComponent, {
    key,
    src: node.src,
    width: node.width,
    height: node.height,
  });
}
```

## Default Component

```typescript
// components/cv/Image.tsx
export interface ImageProps {
  src: string;
  width?: string;
  height?: string;
  alt?: string;
  className?: string;
}

export function Image({ src, width, height, alt = "", className }: ImageProps) {
  const style: CSSProperties = {};

  if (width) {
    style.width = width.includes("%") ? width : `${width}px`;
  }
  if (height) {
    style.height = height.includes("%") ? height : `${height}px`;
  }

  return (
    <img
      src={src}
      alt={alt}
      style={style}
      className={cn("pmdxjs-image", className)}
    />
  );
}
```

## Demo

```markdown
:::page

# Portfolio

## Screenshots

:::image /screenshots/app-v1.png | 300
:::image /screenshots/dashboard.png | 100%

:::page-end
```

## Edge Cases

1. **Relative vs absolute URLs** - Pass through as-is, let consumer handle
2. **Invalid dimensions** - Pass through, CSS will handle gracefully
3. **Missing src** - Don't create node, skip line
4. **Special characters in URL** - URL-encoded paths should work

## Acceptance Criteria

- [ ] `:::image src` parses correctly
- [ ] `:::image src | width` parses correctly
- [ ] `:::image src | width | height` parses correctly
- [ ] Width/height support both pixels and percentages
- [ ] Custom Image component can be provided
- [ ] Images render correctly in CV
- [ ] `pnpm test` passes
- [ ] `pnpm build` succeeds
- [ ] Test coverage >= 90%
