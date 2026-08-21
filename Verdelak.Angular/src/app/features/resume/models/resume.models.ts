export interface ResumeProfile {
  id?: number;
  name: string;
  title: string;
  location?: string;
  email?: string;
  phone?: string;
  website?: string;
  summary: string;
}

export interface ResumeSkillGroup {
  title: string;
  skills: string[];
}

export interface ResumeExperience {
  role: string;
  organization: string;
  start: string;
  end: string;
  location?: string;
  highlights: string[];
}

export interface ResumeProject {
  name: string;
  description: string;
  technologies: string[];
}

export interface ResumeEducation {
  credential: string;
  school: string;
  year?: string;
  notes?: string;
}

export interface ResumeCertificationAward {
  name: string;
  issuer?: string;
  year?: string;
  notes?: string;
  tags: string[];
}

export interface ResumeData {
  profile: ResumeProfile;
  skillGroups: ResumeSkillGroup[];
  experience: ResumeExperience[];
  projects: ResumeProject[];
  education: ResumeEducation[];
  certificationsAwards: ResumeCertificationAward[];
}

export interface ResumeItem {
  id: number;
  section: 'Experience' | 'Projects' | 'Skills' | 'Education' | 'Certifications & Awards';
  sortOrder: number;
  title: string;
  subtitle?: string;
  startText?: string;
  endText?: string;
  location?: string;
  body?: string;
  tags: string[];
  isActive: boolean;
}

export interface ResumeDocument {
  profile: ResumeProfile;
  items: ResumeItem[];
}

export interface ResumeItemSave {
  section: ResumeItem['section'];
  sortOrder: number;
  title: string;
  subtitle?: string;
  startText?: string;
  endText?: string;
  location?: string;
  body?: string;
  tags: string[];
  isActive: boolean;
}
