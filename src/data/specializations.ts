import { clinicImageAssets, type OwnerSuppliedImageAsset } from "../lib/assets";
import type { Locale } from "../lib/i18n";

export interface SpecializationCard {
  readonly id: "pediatric" | "adult-diagnostics" | "care-pathway";
  readonly title: string;
  readonly description: string;
  readonly image: OwnerSuppliedImageAsset;
  readonly imageAlt: string;
}

const specializations: Readonly<Record<Locale, readonly SpecializationCard[]>> = {
  uk: [
    {
      id: "pediatric",
      title: "Дитяча офтальмологія",
      description:
        "Консультації та діагностичні етапи для дітей у межах послуг, підтверджених чинним прайсом клініки.",
      image: clinicImageAssets.pediatricExamination,
      imageAlt: "Дитина під час обстеження на офтальмологічному обладнанні",
    },
    {
      id: "adult-diagnostics",
      title: "Доросла офтальмологія",
      description:
        "Огляд і окремі діагностичні процедури; відповідний обсяг визначається під час консультації.",
      image: clinicImageAssets.adultExamination,
      imageAlt: "Дорослий пацієнт під час огляду на щілинній лампі",
    },
    {
      id: "care-pathway",
      title: "Хірургічний супровід",
      description:
        "Обговорення діагностичних результатів і подальших кроків, зокрема направлення, коли воно доречне. Формат не означає, що операція виконується в клініці.",
      image: clinicImageAssets.diagnosticConsultation,
      imageAlt: "Лікарка та пацієнт біля діагностичного обладнання",
    },
  ],
  en: [
    {
      id: "pediatric",
      title: "Pediatric ophthalmology",
      description:
        "Appointments and diagnostic steps for children within the services confirmed by the clinic’s current price list.",
      image: clinicImageAssets.pediatricExamination,
      imageAlt: "A child being examined with ophthalmic equipment",
    },
    {
      id: "adult-diagnostics",
      title: "Adult ophthalmology",
      description:
        "Examination and selected diagnostic procedures; the appropriate scope is determined during consultation.",
      image: clinicImageAssets.adultExamination,
      imageAlt: "An adult patient during a slit-lamp examination",
    },
    {
      id: "care-pathway",
      title: "Surgical support",
      description:
        "Discussion of diagnostic findings and next steps, including referral when appropriate. This does not state that surgery is performed at the clinic.",
      image: clinicImageAssets.diagnosticConsultation,
      imageAlt: "A clinician and patient beside diagnostic equipment",
    },
  ],
  sk: [
    {
      id: "pediatric",
      title: "Detská oftalmológia",
      description:
        "Konzultácie a diagnostické kroky pre deti v rozsahu služieb potvrdených aktuálnym cenníkom kliniky.",
      image: clinicImageAssets.pediatricExamination,
      imageAlt: "Dieťa počas vyšetrenia oftalmologickým prístrojom",
    },
    {
      id: "adult-diagnostics",
      title: "Oftalmológia dospelých",
      description:
        "Vyšetrenie a vybrané diagnostické postupy; vhodný rozsah sa určuje počas konzultácie.",
      image: clinicImageAssets.adultExamination,
      imageAlt: "Dospelý pacient počas vyšetrenia štrbinovou lampou",
    },
    {
      id: "care-pathway",
      title: "Chirurgická podpora",
      description:
        "Rozhovor o diagnostických nálezoch a ďalších krokoch vrátane odporúčania, ak je vhodné. Text netvrdí, že sa operácia vykonáva na klinike.",
      image: clinicImageAssets.diagnosticConsultation,
      imageAlt: "Lekárka a pacient pri diagnostickom zariadení",
    },
  ],
  hu: [
    {
      id: "pediatric",
      title: "Gyermekszemészet",
      description:
        "Konzultációk és diagnosztikai lépések gyermekeknek a klinika aktuális árlistáján megerősített szolgáltatások körében.",
      image: clinicImageAssets.pediatricExamination,
      imageAlt: "Gyermek szemészeti berendezéssel végzett vizsgálat közben",
    },
    {
      id: "adult-diagnostics",
      title: "Felnőtt szemészet",
      description:
        "Vizsgálat és egyes diagnosztikai eljárások; a megfelelő terjedelmet a konzultáció során határozzák meg.",
      image: clinicImageAssets.adultExamination,
      imageAlt: "Felnőtt páciens réslámpás vizsgálat közben",
    },
    {
      id: "care-pathway",
      title: "Sebészeti támogatás",
      description:
        "A diagnosztikai eredmények és a következő lépések megbeszélése, szükség esetén beutalással. Ez nem állítja, hogy a klinikán műtétet végeznek.",
      image: clinicImageAssets.diagnosticConsultation,
      imageAlt: "Orvos és páciens diagnosztikai berendezés mellett",
    },
  ],
};

export function getSpecializations(locale: Locale): readonly SpecializationCard[] {
  return specializations[locale];
}
