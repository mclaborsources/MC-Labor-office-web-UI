/** Customer Profile tabs — Access frmCustomer parity. */
export const CUSTOMER_PROFILE_TABS = [
  { id: "01-basic", label: "01 Basic Info" },
  { id: "02-contacts", label: "02 Contacts" },
  { id: "03-billrates", label: "03 Bill Rates" },
  { id: "04-insurance", label: "04 Insurance Info" },
  { id: "05-sales", label: "05 Sales" },
  { id: "06-collections", label: "06 Collections" },
  { id: "07-wcc", label: "07 Customer WCCs" },
  { id: "08-inscert", label: "08 Insurance Cert Req" },
  { id: "09-options", label: "09 Options" },
  { id: "10-mult", label: "10 Rate Multipliers" },
  { id: "11-jobs", label: "11 Jobs" },
  { id: "12-saleshist", label: "12 Sales History" },
  { id: "13-segments", label: "13 Segments" },
] as const;

export const CUSTOMER_PROFILE_LINK_ENTITIES = ["AMP", "GS", "HDE", "HSG", "IPG", "ISG", "MLS"] as const;

export const CUSTOMER_PROFILE_LINK_ACTIONS = ["Open Contract", "Open W-9", "Open WC", "Open GL"] as const;

export const CUSTOMER_PROFILE_TOOLBAR_BUTTONS = [
  "Make Me the Hunter",
  "Invoice Notes History",
  "Form Letter",
  "Invoice Search",
] as const;
