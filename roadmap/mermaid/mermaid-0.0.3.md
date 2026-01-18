# mermaid-0.0.3 - Code Block Parsing Support

## Goal

Add fenced code block (` ``` `) parsing to PMDXJS, enabling the foundation for language-specific rendering plugins.

## Deliverables

- [ ] Code block tokenizer pattern with multi-line state tracking
- [ ] `CodeBlockNode` AST type with language and content fields
- [ ] Parser logic to accumulate lines between fences
- [ ] Default transformer rendering `<pre><code>`
- [ ] Unit tests for code block parsing

## Syntax to Support

```md
` ` `typescript
const greeting = "Hello, world!";
console.log(greeting);
` ` `

` ` `
Plain code block without language
` ` `
```

(Note: spaces added to prevent markdown rendering)

## Files to Modify

```
packages/pmdxjs/src/
  parser/
    tokenizer.ts        # Add CODE_FENCE pattern + inCodeBlock state
    index.ts            # Handle code block accumulation
    directives.ts       # Add createCodeBlockNode helper
  types/
    ast.ts              # Add CodeBlockNode type
  transformer/
    transform.ts        # Add transformCodeBlock function
  __tests__/
    parser.test.ts      # Add code block parsing tests
    tokenizer.test.ts   # Add code fence token tests
```

## Type Definitions

```typescript
// types/ast.ts
interface CodeBlockNode {
  type: "code_block";
  language: string | null;  // null for plain code blocks
  content: string;          // raw content between fences
  position?: Position;
}

// Add to BlockNode union
type BlockNode =
  | HeaderNode
  | SectionNode
  | ColumnsNode
  | EntryNode
  | TagsNode
  | DividerNode
  | ParagraphNode
  | ListNode
  | TableNode
  | CodeBlockNode;  // NEW
```

## Tokenizer Changes

```typescript
// tokenizer.ts
const patterns = {
  // ... existing patterns
  CODE_FENCE: /^```(\w+)?$/,  // Captures optional language
};

// New state flag
private inCodeBlock = false;
private codeBlockLanguage: string | null = null;
private codeBlockContent: string[] = [];

// Token type
type TokenType =
  | /* existing types */
  | "code_block";  // Emitted when fence closes
```

## Parser Logic

```typescript
// parser/index.ts
private handleCodeFence(line: string, match: RegExpMatchArray): void {
  if (!this.inCodeBlock) {
    // Opening fence
    this.inCodeBlock = true;
    this.codeBlockLanguage = match[1] || null;
    this.codeBlockContent = [];
  } else {
    // Closing fence - emit node
    this.flushCodeBlock();
    this.inCodeBlock = false;
  }
}

private flushCodeBlock(): void {
  const node = createCodeBlockNode(
    this.codeBlockLanguage,
    this.codeBlockContent.join('\n')
  );
  this.currentSection.push(node);
}
```

## Transformer Function

```typescript
// transformer/transform.ts
function transformCodeBlock(
  node: CodeBlockNode,
  options: TransformOptions
): ReactElement {
  const { components } = options;
  const CodeBlock = components?.CodeBlock ?? DefaultCodeBlock;

  return createElement(CodeBlock, {
    language: node.language,
    children: node.content,
  });
}

// Default component
function DefaultCodeBlock({ language, children }: CodeBlockProps) {
  return createElement(
    'pre',
    { className: language ? `language-${language}` : undefined },
    createElement('code', null, children)
  );
}
```

## Demo

```typescript
import { parse } from "@sbozh/pmdxjs/parser";

const ast = parse(`
:::page

# Example

Here's some code:

\`\`\`typescript
function greet(name: string) {
  return \`Hello, \${name}!\`;
}
\`\`\`

:::page-end
`);

// AST includes CodeBlockNode with language: "typescript"
```

## Edge Cases to Handle

1. **Nested fences** - Code blocks containing ` ``` ` in content (use 4+ backticks)
2. **Unclosed blocks** - Treat as error or extend to end of document
3. **Empty blocks** - Valid, content is empty string
4. **Whitespace** - Preserve indentation in content
5. **Inside columns** - Code blocks should work in column layouts

## Acceptance Criteria

- [ ] Parser correctly identifies code fence start/end
- [ ] Language identifier extracted (typescript, javascript, etc.)
- [ ] Content preserved exactly (whitespace, newlines)
- [ ] Default `<pre><code>` rendering works
- [ ] Code blocks work inside columns, entries, sections
- [ ] `pnpm test` passes in packages/pmdxjs
- [ ] `pnpm build` succeeds
- [ ] Test coverage >= 90%
