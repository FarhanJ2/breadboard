/** Ways to reach me. The connect page lists these over its reel. */
export interface Channel {
  label: string;
  value: string;
  href: string;
  ext: boolean;
  note: string;
}

export const channels: Channel[] = [
  // {
  //   label: "Email",
  //   value: "hello@farhanj2.dev",
  //   href: "mailto:hello@farhanj2.dev",
  //   ext: false,
  //   note: "The fastest way to reach me.",
  // },
  {
    label: "GitHub",
    value: "@farhanj2",
    href: "https://github.com/farhanj2",
    ext: true,
    note: "Code, projects, and the source for this site.",
  },
  {
    label: "LinkedIn",
    value: "Farhan Jamil",
    href: "https://www.linkedin.com/in/farhan-jamil-373370230/",
    ext: true,
    note: "The professional-ish version.",
  },
];

