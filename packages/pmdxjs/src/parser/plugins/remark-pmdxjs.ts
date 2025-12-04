import { parse } from "../index";

import type { DocumentNode } from "../../types/ast";
import type { Root } from "mdast";
import type { Plugin } from "unified";

/**
 * Remark plugin that transforms PMDXJS markdown into PMDXJS AST
 *
 * This plugin intercepts the standard remark parsing and produces
 * a PMDXJS-specific AST structure instead.
 */
export const remarkPmdxjs: Plugin<[], Root, DocumentNode> = function () {
  // Override the parse function to use our custom parser
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const processor = this;

  processor.parse = function (doc: string) {
    // Use our custom PMDXJS parser
    return parse(doc) as unknown as Root;
  };

  // Return a transformer that passes through (parsing already done)
  return function (tree) {
    return tree as unknown as DocumentNode;
  };
};

export default remarkPmdxjs;
