// files with name prefixed by _ does not work with GitHub Pages
// this custom filename sanitizer replaces these characters
// this function is partially copied from rollup
const INVALID_CHAR_REGEX = /[\u0000-\u001F"#$%&*+,:;<=>?[\]^`{|}\u007F]/g;
function filenameSanitizer(name: string): string {
  const intermediate = name.replaceAll(INVALID_CHAR_REGEX, "_");
  return intermediate.startsWith("_") ? "internal_" + intermediate.slice(1) : intermediate;
}
export default filenameSanitizer;
