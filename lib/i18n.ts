export const defaultTimeZone = 'Asia/Bangkok';

export async function getMessages(locale: string) {
  if (locale === "en") {
    return (await import("../messages/en.json")).default
  }
  return (await import("../messages/th.json")).default
}