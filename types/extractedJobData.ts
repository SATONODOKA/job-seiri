/**
 * 抽出された求人情報の型定義
 */

export type EmploymentType = "full_time" | "contract" | "temporary" | "intern" | "other" | null;

export interface ExtractedJobData {
  companyName: string | null;
  jobTitle: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryBand: "〜500" | "500-700" | "700-900" | "900+" | null;
  locationText: string | null;
  remoteType: "onsite" | "hybrid" | "remote" | "unknown";
  employmentType: EmploymentType;
  requiredYears: number | null;
  seniorityLevel: "junior" | "mid" | "senior" | "manager" | null;
  jobDescription: string | null;
  requiredPerson: string | null;
  jobType: string | null;
  industry: string | null;
}
