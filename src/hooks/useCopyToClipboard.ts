/**
 * Copies the provided text to the clipboard, if it is available.
 *
 * @param copyMe the string to copy
 */
const copyToClipboard = async (copyMe: string) => {
  try {
    if (typeof window !== "undefined") {
      await navigator.clipboard.writeText(copyMe);
    }
  } catch (error) {
    console.log(error);
  }
};

export default function useCopyToClipboard() {
  return copyToClipboard;
}
