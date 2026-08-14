import type { ServiceDetail } from "../../lib/cms";
import type { Locale } from "../../lib/i18n";
import { getSpecializations } from "../../data/specializations";

export function localizeServiceDetail(
  service: ServiceDetail,
  locale: Locale,
): ServiceDetail {
  const specs = getSpecializations(locale);
  
  if (service.slug === "pediatric") {
    const spec = specs.find((s) => s.id === "pediatric");
    if (spec) {
      return {
        ...service,
        title: spec.title,
        description: spec.description,
      };
    }
  }

  if (service.slug === "adult") {
    const spec = specs.find((s) => s.id === "adult-diagnostics");
    if (spec) {
      return {
        ...service,
        title: spec.title,
        description: spec.description,
      };
    }
  }

  if (service.slug === "surgical") {
    const spec = specs.find((s) => s.id === "care-pathway");
    if (spec) {
      return {
        ...service,
        title: spec.title,
        description: spec.description,
      };
    }
  }

  return service;
}
