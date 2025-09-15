import { addResume, cloneResume, type ResumeEntry } from "../../utils/talentforge/dataStore";
import { computeDiff } from "../../components/talentforge/ResumeVariants/Diff";

describe("resume cloning", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("cloneResume duplicates resume with unique id and title", () => {
    const resume: ResumeEntry = {
      id: "r1",
      userId: "",
      label: "",
      title: "My Resume",
      url: "",
      content: "content A",
      tags: [],
      parsed: { contact: "", experience: [], education: [], skills: [] },
    };
    addResume(resume);
    const updated = cloneResume(resume);
    expect(updated).toHaveLength(2);
    const clone = updated.find((r) => r.id !== resume.id)!;
    expect(clone.content).toBe(resume.content);
    expect(clone.id).not.toBe(resume.id);
    expect(clone.title).toBe("My Resume (2)");
  });
});

describe("resume diff", () => {
  test("computeDiff marks added and removed lines", () => {
    const original = "line1\nline2";
    const updated = "line1\nline3\nline4";
    const diff = computeDiff(original, updated);
    expect(diff[0]).toEqual({
      original: { text: "line1", type: "same" },
      updated: { text: "line1", type: "same" },
    });
    expect(diff[1]).toEqual({
      original: { text: "line2", type: "removed" },
      updated: { text: "line3", type: "added" },
    });
    expect(diff[2]).toEqual({
      original: { text: null, type: "same" },
      updated: { text: "line4", type: "added" },
    });
  });
});

