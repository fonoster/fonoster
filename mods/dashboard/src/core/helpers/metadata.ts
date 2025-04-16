export interface Metadata {
  title: string | null;
  description?: string;
}

export const metadata = (
  { title, description }: Metadata = {
    title: null
  }
) => {
  const defaultDescription =
    "Fonoster is researching an innovative Programmable Telecommunications Stack that will allow businesses to connect telephony services with the Internet entirely through a cloud-based utility.";

  return [
    {
      title: title ? `${title} | Fonoster` : "Fonoster"
    },
    {
      name: "description",
      content: description || defaultDescription
    },
    {
      name: "keywords",
      content: "Fonoster, open-source"
    },
    {
      name: "author",
      content: "Fonoster, Inc."
    },
    {
      name: "robots",
      content: "index, follow"
    },
    {
      property: "og:title",
      content: "Fonoster - The open-source alternative to Twilio."
    },
    {
      property: "og:description",
      content: description || defaultDescription
    },
    {
      property: "og:image",
      content: "https://static.fonoster.com/graph.jpg"
    },
    {
      property: "og:type",
      content: "website"
    },
    {
      name: "twitter:card",
      content: "summary_large_image"
    },
    {
      name: "twitter:site",
      content: "@fonoster"
    },
    {
      name: "twitter:description",
      content: description || defaultDescription
    },
    {
      name: "twitter:image",
      content: "https://static.fonoster.com/graph.jpg"
    }
  ];
};
