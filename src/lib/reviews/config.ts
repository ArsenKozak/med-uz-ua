import { z } from "zod";

const googlePlaceIdSchema = z
  .string()
  .trim()
  .regex(/^ChI[A-Za-z0-9_-]{10,}$/);

const trustindexWidgetIdSchema = z
  .string()
  .trim()
  .min(12)
  .max(100)
  .regex(/^[A-Za-z0-9_-]+$/);

export interface ReviewsConfiguration {
  readonly googlePlaceIdConfigured: boolean;
  readonly googleReviewHref: string | null;
  readonly trustindexWidgetConfigured: boolean;
  /** False until the provider-issued embed snippet is supplied and verified. */
  readonly trustindexEmbedVerified: false;
}

export function getReviewsConfiguration(): ReviewsConfiguration {
  const placeId = googlePlaceIdSchema.safeParse(
    import.meta.env.PUBLIC_GOOGLE_PLACE_ID,
  );
  const widgetId = trustindexWidgetIdSchema.safeParse(
    import.meta.env.PUBLIC_TRUSTINDEX_WIDGET_ID,
  );

  return Object.freeze({
    googlePlaceIdConfigured: placeId.success,
    googleReviewHref: placeId.success
      ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId.data)}`
      : null,
    trustindexWidgetConfigured: widgetId.success,
    trustindexEmbedVerified: false,
  });
}
