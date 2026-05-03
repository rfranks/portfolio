import WarbirdsPageClient from "@/app/warbirds/WarbirdsPageClient";
import ZombieFishPageClient from "@/app/zombiefish/ZombieFishPageClient";

describe("games smoke route contracts", () => {
  it("exports warbirds and zombiefish launcher components", () => {
    expect(typeof WarbirdsPageClient).toBe("function");
    expect(typeof ZombieFishPageClient).toBe("function");
  });
});
