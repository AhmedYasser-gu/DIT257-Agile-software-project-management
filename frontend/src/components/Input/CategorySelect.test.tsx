import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import CategorySelect from "./CategorySelect";

function typeInto(el: HTMLElement, value: string) {
  fireEvent.change(el, { target: { value } });
}

function openMenu(input: HTMLElement) {
  fireEvent.focus(input); // should open the dropdown
}

function getMenuContainerByCreateButton(textInsideCreateBtn: string) {
  const createBtn = screen.getByRole("button", {
    name: new RegExp(`\\+ Create.*${textInsideCreateBtn}`),
  });
  return createBtn.closest(".shadow-lg") as HTMLElement;
}

describe("CategorySelect", () => {
  it("renders label/helper and shows suggestions on focus/type", () => {
    render(
      <CategorySelect
        label="Food category"
        value=""
        onChange={() => {}}
        helper="Pick one"
        presets={["Bakery & Pastry", "Dairy & Eggs", "Snacks"]}
      />
    );

    expect(screen.getByText("Food category")).toBeInTheDocument();
    expect(screen.getByText("Pick one")).toBeInTheDocument();

    const input = screen.getByRole("textbox");
    openMenu(input);
    typeInto(input, "da");

    const menu = getMenuContainerByCreateButton("da");
    expect(
      within(menu).getByRole("button", { name: "Dairy & Eggs" })
    ).toBeInTheDocument();
  });

  it("clicking an option calls onChange and closes list", async () => {
    const onChange = vi.fn();
    render(
      <CategorySelect
        label="Category"
        value=""
        onChange={onChange}
        presets={["Bakery & Pastry", "Dairy & Eggs"]}
      />
    );

    const input = screen.getByRole("textbox");
    openMenu(input);
    typeInto(input, "bak");

    const menu = getMenuContainerByCreateButton("bak");
    const option = within(menu).getByRole("button", {
      name: "Bakery & Pastry",
    });

    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith("Bakery & Pastry");

    // Wait until dropdown is removed
    await waitFor(() => {
      expect(within(document.body).queryByText(/\+ Create/)).not.toBeInTheDocument();
    });
  });

  it("arrow keys move active option; Escape closes list", async () => {
    const onChange = vi.fn();
    render(
      <CategorySelect
        value=""
        onChange={onChange}
        presets={["Aaa", "Bbb", "Ccc"]}
      />
    );

    const input = screen.getByRole("textbox");
    openMenu(input);

    fireEvent.keyDown(input, { key: "ArrowDown" }); // active → Bbb
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("Bbb");

    // Reopen and Escape
    openMenu(input);
    fireEvent.keyDown(input, { key: "Escape" });

    // Dropdown should disappear
    await waitFor(() => {
      expect(document.querySelector(".shadow-lg")).not.toBeInTheDocument();
    });
  });

  it("Enter selects typed value if not preset; quick button selects too", () => {
    const onChange = vi.fn();
    render(
      <CategorySelect value="" onChange={onChange} presets={["Aaa", "Bbb"]} />
    );

    const input = screen.getByRole("textbox");
    openMenu(input);

    typeInto(input, "Fresh Produce");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("Fresh Produce");

    typeInto(input, "NewCat");
    const quick = screen.getByRole("button", { name: /Selected.*NewCat/ });
    fireEvent.click(quick);
    expect(onChange).toHaveBeenCalledWith("NewCat");
  });

  it("chips (preset pills) are clickable", () => {
    const onChange = vi.fn();
    render(
      <CategorySelect
        value=""
        onChange={onChange}
        presets={["Aaa", "Bbb", "Ccc"]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Bbb" }));
    expect(onChange).toHaveBeenCalledWith("Bbb");
  });
});
