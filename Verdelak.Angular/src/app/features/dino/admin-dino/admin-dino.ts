import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CsvDownloadService } from '../../../shared/services/csv-download.service';
import { DinoAdminService } from '../dino-admin.service';
import {
  DinoContentSectionUpsert,
  DinoIllustrationUpsert,
  DinoTaxonomyNode,
  DinoTaxonomyNodeUpsert,
  DinosaurDetail,
  DinosaurSummary,
  DinosaurUpsert,
  PublicDinoTaxonomyNode,
  PublicDinosaurDetail,
  PublicDinosaurSummary
} from '../models/dino.models';

interface DinoForm {
  id: number | null;
  commonName: string;
  scientificName: string;
  slug: string;
  kingdomId: number | null;
  phylumId: number | null;
  classId: number | null;
  clades: string;
  familyId: number | null;
  subfamilyId: number | null;
  genusId: number | null;
  speciesId: number | null;
  discoveryDate: string;
  discoveredBy: string;
  description: string;
  isPublished: boolean;
  sections: DinoContentSectionUpsert[];
  illustrations: DinoIllustrationUpsert[];
}

interface TaxonomyForm {
  id: number | null;
  rank: string;
  name: string;
  parentId: number | null;
  description: string;
  sortOrder: number;
}

interface DinoReadinessCard {
  label: string;
  value: number;
  detail: string;
}

@Component({
  selector: 'app-admin-dino',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dino.html'
})
export class AdminDino implements OnInit {
  readonly ranks = ['Kingdom', 'Phylum', 'Class', 'Clade', 'Family', 'Subfamily', 'Genus', 'Species'];
  readonly dinosaurs = signal<DinosaurSummary[]>([]);
  readonly taxonomy = signal<DinoTaxonomyNode[]>([]);
  readonly publicPreview = signal<PublicDinosaurSummary[]>([]);
  readonly publicTaxonomy = signal<PublicDinoTaxonomyNode[]>([]);
  readonly publicSelected = signal<PublicDinosaurDetail | null>(null);
  readonly selected = signal<DinosaurDetail | null>(null);
  readonly loading = signal(false);
  readonly detailLoading = signal(false);
  readonly taxonomyLoading = signal(false);
  readonly publicPreviewLoading = signal(false);
  readonly publicDetailLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly publicPreviewError = signal<string | null>(null);
  readonly search = signal('');
  readonly publishedFilter = signal<'all' | 'published' | 'draft'>('all');
  readonly readinessFilter = signal<'all' | 'ready' | 'missing-taxonomy' | 'missing-description' | 'missing-sections' | 'missing-illustrations' | 'draft'>('all');
  readonly form = signal<DinoForm>(this.emptyForm());
  readonly taxonomyForm = signal<TaxonomyForm>(this.emptyTaxonomyForm());

  readonly visibleDinosaurs = computed(() => this.dinosaurs().filter(item => this.matchesReadinessFilter(item)));
  readonly publishedCount = computed(() => this.visibleDinosaurs().filter(item => item.isPublished).length);
  readonly draftCount = computed(() => this.visibleDinosaurs().filter(item => !item.isPublished).length);
  readonly readyCount = computed(() => this.visibleDinosaurs().filter(item => this.isReadyForPublicSite(item)).length);
  readonly missingTaxonomyCount = computed(() => this.visibleDinosaurs().filter(item => this.missingTaxonomy(item)).length);
  readonly missingIllustrationCount = computed(() => this.visibleDinosaurs().filter(item => item.illustrationCount === 0).length);
  readonly readinessScopeLabel = computed(() => [
    this.search().trim() ? `Search: ${this.search().trim()}` : 'Any search',
    this.publishedFilter() === 'all' ? 'All statuses' : this.publishedFilter(),
    this.readinessFilter() === 'all' ? 'All readiness' : this.readinessFilter()
  ].join(' / '));
  readonly readinessCards = computed<DinoReadinessCard[]>(() => [
    {
      label: 'Visible entries',
      value: this.visibleDinosaurs().length,
      detail: `${this.dinosaurs().length.toLocaleString()} loaded from current search`
    },
    {
      label: 'Public ready',
      value: this.readyCount(),
      detail: 'Published with taxonomy, description, section, and image'
    },
    {
      label: 'Needs taxonomy',
      value: this.missingTaxonomyCount(),
      detail: 'Missing class/family/genus/species coverage'
    },
    {
      label: 'Needs image',
      value: this.missingIllustrationCount(),
      detail: 'No illustration rows attached yet'
    }
  ]);
  readonly readinessReviewRows = computed(() => this.visibleDinosaurs()
    .map(item => ({
      item,
      warnings: this.readinessWarnings(item)
    }))
    .filter(row => row.warnings.length > 0)
    .slice(0, 10));
  readonly publicPreviewRows = computed(() => this.publicPreview().slice(0, 8));
  readonly publicPreviewCards = computed<DinoReadinessCard[]>(() => [
    {
      label: 'Public entries',
      value: this.publicPreview().length,
      detail: 'Published rows returned by the external feed'
    },
    {
      label: 'Taxonomy buckets',
      value: this.publicTaxonomy().length,
      detail: 'Published taxonomy terms with entry counts'
    },
    {
      label: 'With image',
      value: this.publicPreview().filter(item => !!item.primaryImageUrl).length,
      detail: 'Public rows with a primary illustration'
    },
    {
      label: 'With summary',
      value: this.publicPreview().filter(item => !!item.description).length,
      detail: 'Public rows with description text'
    }
  ]);

  constructor(
    private readonly service: DinoAdminService,
    private readonly csvDownload: CsvDownloadService
  ) {}

  ngOnInit(): void {
    this.loadTaxonomy();
    this.loadDinosaurs();
    this.loadPublicPreview();
  }

  loadDinosaurs(): void {
    this.loading.set(true);
    this.error.set(null);
    const filter = this.publishedFilter() === 'all' ? null : this.publishedFilter() === 'published';
    this.service.listDinosaurs(this.search(), filter).subscribe({
      next: items => this.dinosaurs.set(items),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load dinosaurs.'),
      complete: () => this.loading.set(false)
    });
  }

  loadTaxonomy(): void {
    this.taxonomyLoading.set(true);
    this.service.listTaxonomy().subscribe({
      next: nodes => this.taxonomy.set(nodes),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load taxonomy.'),
      complete: () => this.taxonomyLoading.set(false)
    });
  }

  selectDinosaur(id: number): void {
    this.detailLoading.set(true);
    this.error.set(null);
    this.service.getDinosaur(id).subscribe({
      next: item => {
        this.selected.set(item);
        this.form.set(this.formFromDetail(item));
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load dinosaur.'),
      complete: () => this.detailLoading.set(false)
    });
  }

  startNewDinosaur(): void {
    this.selected.set(null);
    this.form.set(this.emptyForm());
    this.message.set(null);
    this.error.set(null);
  }

  saveDinosaur(): void {
    const form = this.form();
    if (!form.commonName.trim() || !form.scientificName.trim()) {
      this.error.set('Common name and scientific name are required.');
      return;
    }

    const payload = this.toPayload(form);
    const request = form.id
      ? this.service.updateDinosaur(form.id, payload)
      : this.service.createDinosaur(payload);

    this.detailLoading.set(true);
    this.error.set(null);
    this.message.set(null);
    request.subscribe({
      next: saved => {
        this.selected.set(saved);
        this.form.set(this.formFromDetail(saved));
        this.message.set(`${saved.commonName} saved.`);
        this.loadDinosaurs();
        this.loadPublicPreview();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save dinosaur.'),
      complete: () => this.detailLoading.set(false)
    });
  }

  deleteDinosaur(): void {
    const form = this.form();
    if (!form.id || !window.confirm(`Delete ${form.commonName}?`)) {
      return;
    }

    this.detailLoading.set(true);
    this.service.deleteDinosaur(form.id).subscribe({
      next: () => {
        this.message.set(`${form.commonName} deleted.`);
        this.startNewDinosaur();
        this.loadDinosaurs();
        this.loadPublicPreview();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete dinosaur.'),
      complete: () => this.detailLoading.set(false)
    });
  }

  selectTaxonomy(node: DinoTaxonomyNode): void {
    this.taxonomyForm.set({
      id: node.id,
      rank: node.rank,
      name: node.name,
      parentId: node.parentId,
      description: node.description ?? '',
      sortOrder: node.sortOrder
    });
  }

  startNewTaxonomy(rank = 'Clade'): void {
    this.taxonomyForm.set({ ...this.emptyTaxonomyForm(), rank });
  }

  saveTaxonomy(): void {
    const form = this.taxonomyForm();
    if (!form.rank.trim() || !form.name.trim()) {
      this.error.set('Taxonomy rank and name are required.');
      return;
    }

    const payload: DinoTaxonomyNodeUpsert = {
      rank: form.rank,
      name: form.name,
      parentId: form.parentId,
      description: form.description.trim() || null,
      sortOrder: Number(form.sortOrder) || 0
    };
    const request = form.id
      ? this.service.updateTaxonomy(form.id, payload)
      : this.service.createTaxonomy(payload);

    this.taxonomyLoading.set(true);
    this.error.set(null);
    this.message.set(null);
    request.subscribe({
      next: node => {
        this.message.set(`${node.name} saved.`);
        this.taxonomyForm.set(this.emptyTaxonomyForm());
        this.loadTaxonomy();
        this.loadPublicPreview();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save taxonomy.'),
      complete: () => this.taxonomyLoading.set(false)
    });
  }

  deleteTaxonomy(): void {
    const form = this.taxonomyForm();
    if (!form.id || !window.confirm(`Delete ${form.name}?`)) {
      return;
    }

    this.taxonomyLoading.set(true);
    this.service.deleteTaxonomy(form.id).subscribe({
      next: () => {
        this.message.set(`${form.name} deleted.`);
        this.taxonomyForm.set(this.emptyTaxonomyForm());
        this.loadTaxonomy();
        this.loadPublicPreview();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete taxonomy item.'),
      complete: () => this.taxonomyLoading.set(false)
    });
  }

  taxonomyByRank(rank: string): DinoTaxonomyNode[] {
    return this.taxonomy()
      .filter(node => node.rank === rank)
      .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
  }

  loadPublicPreview(): void {
    this.publicPreviewLoading.set(true);
    this.publicPreviewError.set(null);
    forkJoin({
      dinosaurs: this.service.listPublicDinosaurs('', '', 200),
      taxonomy: this.service.listPublicTaxonomy()
    }).subscribe({
      next: result => {
        this.publicPreview.set(result.dinosaurs);
        this.publicTaxonomy.set(result.taxonomy);
        const selected = this.publicSelected();
        if (selected && !result.dinosaurs.some(item => item.id === selected.id)) {
          this.publicSelected.set(null);
        }
      },
      error: err => this.publicPreviewError.set(err.error ?? err.message ?? 'Failed to load public Dino preview.'),
      complete: () => this.publicPreviewLoading.set(false)
    });
  }

  previewPublicDinosaur(item: PublicDinosaurSummary): void {
    this.publicDetailLoading.set(true);
    this.publicPreviewError.set(null);
    this.service.getPublicDinosaur(item.slug || item.id).subscribe({
      next: detail => this.publicSelected.set(detail),
      error: err => this.publicPreviewError.set(err.error ?? err.message ?? 'Failed to load public Dino payload.'),
      complete: () => this.publicDetailLoading.set(false)
    });
  }

  publicClassificationLabel(item: PublicDinosaurSummary | PublicDinosaurDetail): string {
    return item.classification.map(row => `${row.rank}: ${row.name}`).join(' / ') || 'Classification not set';
  }

  exportPublicPreviewJson(): void {
    this.downloadText(
      `dino-public-preview-${this.fileSlug(`${this.publicPreview().length} entries`)}.json`,
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        dinosaurs: this.publicPreview(),
        taxonomy: this.publicTaxonomy()
      }, null, 2),
      'application/json;charset=utf-8;'
    );
  }

  setReadinessFilter(filter: 'all' | 'ready' | 'missing-taxonomy' | 'missing-description' | 'missing-sections' | 'missing-illustrations' | 'draft'): void {
    this.readinessFilter.set(filter);
  }

  classificationLabel(item: DinosaurSummary): string {
    return [
      item.kingdomName,
      item.phylumName,
      item.className,
      item.clades,
      item.familyName,
      item.subfamilyName,
      item.genusName,
      item.speciesName
    ].filter(Boolean).join(' / ') || 'Classification not set';
  }

  readinessWarnings(item: DinosaurSummary): string[] {
    const warnings: string[] = [];
    if (!item.isPublished) {
      warnings.push('Draft');
    }
    if (this.missingTaxonomy(item)) {
      warnings.push('Taxonomy');
    }
    if (!item.hasDescription) {
      warnings.push('Description');
    }
    if (item.sectionCount === 0) {
      warnings.push('Text section');
    }
    if (item.illustrationCount === 0) {
      warnings.push('Illustration');
    }
    if (!item.discoveryDate && !item.discoveredBy) {
      warnings.push('Discovery note');
    }
    return warnings;
  }

  readinessLabel(item: DinosaurSummary): string {
    return this.isReadyForPublicSite(item) ? 'Ready' : 'Needs content';
  }

  readinessTone(item: DinosaurSummary): string {
    return this.isReadyForPublicSite(item)
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-amber-100 text-amber-800';
  }

  exportReadinessCsv(): void {
    this.downloadCsv(`dino-content-readiness-${this.fileSlug(this.readinessScopeLabel())}.csv`, [
      ['Readiness Scope', this.readinessScopeLabel(), '', '', '', '', '', '', '', '', ''],
      ['Exported At', new Date().toLocaleString(), '', '', '', '', '', '', '', '', ''],
      [],
      ['Common Name', 'Scientific Name', 'Slug', 'Published', 'Classification', 'Discovery Date', 'Discovered By', 'Description', 'Sections', 'Illustrations', 'Warnings'],
      ...this.visibleDinosaurs().map(item => [
        item.commonName,
        item.scientificName,
        item.slug,
        item.isPublished,
        this.classificationLabel(item),
        item.discoveryDate,
        item.discoveredBy,
        item.hasDescription,
        item.sectionCount,
        item.illustrationCount,
        this.readinessWarnings(item).join('|')
      ])
    ]);
  }

  setFormField<K extends keyof DinoForm>(field: K, value: DinoForm[K]): void {
    this.form.set({ ...this.form(), [field]: value });
  }

  setTaxonomyField<K extends keyof TaxonomyForm>(field: K, value: TaxonomyForm[K]): void {
    this.taxonomyForm.set({ ...this.taxonomyForm(), [field]: value });
  }

  setSectionField(index: number, field: keyof DinoContentSectionUpsert, value: string | number | null): void {
    const sections = this.form().sections.map((section, currentIndex) =>
      currentIndex === index ? { ...section, [field]: value } : section);
    this.form.set({ ...this.form(), sections });
  }

  addSection(): void {
    const sections = this.form().sections;
    this.form.set({
      ...this.form(),
      sections: [...sections, { id: null, heading: '', body: '', sortOrder: sections.length * 10 + 10 }]
    });
  }

  removeSection(index: number): void {
    this.form.set({
      ...this.form(),
      sections: this.form().sections.filter((_, currentIndex) => currentIndex !== index)
    });
  }

  setIllustrationField(index: number, field: keyof DinoIllustrationUpsert, value: string | number | null): void {
    const illustrations = this.form().illustrations.map((illustration, currentIndex) =>
      currentIndex === index ? { ...illustration, [field]: value } : illustration);
    this.form.set({ ...this.form(), illustrations });
  }

  addIllustration(): void {
    const illustrations = this.form().illustrations;
    this.form.set({
      ...this.form(),
      illustrations: [...illustrations, { id: null, imageUrl: '', caption: '', credit: '', sortOrder: illustrations.length * 10 + 10 }]
    });
  }

  removeIllustration(index: number): void {
    this.form.set({
      ...this.form(),
      illustrations: this.form().illustrations.filter((_, currentIndex) => currentIndex !== index)
    });
  }

  private formFromDetail(item: DinosaurDetail): DinoForm {
    return {
      id: item.id,
      commonName: item.commonName,
      scientificName: item.scientificName,
      slug: item.slug,
      kingdomId: item.kingdomId,
      phylumId: item.phylumId,
      classId: item.classId,
      clades: item.clades ?? '',
      familyId: item.familyId,
      subfamilyId: item.subfamilyId,
      genusId: item.genusId,
      speciesId: item.speciesId,
      discoveryDate: item.discoveryDate ?? '',
      discoveredBy: item.discoveredBy ?? '',
      description: item.description ?? '',
      isPublished: item.isPublished,
      sections: item.sections.map(section => ({ ...section })),
      illustrations: item.illustrations.map(illustration => ({ ...illustration }))
    };
  }

  private toPayload(form: DinoForm): DinosaurUpsert {
    return {
      commonName: form.commonName.trim(),
      scientificName: form.scientificName.trim(),
      slug: form.slug.trim() || null,
      kingdomId: form.kingdomId,
      phylumId: form.phylumId,
      classId: form.classId,
      clades: form.clades.trim() || null,
      familyId: form.familyId,
      subfamilyId: form.subfamilyId,
      genusId: form.genusId,
      speciesId: form.speciesId,
      discoveryDate: form.discoveryDate.trim() || null,
      discoveredBy: form.discoveredBy.trim() || null,
      description: form.description.trim() || null,
      isPublished: form.isPublished,
      sections: form.sections,
      illustrations: form.illustrations
    };
  }

  private emptyForm(): DinoForm {
    return {
      id: null,
      commonName: '',
      scientificName: '',
      slug: '',
      kingdomId: null,
      phylumId: null,
      classId: null,
      clades: '',
      familyId: null,
      subfamilyId: null,
      genusId: null,
      speciesId: null,
      discoveryDate: '',
      discoveredBy: '',
      description: '',
      isPublished: false,
      sections: [],
      illustrations: []
    };
  }

  private emptyTaxonomyForm(): TaxonomyForm {
    return {
      id: null,
      rank: 'Clade',
      name: '',
      parentId: null,
      description: '',
      sortOrder: 0
    };
  }

  private matchesReadinessFilter(item: DinosaurSummary): boolean {
    const filter = this.readinessFilter();
    return filter === 'all'
      || (filter === 'ready' && this.isReadyForPublicSite(item))
      || (filter === 'missing-taxonomy' && this.missingTaxonomy(item))
      || (filter === 'missing-description' && !item.hasDescription)
      || (filter === 'missing-sections' && item.sectionCount === 0)
      || (filter === 'missing-illustrations' && item.illustrationCount === 0)
      || (filter === 'draft' && !item.isPublished);
  }

  private isReadyForPublicSite(item: DinosaurSummary): boolean {
    return item.isPublished
      && !this.missingTaxonomy(item)
      && item.hasDescription
      && item.sectionCount > 0
      && item.illustrationCount > 0;
  }

  private missingTaxonomy(item: DinosaurSummary): boolean {
    return !item.className || !item.familyName || !item.genusName || !item.speciesName;
  }

  private downloadCsv(fileName: string, rows: (string | number | boolean | null | undefined)[][]): void {
    this.csvDownload.download(fileName, rows);
  }

  private downloadText(fileName: string, content: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private fileSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'all-dino';
  }
}
