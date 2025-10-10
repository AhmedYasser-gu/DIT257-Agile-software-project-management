import { render, screen, fireEvent } from "@testing-library/react";
import Input from "./Input";

describe("Input", () => {
  it("renders label, required mark and forwards props", () => {
    const onChange = vi.fn();
    render(
      <Input
        label="Email"
        requiredMark
        placeholder="you@example.com"
        onChange={onChange}
      />
    );

    const labelSpan = screen.getByText(/Email/);
    expect(labelSpan).toBeInTheDocument();
    expect(labelSpan.textContent).toContain("*"); // handle whitespace/newline

    const el = screen.getByPlaceholderText("you@example.com") as HTMLInputElement;
    fireEvent.change(el, { target: { value: "a@b.com" } });
    expect(onChange).toHaveBeenCalled();
  });
});
