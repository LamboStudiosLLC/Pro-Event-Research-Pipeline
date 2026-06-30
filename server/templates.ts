// Email-template helpers for the extension's /templates and /generate routes.
// Templates themselves now live in Firestore (shared_templates + each user's
// users/{uid}/templates); see server/extension.ts for the lookups. This module
// keeps the always-present built-in default plus the placeholder substitution
// that mirrors PipelineCard's applyReplacementsForContact.
import {
  DEFAULT_TEMPLATE_ID,
  DEFAULT_TEMPLATE_NAME,
  DEFAULT_TEMPLATE_SUBJECT,
  DEFAULT_TEMPLATE_TEXT,
} from "../src/lib/defaultTemplate";

export interface ExtensionTemplate {
  id: string;
  name: string;
  subject: string;
  text: string;
}

// User/shared templates carry no subject of their own, so they inherit this.
export const DEFAULT_SUBJECT = DEFAULT_TEMPLATE_SUBJECT;

export const BUILT_IN_TEMPLATE: ExtensionTemplate = {
  id: DEFAULT_TEMPLATE_ID,
  name: DEFAULT_TEMPLATE_NAME,
  subject: DEFAULT_TEMPLATE_SUBJECT,
  text: DEFAULT_TEMPLATE_TEXT,
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Mirror of PipelineCard.extractMonth.
function extractMonth(dateStr: string): string {
  if (!dateStr) return "upcoming month";
  for (const m of MONTHS) {
    if (new RegExp(m, "i").test(dateStr)) return m;
  }
  const d = new Date(dateStr + (dateStr.match(/^\d{4}-\d{2}-\d{2}$/) ? "T00:00:00" : ""));
  if (!isNaN(d.getTime())) return d.toLocaleDateString("en-US", { month: "long" });
  return dateStr;
}

// Mirror of PipelineCard.extractCity.
function extractCity(loc: string): string {
  if (!loc) return "your area";
  const trimmed = loc.trim();
  if (!trimmed) return "your area";
  const parts = trimmed.split(",").map((p) => p.trim());
  if (parts.length === 1) return parts[0];
  const countries = ["usa", "us", "united states", "united kingdom", "uk", "canada", "germany", "france", "spain", "italy"];
  let lastIndex = parts.length - 1;
  if (countries.includes(parts[lastIndex].toLowerCase())) lastIndex--;
  if (lastIndex > 0) return parts[lastIndex - 1];
  return parts[0];
}

export interface ReplacementInput {
  eventName: string;
  contactName: string;
  location: string;
  date: string;
  salesperson: string;
}

// Mirror of PipelineCard.applyReplacementsForContact.
export function applyReplacements(text: string, input: ReplacementInput): string {
  const name = input.eventName;
  let out = text;
  out = out.replace(/\[Event Name\]/gi, name);
  out = out.replace(/\[Vendor Name\]/gi, name);
  out = out.replace(/\[Event\]/gi, name);
  out = out.replace(/\[Vendor\]/gi, name);
  out = out.replace(/\[Salesperson\]/gi, input.salesperson || "Sales Representative");
  out = out.replace(/\[Contact Name\]/gi, input.contactName || "Team");
  out = out.replace(/\[Location\]/gi, extractCity(input.location || "your area"));
  out = out.replace(/\[Month\]/gi, extractMonth(input.date || ""));
  return out;
}
