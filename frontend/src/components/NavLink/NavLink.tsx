"use client";

import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { MouseEventHandler, PropsWithChildren } from "react";

type Props = PropsWithChildren<
  LinkProps & {
    exact?: boolean;
    className?: string;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
  }
>;

export default function NavLink({
  href,
  children,
  exact = false,
  className,
  onClick,
  ...rest
}: Props) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(String(href));

  return (
    <Link
      href={href}
      className={clsx(
        "text-sm px-2 py-1 rounded",
        isActive ? "bg-primary text-white" : "hover:underline text-text",
        className
      )}
      onClick={onClick}
      {...rest}
    >
      {children}
    </Link>
  );
}
