import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
};

export default function Button({ variant = "primary", className, ...props }: Props) {
  return (
    <button
      {...props}
      className={clsx(variant === "primary" ? "btn-primary" : "btn-outline", className)}
    />
  );
}
