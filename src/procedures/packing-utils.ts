import { BlobReader, BlobWriter, TextReader, ZipWriter } from "@zip.js/zip.js";

export function make_database_pack(root_name: string) {
  const blob_builder = new BlobWriter();
  const zip_builder = new ZipWriter(blob_builder, {
    compressionMethod: 0, // there is no need to compress it
    level: 0, // there is no need to compress it
    zip64: true,
  });
  const pending_tasks: Promise<any>[] = [];
  pending_tasks.push(zip_builder.add(root_name, undefined, { directory: true }));
  const add_from_string = (name: string, content: string): void => {
    pending_tasks.push(zip_builder.add(`${root_name}/${name}`, new TextReader(content)));
  };
  const add_from_blob = (name: string, content: Blob): void => {
    pending_tasks.push(zip_builder.add(`${root_name}/${name}`, new BlobReader(content)));
  };
  const finalize = async (): Promise<Blob> => {
    pending_tasks.push(zip_builder.close());
    await Promise.all(pending_tasks);
    return blob_builder.getData();
  };
  return { add_from_string, add_from_blob, finalize };
}
