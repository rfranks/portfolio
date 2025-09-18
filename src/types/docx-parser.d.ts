declare module "docx-parser" {
  export default function parseDocx(
    buffer: ArrayBuffer | Uint8Array | Buffer,
  ): Promise<string>;
  export function parseDocx(
    buffer: ArrayBuffer | Uint8Array | Buffer,
  ): Promise<string>;
}
