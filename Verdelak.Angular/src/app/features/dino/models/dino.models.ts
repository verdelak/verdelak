export interface DinoTaxonomyNode {
  id: number;
  rank: string;
  name: string;
  parentId: number | null;
  parentName: string | null;
  description: string | null;
  sortOrder: number;
}

export interface DinoTaxonomyNodeUpsert {
  rank: string;
  name: string;
  parentId: number | null;
  description: string | null;
  sortOrder: number;
}

export interface DinosaurSummary {
  id: number;
  commonName: string;
  scientificName: string;
  slug: string;
  kingdomName: string | null;
  phylumName: string | null;
  className: string | null;
  clades: string | null;
  familyName: string | null;
  subfamilyName: string | null;
  genusName: string | null;
  speciesName: string | null;
  discoveryDate: string | null;
  discoveredBy: string | null;
  hasDescription: boolean;
  sectionCount: number;
  illustrationCount: number;
  isPublished: boolean;
}

export interface DinosaurDetail {
  id: number;
  commonName: string;
  scientificName: string;
  slug: string;
  kingdomId: number | null;
  kingdomName: string | null;
  phylumId: number | null;
  phylumName: string | null;
  classId: number | null;
  className: string | null;
  clades: string | null;
  familyId: number | null;
  familyName: string | null;
  subfamilyId: number | null;
  subfamilyName: string | null;
  genusId: number | null;
  genusName: string | null;
  speciesId: number | null;
  speciesName: string | null;
  discoveryDate: string | null;
  discoveredBy: string | null;
  description: string | null;
  isPublished: boolean;
  sections: DinoContentSection[];
  illustrations: DinoIllustration[];
}

export interface DinosaurUpsert {
  commonName: string;
  scientificName: string;
  slug: string | null;
  kingdomId: number | null;
  phylumId: number | null;
  classId: number | null;
  clades: string | null;
  familyId: number | null;
  subfamilyId: number | null;
  genusId: number | null;
  speciesId: number | null;
  discoveryDate: string | null;
  discoveredBy: string | null;
  description: string | null;
  isPublished: boolean;
  sections: DinoContentSectionUpsert[];
  illustrations: DinoIllustrationUpsert[];
}

export interface DinoContentSection {
  id: number;
  heading: string;
  body: string;
  sortOrder: number;
}

export interface DinoContentSectionUpsert {
  id: number | null;
  heading: string;
  body: string;
  sortOrder: number;
}

export interface DinoIllustration {
  id: number;
  imageUrl: string;
  caption: string | null;
  credit: string | null;
  sortOrder: number;
}

export interface DinoIllustrationUpsert {
  id: number | null;
  imageUrl: string;
  caption: string | null;
  credit: string | null;
  sortOrder: number;
}

export interface PublicDinoClassification {
  rank: string;
  name: string;
}

export interface PublicDinosaurSummary {
  id: number;
  commonName: string;
  scientificName: string;
  slug: string;
  classification: PublicDinoClassification[];
  clades: string[];
  discoveryDate: string | null;
  discoveredBy: string | null;
  description: string | null;
  primaryImageUrl: string | null;
  primaryImageCaption: string | null;
}

export interface PublicDinosaurDetail extends PublicDinosaurSummary {
  sections: DinoContentSection[];
  illustrations: DinoIllustration[];
}

export interface PublicDinoTaxonomyNode {
  id: number;
  rank: string;
  name: string;
  parentId: number | null;
  parentName: string | null;
  description: string | null;
  entryCount: number;
}
