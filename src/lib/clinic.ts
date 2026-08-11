export const PENDING_CLINIC_CONFIRMATION: "Pending clinic confirmation" =
  "Pending clinic confirmation";

export const BOOKING_HREF: "/#appointment-form" = "/#appointment-form";

export interface ClinicContact {
  readonly city: "Uzhhorod";
  readonly country: "Ukraine";
  readonly streetAddress: "Yuriy Goyda St, 10A";
  readonly floor: "2nd floor";
  readonly phoneDisplay: "+380 99 777 07 58";
  readonly phoneHref: "tel:+380997770758";
  readonly workingHours: typeof PENDING_CLINIC_CONFIRMATION;
}

export interface ChiefPhysician {
  readonly name: "Мирослава Леньо";
  readonly role: "Founder & Chief Physician";
  readonly experience: "In ophthalmology since 2004";
}

export const clinicContact: ClinicContact = {
  city: "Uzhhorod",
  country: "Ukraine",
  streetAddress: "Yuriy Goyda St, 10A",
  floor: "2nd floor",
  phoneDisplay: "+380 99 777 07 58",
  phoneHref: "tel:+380997770758",
  workingHours: PENDING_CLINIC_CONFIRMATION,
};

export const chiefPhysician: ChiefPhysician = {
  name: "Мирослава Леньо",
  role: "Founder & Chief Physician",
  experience: "In ophthalmology since 2004",
};
