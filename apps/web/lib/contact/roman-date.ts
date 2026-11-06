// Roman dating for the contact letters: Roman numerals, the Kalends/Nones/Ides
// calendar ("a.d. VIII Id. Nov.") and the year ab urbe condita.
//
// The leap-day quirk (the doubled a.d. VI Kal. Mart.) is ignored — a scroll
// dated one day off in late February of a leap year is an acceptable heresy.

const NUMERALS: ReadonlyArray<readonly [number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export function toRoman(value: number): string {
  let rest = Math.floor(value);
  if (rest <= 0) return "";
  let out = "";
  for (const [n, glyph] of NUMERALS) {
    while (rest >= n) {
      out += glyph;
      rest -= n;
    }
  }
  return out;
}

const MONTHS = [
  "Ian.",
  "Feb.",
  "Mart.",
  "Apr.",
  "Mai.",
  "Iun.",
  "Iul.",
  "Aug.",
  "Sept.",
  "Oct.",
  "Nov.",
  "Dec.",
] as const;

/** Nones fall on the 7th in March, May, July and October; the 5th otherwise. */
function nonesOf(month: number): number {
  return [2, 4, 6, 9].includes(month) ? 7 : 5;
}

function countDown(target: number, day: number, mark: string, month: string): string {
  // Romans counted inclusively: the day before is "pridie", earlier days are
  // "ante diem N", where N counts both ends.
  if (target - day === 1) return `prid. ${mark} ${month}`;
  return `a.d. ${toRoman(target - day + 1)} ${mark} ${month}`;
}

/** "a.d. VIII Id. Nov." — the day in the Roman calendar (UTC). */
export function romanDay(date: Date): string {
  const day = date.getUTCDate();
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();
  const nones = nonesOf(month);
  const ides = nones + 8;

  if (day === 1) return `Kal. ${MONTHS[month]}`;
  if (day < nones) return countDown(nones, day, "Non.", MONTHS[month]);
  if (day === nones) return `Non. ${MONTHS[month]}`;
  if (day < ides) return countDown(ides, day, "Id.", MONTHS[month]);
  if (day === ides) return `Id. ${MONTHS[month]}`;

  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return countDown(lastDay + 1, day, "Kal.", MONTHS[(month + 1) % 12]);
}

/** Years since the founding of Rome (753 BC). */
export function abUrbeCondita(date: Date): number {
  return date.getUTCFullYear() + 753;
}

/** "a.d. VIII Id. Nov. MMXXVI · AUC MMDCCLXXIX" */
export function romanDateLine(date: Date): string {
  return `${romanDay(date)} ${toRoman(date.getUTCFullYear())} · AUC ${toRoman(abUrbeCondita(date))}`;
}
