
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RpgService } from '../rpg-service';
import { ProductDetail } from '../models/rpg.models';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-rpg-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './rpg-detail.html',
  styleUrl: './rpg-detail.scss'
})
export class RpgDetail {
  private route = inject(ActivatedRoute);
  private svc = inject(RpgService);
  auth = inject(AuthService);

  vm = toSignal<ProductDetail | null>(
    this.route.paramMap.pipe(
      map(m => Number(m.get('id'))),
      switchMap(id => this.svc.getProduct(id))
    ),
    { initialValue: null }
  );
}
