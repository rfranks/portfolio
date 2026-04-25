import WarbirdsPage from "@/app/warbirds/page";
import ZombieFishPage from "@/app/zombiefish/page";

describe("games smoke route contracts", () => {
  it("exports warbirds and zombiefish page components", () => {
    expect(typeof WarbirdsPage).toBe("function");
    expect(typeof ZombieFishPage).toBe("function");
  });
});
