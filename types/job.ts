export interface Job {
  id: string;
  url: string;
  title: string;
  content: string;
  createdAt: Date | null;

  // 抽出された構造化データ
  companyName: string | null;
  jobTitle: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryBand: "〜500" | "500-700" | "700-900" | "900+" | null;
  jobDescription: string | null;
  requiredPerson: string | null;
  jobType: string | null;
  industry: string | null;
}

