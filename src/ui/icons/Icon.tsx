import type { SVGProps } from "react";

export type IconName =
  | "fish"
  | "camera"
  | "trophy"
  | "cloud"
  | "wifi-off"
  | "clock"
  | "check"
  | "feed"
  | "map-pin"
  | "pencil"
  | "plus"
  | "minus"
  | "chevron"
  | "spinner"
  | "refresh";

export type IconSize = 16 | 20 | 24;

const paths: Record<IconName, React.ReactNode> = {
  fish: (
    <>
      <path d="M2.5 12c2.8-4.2 6.4-6.3 10.5-6.3 3.2 0 6 1.6 8.5 4.8-2.5 3.2-5.3 4.8-8.5 4.8-4.1 0-7.7-2.1-10.5-6.3Z" />
      <circle cx="16.8" cy="10.4" r="0.4" fill="currentColor" />
      <path d="M21.5 10.5 22 4.5c-3 .5-5.2 1.8-6.5 3.8" />
      <path d="M21.5 13.5 22 19.5c-3-.5-5.2-1.8-6.5-3.8" />
    </>
  ),
  camera: (
    <>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.6a2 2 0 0 0 1.7-.9l.7-1.2a2 2 0 0 1 1.7-1h2.6a2 2 0 0 1 1.7 1l.7 1.2a2 2 0 0 0 1.7.9h1.6A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-9Z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v6a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4.5A1.5 1.5 0 0 0 3 7.5C3 9.4 4.6 11 6.5 11H7M17 6h2.5A1.5 1.5 0 0 1 21 7.5c0 1.9-1.6 3.5-3.5 3.5H17" />
      <path d="M12 15v3m-4 3h8" />
    </>
  ),
  cloud: (
    <path d="M7 18a4 4 0 0 1-.6-7.95 5.5 5.5 0 0 1 10.8-1.1A4.5 4.5 0 0 1 16.5 18H7Z" />
  ),
  "wifi-off": (
    <>
      <path d="M2 2l20 20" />
      <path d="M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 3-2M19 12.9a10 10 0 0 0-6.2-2.8M9.9 20a3 3 0 0 1 4.2 0" />
      <path d="M2 8.8A15 15 0 0 1 7 5.7M22 8.8a15 15 0 0 0-10.6-4.3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </>
  ),
  check: <path d="M4.5 12.5 10 18 19.5 6.5" />,
  feed: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z" />
      <path d="M4 9h16M8 13h6M8 16h4" />
    </>
  ),
  "map-pin": (
    <>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  pencil: <path d="m14.5 5.5 4 4L8 20H4v-4L14.5 5.5ZM12.5 7.5l4 4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  spinner: (
    <>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M20 3v5h-5" />
    </>
  ),
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: IconSize;
}

export function Icon({ name, size = 24, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
