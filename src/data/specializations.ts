import type { OwnerSuppliedImageAsset } from "../lib/assets";
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
        "Дбайлива перевірка зору з перших років життя: раннє виявлення короткозорості, амбліопії, косоокості та індивідуальний підбір дитячої оптики в спокійній ігровій формі.",
      image: { src: "/images/clinic/pediatric-chart.jpg", width: 1280, height: 960, mimeType: "image/jpeg", provenance: "owner-supplied", visuallyVerified: true },
      imageAlt: "Дитина під час діагностичного огляду у дитячого офтальмолога",
    },
    {
      id: "adult-diagnostics",
      title: "Комплексна діагностика",
      description:
        "Повне апаратне обстеження очей на цифровому обладнанні: точна авторефрактометрія, безконтактне вимірювання внутрішньоочного тиску, біомікроскопія та огляд очного дна.",
      image: { src: "/images/clinic/examination-process.jpg", width: 960, height: 1280, mimeType: "image/jpeg", provenance: "owner-supplied", visuallyVerified: true },
      imageAlt: "Огляд пацієнта на сучасній щілинній лампі",
    },
    {
      id: "care-pathway",
      title: "Лікування та оптична корекція",
      description:
        "Терапія запальних захворювань ока, контроль прогресування міопії, індивідуальний підбір складних астигматичних і прогресивних окулярних або контактних лінз.",
      image: { src: "/images/doctors/doctor-archive-22.jpg", width: 1280, height: 960, mimeType: "image/jpeg", provenance: "owner-supplied", visuallyVerified: true },
      imageAlt: "Лікар-офтальмолог під час консультації та підбору корекції",
    },
  ],
  en: [
    {
      id: "pediatric",
      title: "Pediatric Ophthalmology",
      description:
        "Gentle eye care for children of all ages: early detection of myopia, amblyopia, strabismus, and friendly optical selection in a relaxed environment.",
      image: { src: "/images/clinic/pediatric-chart.jpg", width: 1280, height: 960, mimeType: "image/jpeg", provenance: "owner-supplied", visuallyVerified: true },
      imageAlt: "Child during diagnostic eye examination",
    },
    {
      id: "adult-diagnostics",
      title: "Advanced Diagnostics",
      description:
        "Comprehensive eye examination using modern digital devices: computerized autorefraction, intraocular pressure measurement, and detailed fundus evaluation.",
      image: { src: "/images/clinic/examination-process.jpg", width: 960, height: 1280, mimeType: "image/jpeg", provenance: "owner-supplied", visuallyVerified: true },
      imageAlt: "Slit-lamp examination of an adult patient",
    },
    {
      id: "care-pathway",
      title: "Treatment & Optical Care",
      description:
        "Therapeutic treatment of eye conditions, myopia control programs, and bespoke fitting of complex astigmatic, progressive, or contact lenses.",
      image: { src: "/images/doctors/doctor-archive-22.jpg", width: 1280, height: 960, mimeType: "image/jpeg", provenance: "owner-supplied", visuallyVerified: true },
      imageAlt: "Consultation and prescription fitting with the ophthalmologist",
    },
  ],
  sk: [
    {
      id: "pediatric",
      title: "Detská oftalmológia",
      description:
        "Starostlivé vyšetrenie zraku detí od útleho veku: včasná diagnostika refrakčných chýb, tupozrakosti a šetrný výber korekčnej optiky v priateľskej atmosfére.",
      image: { src: "/images/clinic/pediatric-chart.jpg", width: 1280, height: 960, mimeType: "image/jpeg", provenance: "owner-supplied", visuallyVerified: true },
      imageAlt: "Dieťa počas vyšetrenia zraku u detského oftalmológa",
    },
    {
      id: "adult-diagnostics",
      title: "Komplexná diagnostika",
      description:
        "Prístrojové vyšetrenie zraku pomocou moderných digitálnych metód: autorefraktometria, bezkontaktná tonometria a podrobné vyšetrenie očného pozadia.",
      image: { src: "/images/clinic/examination-process.jpg", width: 960, height: 1280, mimeType: "image/jpeg", provenance: "owner-supplied", visuallyVerified: true },
      imageAlt: "Vyšetrenie dospelého pacienta na štrbinovej lampe",
    },
    {
      id: "care-pathway",
      title: "Liečba a optická korekcia",
      description:
        "Liečba očných ochorení, manažment progresie krátkozrakosti a individuálny výber prémiových okuliarových alebo kontaktných šošoviek.",
      image: { src: "/images/doctors/doctor-archive-22.jpg", width: 1280, height: 960, mimeType: "image/jpeg", provenance: "owner-supplied", visuallyVerified: true },
      imageAlt: "Konzultácia a nastavenie zrakovej korekcie",
    },
  ],
  hu: [
    {
      id: "pediatric",
      title: "Gyermekszemészet",
      description:
        "Gondos látásvizsgálat gyermekeknek már kiskortól: a rövidlátás, tompalátás és kancsalság korai felismerése, valamint kényelmes szemüvegválasztás.",
      image: { src: "/images/clinic/pediatric-chart.jpg", width: 1280, height: 960, mimeType: "image/jpeg", provenance: "owner-supplied", visuallyVerified: true },
      imageAlt: "Gyermek szemészeti vizsgálat közben",
    },
    {
      id: "adult-diagnostics",
      title: "Komplex diagnosztika",
      description:
        "Teljes körű műszeres szemvizsgálat digitális berendezésekkel: pontos autorefraktometria, szemnyomásmérés és részletes szemfenékvizsgálat.",
      image: { src: "/images/clinic/examination-process.jpg", width: 960, height: 1280, mimeType: "image/jpeg", provenance: "owner-supplied", visuallyVerified: true },
      imageAlt: "Felnőtt páciens vizsgálata réslámpával",
    },
    {
      id: "care-pathway",
      title: "Kezelés és optikai korrekció",
      description:
        "Szemészeti terápiák, a rövidlátás progressziójának kontrollja, valamint egyedi asztigmiás, progresszív vagy kontaktlencsék professzionális illesztése.",
      image: { src: "/images/doctors/doctor-archive-22.jpg", width: 1280, height: 960, mimeType: "image/jpeg", provenance: "owner-supplied", visuallyVerified: true },
      imageAlt: "Szemész szakorvosi konzultáció és optikai illesztés",
    },
  ],
};

export function getSpecializations(locale: Locale): readonly SpecializationCard[] {
  return specializations[locale];
}
