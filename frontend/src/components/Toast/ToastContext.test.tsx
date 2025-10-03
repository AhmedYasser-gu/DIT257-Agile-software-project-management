import { render, screen } from "@testing-library/react";
import { ToastProvider, useToast } from "./ToastContext";

function Demo() {
  const t = useToast();
  return (
    <>
      <button onClick={() => t.success("OK!")}>ok</button>
      <button onClick={() => t.error("Nope", "Bad stuff")}>err</button>
    </>
  );
}

describe("ToastContext", () => {
  it("shows and auto-dismisses", async () => {
    render(<ToastProvider><Demo /></ToastProvider>);
    screen.getByText("ok").click();
    expect(await screen.findByText("OK!")).toBeInTheDocument();
  });

  it("shows error with message", async () => {
    render(<ToastProvider><Demo /></ToastProvider>);
    screen.getByText("err").click();
    expect(await screen.findByText("Nope")).toBeInTheDocument();
    expect(await screen.findByText(/Bad stuff/)).toBeInTheDocument();
  });
});
