import { Component } from '@angular/core';
import { EditorService } from '../editor.service';
import ODataStore from 'devextreme/data/odata/store';
import CustomStore from 'devextreme/data/custom_store';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrl: './autocomplete.component.scss',
  providers: [EditorService]
})
export class AutocompleteComponent {
  names: string[];

  surnames: string[];

  positions: string[];

  states: ODataStore;

  clientsStore: CustomStore;

  firstName = '';

  lastName = '';

  position: string;

  state = '';

  currentClient = '';

  fullInfo = '';

  constructor(httpClient: HttpClient, service: EditorService) {
    this.clientsStore = new CustomStore({
      key: 'Value',
      useDefaultSearch: true,
      async load(loadOptions: any) {
        let params: HttpParams = new HttpParams();
        [
          'skip',
          'take',
          'filter',
        ].forEach((option) => {
          if (option in loadOptions && isNotEmpty(loadOptions[option])) {
            params = params.set(option, JSON.stringify(loadOptions[option]));
          }
        });
        return lastValueFrom(httpClient.get('https://js.devexpress.com/Demos/Mvc/api/DataGridWebApi/CustomersLookup', { params }))
          .then((data:any) => ({
            data,
          }))
          .catch((error) => { throw 'Data Loading Error'; });
      },
    });
    this.states = new ODataStore({
      version: 2,
      url: 'https://js.devexpress.com/Demos/DevAV/odata/States?$select=Sate_ID,State_Long,State_Short',
      key: 'Sate_ID',
      keyType: 'Int32',
    });
    this.names = service.getNames();
    this.surnames = service.getSurnames();
    this.positions = service.getPositions();
    this.position = this.positions[0];
  }

  updateEmployeeInfo(event: any) {
    let result = '';
    result += (`${this.firstName || ''} ${this.lastName || ''}`).trim();
    result += (result && this.position) ? (`, ${this.position}`) : this.position || '';
    result += (result && this.state) ? (`, ${this.state}`) : this.state || '';
    result += (result && this.currentClient) ? (`, ${this.currentClient}`) : this.currentClient || '';
    this.fullInfo = result;
  }

}


function isNotEmpty(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}


  