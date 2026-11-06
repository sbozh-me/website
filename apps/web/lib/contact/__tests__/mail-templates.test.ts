import { describe, expect, it } from "vitest";

import { contactAckMail, contactNotificationMail, escapeHtml } from "../mail-templates";

const date = new Date(Date.UTC(2026, 10, 6));

describe("contact mail templates", () => {
  it("escapes HTML in the message", () => {
    const mail = contactNotificationMail({
      date,
      email: "a@b.c",
      message: "<script>alert(1)</script>",
      name: "",
    });
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.subject).toBe("Nuntius: a letter from a@b.c");
  });

  it("names the sender in the notification", () => {
    const mail = contactNotificationMail({ date, email: "a@b.c", message: "hi", name: "Ada" });
    expect(mail.subject).toBe("Nuntius: a letter from Ada");
    expect(mail.text).toContain("It bears the seal of Ada <a@b.c>.");
    expect(mail.text).toContain("> hi");
  });

  it("writes the acknowledgement as a Roman letter", () => {
    const mail = contactAckMail({ date, message: "hi", name: "Ada" });
    expect(mail.subject).toBe("Litterae acceptae — your letter reached sbozh.me");
    expect(mail.text).toContain("Salve, Ada.");
    expect(mail.text).toContain("a.d. VIII Id. Nov. MMXXVI · AUC MMDCCLXXIX");
    expect(mail.text).toContain("Vale.");
    expect(mail.html).toContain("#4A1C2A");
  });

  it("greets an anonymous sender as a traveller", () => {
    expect(contactAckMail({ date, message: "hi", name: "" }).text).toContain("Salve, traveller.");
  });

  it("escapes names in HTML", () => {
    const mail = contactAckMail({ date, message: "hi", name: "<b>Ada</b>" });
    expect(mail.html).toContain("Salve, &lt;b&gt;Ada&lt;/b&gt;.");
  });

  it("escapes quotes", () => {
    expect(escapeHtml(`"'&`)).toBe("&quot;&#39;&amp;");
  });
});
