import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { parse } from "../../parser";
import { toIBAN } from "../../lib/payment";
import { compile } from "../../runtime/compile";

import type { QrNode } from "../../types/ast";

const SOURCE = `:::config
format: A4
theme: invoice
:::

:::page

:::invoice
title: Faktura
number: 260603001
issued: 03.06.2026
due: 17.06.2026
payment: převodem
:::

---columns 50 50

:::party Dodavatel
OSVČ Semen Bozhyk
Malkovského 948
199 00 Praha 9 - Letňany
IČO: 22290575
Nejsem plátce DPH
:::

---

:::party Odběratel
[Název / jméno odběratele]
[Adresa]
:::

---columns-end

| Označení položky | Množství | Celkem |
|------------------|---------:|-------:|
| Sklo [typ / rozměr] | [ks] | [částka] Kč |

:::total [částka] Kč

:::qr
acc: 2422180004/5500
iban: CZ6155000000002422180004
vs: 260603001
msg: Faktura 260603001
:::

:::sign Semen Bozhyk

:::page-end
`;

describe("invoice directives", () => {
  it("parses the document structure in source order", () => {
    const doc = parse(SOURCE);
    expect(doc.config.theme).toBe("invoice");

    const types = doc.children[0].children.map((c) => c.type);
    expect(types).toEqual([
      "invoice",
      "columns",
      "table",
      "total",
      "qr",
      "sign",
    ]);
  });

  it("omits the eyebrow when no subtitle is given", () => {
    const doc = parse(SOURCE);
    const invoice = doc.children[0].children.find((c) => c.type === "invoice");
    expect(invoice).toMatchObject({ type: "invoice", title: "Faktura" });
    expect(invoice && "subtitle" in invoice && invoice.subtitle).toBeFalsy();
  });

  it("parses supplier and customer parties inside columns", () => {
    const doc = parse(SOURCE);
    const columns = doc.children[0].children.find((c) => c.type === "columns");
    if (columns?.type !== "columns") throw new Error("no columns");

    const supplier = columns.children[0].children[0];
    const customer = columns.children[1].children[0];

    expect(supplier).toMatchObject({
      type: "party",
      role: "Dodavatel",
      name: "OSVČ Semen Bozhyk",
    });
    expect(supplier.type === "party" && supplier.lines).toContain(
      "Nejsem plátce DPH",
    );
    expect(customer).toMatchObject({
      type: "party",
      role: "Odběratel",
      name: "[Název / jméno odběratele]",
    });
  });

  it("uses the explicit IBAN and omits amount from the SPAYD payload", () => {
    const doc = parse(SOURCE);
    const qr = doc.children[0].children.find(
      (c): c is QrNode => c.type === "qr",
    );
    expect(qr).toBeDefined();
    // Explicit IBAN matches the one derived from the account number
    expect(qr!.iban).toBe("CZ6155000000002422180004");
    expect(toIBAN("2422180004/5500")).toBe("CZ6155000000002422180004");
    // No amount line provided -> no AM in the payload (payer enters amount)
    expect(qr!.payload).toBe(
      "SPD*1.0*ACC:CZ6155000000002422180004*CC:CZK*X-VS:260603001*MSG:Faktura 260603001",
    );
    expect(qr!.payload).not.toContain("AM:");
    expect(qr!.qrPath.startsWith("M")).toBe(true);
  });

  it("renders the invoice without displaying IBAN or DPH", () => {
    const { element, error } = compile(SOURCE);
    expect(error).toBeNull();
    const { container } = render(element!);
    const html = container.innerHTML;

    expect(container.querySelector('[data-theme="invoice"]')).not.toBeNull();
    expect(html).toContain("260603001");
    expect(html).toContain("OSVČ Semen Bozhyk");
    expect(html).toContain("Č. účtu");
    expect(html).toContain("2422180004/5500");
    expect(html).toContain("QR Platba");
    expect(html).toContain("Podpis");
    expect(container.querySelector(".pmdxjs-qr-img path")).not.toBeNull();

    // Neither IBAN nor "daňový doklad" should appear on the document
    expect(html).not.toContain("CZ6155");
    expect(html.toLowerCase()).not.toContain("daňový doklad");
  });
});
