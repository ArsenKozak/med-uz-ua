import { GOOGLE_BUSINESS_PROFILE_HREF } from "../clinic";

export interface ReviewsConfiguration {
  readonly googleBusinessProfileHref: string;
  readonly showsLiveRating: false;
}

export const reviewsConfiguration: ReviewsConfiguration = Object.freeze({
  googleBusinessProfileHref: GOOGLE_BUSINESS_PROFILE_HREF,
  showsLiveRating: false,
});
