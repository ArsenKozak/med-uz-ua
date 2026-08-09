export const PENDING_CLINIC_CONFIRMATION: "Pending clinic confirmation" =
  "Pending clinic confirmation";

export const BOOKING_HREF: "/#appointment-form" = "/#appointment-form";

export interface ClinicContact {
  readonly city: "Uzhhorod";
  readonly country: "Ukraine";
  readonly streetAddress: "Yuriy Goyda St, 10A";
  readonly floor: "2nd floor";
  readonly phoneDisplay: "+38 (099) 777-07-58";
  readonly phoneHref: "tel:+380997770758";
  readonly workingHours: typeof PENDING_CLINIC_CONFIRMATION;
}

export interface ChiefPhysician {
  readonly name: "Dr. Myroslava Yunivna Leno";
  readonly role: "Chief Physician";
  readonly experience: "15+ years experience";
}

export const clinicContact: ClinicContact = {
  city: "Uzhhorod",
  country: "Ukraine",
  streetAddress: "Yuriy Goyda St, 10A",
  floor: "2nd floor",
  phoneDisplay: "+38 (099) 777-07-58",
  phoneHref: "tel:+380997770758",
  workingHours: PENDING_CLINIC_CONFIRMATION,
};

export const chiefPhysician: ChiefPhysician = {
  name: "Dr. Myroslava Yunivna Leno",
  role: "Chief Physician",
  experience: "15+ years experience",
};
