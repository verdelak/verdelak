import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RpgService } from '../rpg-service';
import { IdName, ProductDetail } from '../models/rpg.models';

@Component({
  selector: 'app-rpg-edit',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './rpg-edit.html',
  styleUrl: './rpg-edit.scss'
})
export class RpgEdit implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(RpgService);

  systems: IdName[] = [];
  series: IdName[] = [];
  types: IdName[] = [];

  isEdit = false;
  id?: number;

  form = this.fb.nonNullable.group({
    productName: ['', Validators.required],   // string (not string|null)
    description: [''],
    productNum: [''],
    productTypeID: [null as number | null],   // IDs can stay nullable
    systemID:     [null as number | null],
    seriesID:     [null as number | null],
    status: [''],
    isbn: [''],
    edition: [''],
  });

  ngOnInit() {
    this.svc.getSystems().subscribe(x => this.systems = x);
    this.svc.getSeries().subscribe(x => this.series = x);
    this.svc.getTypes().subscribe(x => this.types = x);

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.id = +idParam;
      this.svc.getProduct(this.id!).subscribe(p => this.form.patchValue(p));
    } else {
      this.form.patchValue({
        systemID: this.numberQueryParam('systemId'),
        seriesID: this.numberQueryParam('seriesId'),
        productTypeID: this.numberQueryParam('typeId'),
        status: 'H'
      });
    }
  }

  nullsToUndefined<T extends Record<string, any>>(o: T) {
    const entries = Object.entries(o).map(([k, v]) => [k, v === null ? undefined : v]);
    return Object.fromEntries(entries) as { [K in keyof T]: Exclude<T[K], null> | undefined };
  }

  async save() {
    const payload = this.nullsToUndefined(this.form.value) as Partial<ProductDetail>;
    if (this.isEdit && this.id) {
      await this.svc.updateProduct(this.id, payload).toPromise();
    } else {
      await this.svc.createProduct(payload).toPromise();
    }
    this.router.navigate(['/rpg']);
  }

  async delete() {
    if (!this.isEdit || !this.id || !confirm('Delete this RPG product?')) {
      return;
    }

    await this.svc.deleteProduct(this.id).toPromise();
    this.router.navigate(['/rpg']);
  }


  cancel() { this.router.navigate(['/rpg']); }

  private numberQueryParam(name: string): number | null {
    const value = this.route.snapshot.queryParamMap.get(name);
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
}
