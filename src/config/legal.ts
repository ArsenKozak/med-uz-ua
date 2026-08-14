export const legalConfig = {
  legalName: "ФОП Леньо Мирослава Юріївна",
  shortLegalName: "ФОП Леньо М. Ю.",
  taxId: "2977920204",
  taxIdLabel: "РНОКПП (ІПН)",
  legalAddress: "м. Ужгород, вул. Юрія Гойди, 10А",
  actualAddress: "м. Ужгород, вул. Юрія Гойди, 10А",
  phoneDisplay: "+380 50 67 36 444",
  phoneHref: "tel:+380506736444",
  email: "gloria130781@gmail.com",
} as const;

export type LegalConfig = typeof legalConfig;
