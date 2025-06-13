export interface IPost {
  
 
  title: string;
  content?: string | null; // `String?` in Prisma maps to `string | null | undefined` in TypeScript. Using `string | null` as Prisma client usually returns `null` for optional fields.
  imageUrl?: string | null; // Optional image URL for the post
  authorId: string;




}
