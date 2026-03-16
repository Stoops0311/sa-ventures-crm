import { COMPANY_NAME } from "./constants"

interface LeadData {
  name: string
  mobileNumber: string
}

interface ProjectData {
  name: string
  location: string
  priceRange: string
}

interface SalespersonData {
  name: string
}

export function resolveTemplate(
  body: string,
  lead: LeadData,
  project: ProjectData | null,
  salesperson: SalespersonData | null
): string {
  return body
    .replace(/\{\{leadName\}\}/g, lead.name)
    .replace(/\{\{leadPhone\}\}/g, lead.mobileNumber)
    .replace(/\{\{projectName\}\}/g, project?.name ?? "")
    .replace(/\{\{projectLocation\}\}/g, project?.location ?? "")
    .replace(/\{\{projectPriceRange\}\}/g, project?.priceRange ?? "")
    .replace(/\{\{salespersonName\}\}/g, salesperson?.name ?? "")
    .replace(/\{\{companyName\}\}/g, COMPANY_NAME)
}
