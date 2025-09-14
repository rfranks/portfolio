import { saveItem, loadItem, deleteItem, listItems } from "../../utils/storage";

describe("storage utilities", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("saveItem and loadItem roundtrip", () => {
    const key = "test";
    const value = { a: 1 };
    saveItem(key, value, 1);
    expect(loadItem<typeof value>(key, 1)).toEqual(value);
  });

  test("loadItem migrates older versions", () => {
    const key = "old";
    saveItem(key, { name: "old" }, 1);

    const migrated = loadItem<{ name: string }>(
      key,
      2,
      (data) => {
        const item = data as { name?: unknown };
        return { name: String(item.name) + "2" };
      }
    );
    expect(migrated).toEqual({ name: "old2" });
    // migrated value should be stored with new version
    expect(loadItem(key, 2)).toEqual({ name: "old2" });
  });

  test("deleteItem removes value", () => {
    saveItem("tmp", 123, 1);
    deleteItem("tmp");
    expect(loadItem("tmp", 1)).toBeUndefined();
  });

  test("listItems respects prefix and version", () => {
    saveItem("p:one", 1, 1);
    saveItem("p:two", 2, 2); // different version
    saveItem("other", 3, 1);

    const items = listItems<number>("p:", 1);
    expect(items).toEqual({ "p:one": 1 });
  });
});
