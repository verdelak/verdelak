import { ResumeData } from '../models/resume.models';

export const RESUME_DATA: ResumeData = {
  profile: {
    name: 'Verdelak',
    title: 'Resume',
    location: 'United States',
    summary: 'Resume content has not been filled in yet. This page is ready for a professional summary, experience, projects, skills, and education details.'
  },
  skillGroups: [
    {
      title: 'Technical',
      skills: ['ASP.NET', 'Angular', 'SQL Server', 'TypeScript']
    },
    {
      title: 'Professional',
      skills: ['Documentation', 'Problem solving', 'Process improvement', 'Systems support']
    }
  ],
  experience: [
    {
      role: 'Current or Recent Role',
      organization: 'Organization Name',
      start: 'Start Date',
      end: 'Present',
      highlights: [
        'Add a concise accomplishment, responsibility, or measurable result.',
        'Add another bullet that shows scope, tools, or impact.'
      ]
    }
  ],
  projects: [
    {
      name: 'Verdelak Applications',
      description: 'Personal application suite for organizing collections, reviews, inventory, schedules, and supporting data.',
      technologies: ['ASP.NET Core', 'Angular', 'SQL Server']
    }
  ],
  education: [
    {
      credential: 'Credential or Certification',
      school: 'School or Issuer',
      notes: 'Add degree, certification, training, or continuing education details.'
    }
  ],
  certificationsAwards: [
    {
      name: 'Eagle Scout',
      issuer: 'Boy Scouts of America',
      notes: 'Add award year, project notes, leadership details, or other relevant context.',
      tags: ['Award', 'Leadership']
    }
  ]
};
