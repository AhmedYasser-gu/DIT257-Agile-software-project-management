import { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  requiredMark?: boolean;
};

export default function Input({ label, requiredMark, ...props }: Props) {
  return (
    <label className="grid gap-1">
      {label && <span className="label">{label} {requiredMark ? "*" : null}</span>}
      <input className="input" {...props} />
    </label>
  );
}
