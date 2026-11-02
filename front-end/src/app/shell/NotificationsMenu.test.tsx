import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import NotificationsMenu from "./NotificationsMenu";

describe("NotificationsMenu", () => {
  it("shows the empty-state message once opened, rather than fabricated sample notifications", async () => {
    const user = userEvent.setup();
    render(<NotificationsMenu />);

    expect(screen.queryByText("No notifications yet.")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Notifications" }));

    expect(await screen.findByText("No notifications yet.")).toBeInTheDocument();
  });
});
