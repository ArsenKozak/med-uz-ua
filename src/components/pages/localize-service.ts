import type { ServiceDetail } from "../../lib/cms";
import { t, type Locale } from "../../lib/i18n";

export function localizeServiceDetail(
  service: ServiceDetail,
  locale: Locale,
): ServiceDetail {
  if (service.slug !== "pediatric") return service;

  return {
    ...service,
    title: t(locale, "serviceDetail.pediatricTitle"),
    description: t(locale, "serviceDetail.pediatricDescription"),
    heroTagline: t(locale, "serviceDetail.pediatricTagline"),
    keyBenefits: [
      t(locale, "serviceDetail.pediatricBenefit1"),
      t(locale, "serviceDetail.pediatricBenefit2"),
      t(locale, "serviceDetail.pediatricBenefit3"),
    ],
    metaTitle: t(locale, "serviceDetail.pediatricMetaTitle"),
    metaDescription: t(locale, "serviceDetail.pediatricMetaDescription"),
  };
}
