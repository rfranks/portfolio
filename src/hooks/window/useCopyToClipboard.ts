/**
 * Copies the provided text to the clipboard when supported and logs when the Clipboard API is unavailable.
 *
 * @param copyMe the string to copy
 */
const copyToClipboard = async (copyMe: string) => {
  try {
    if (typeof window !== "undefined") {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(copyMe);
      } else {
        console.log("Clipboard API not supported");
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export default function useCopyToClipboard() {
  return copyToClipboard;
}
