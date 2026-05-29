/* import fs from "fs/promises";
import { serialize } from "next-mdx-remote/serialize";
import matter from "gray-matter";
import rehypeHighlight from "rehype-highlight";
import rehypeAttr from "rehype-attr";
import remarkGfm from "remark-gfm";

export interface IParsedMDX {
  frontmatter: Record<string, any>;
  markdownContent: string;
  compiledContent: string;
  fullPath: string;
}

export class MDXParser {
  async parseFile(filePath: string): Promise<IParsedMDX> {
    try {
      const fileContent = await fs.readFile(filePath, "utf-8");

      // Extract frontmatter using gray-matter
      const { data: frontmatter, content: markdownContent } =
        matter(fileContent);

      // Serialize MDX content (optional - for pre-compiled storage)
      const mdxSource = await serialize(markdownContent, {
        parseFrontmatter: false,
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeHighlight, rehypeAttr],
        },
      });

      return {
        frontmatter,
        markdownContent,
        compiledContent: JSON.stringify(mdxSource), // Optional
        fullPath: filePath,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Error parsing MDX file ${filePath}: ${errorMessage}`);
    }
  }
}
 */