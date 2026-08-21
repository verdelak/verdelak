import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environments';
import { ExternalSitesSettings } from '../../features/admin-settings/admin-settings.service';

@Injectable({ providedIn: 'root' })
export class ExternalSitesService {
  private readonly http = inject(HttpClient);
  private readonly settingsUrl = `${environment.apiUrl}/admin/settings/external-sites`;

  getSettings() {
    return this.http.get<ExternalSitesSettings>(this.settingsUrl);
  }

  getResolvedSites() {
    return this.getSettings().pipe(
      map(settings => {
        const useProduction = environment.production || settings.environmentName === 'production';
        return settings.sites
          .filter(site => site.isActive)
          .map(site => ({
            ...site,
            resolvedUrl: useProduction ? site.productionUrl || site.localUrl : site.localUrl || site.productionUrl
          }))
          .filter(site => !!site.resolvedUrl);
      })
    );
  }
}
