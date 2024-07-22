import { Component } from '@angular/core';
import { DxFileManagerTypes } from 'devextreme-angular/ui/file-manager';
import RemoteFileSystemProvider from 'devextreme/file_management/remote_provider';

@Component({
  selector: 'app-filemanager',
  templateUrl: './filemanager.component.html',
  styleUrl: './filemanager.component.scss'
})
export class FilemanagerComponent {
  remoteProvider: RemoteFileSystemProvider;

  imageItemToDisplay = {} as DxFileManagerTypes.SelectedFileOpenedEvent['file'];

  popupVisible = false;

  constructor() {
    this.remoteProvider = new RemoteFileSystemProvider({
      endpointUrl: 'https://js.devexpress.com/Demos/Mvc/api/file-manager-file-system-images',
    });
  }

  displayImagePopup(e: any) {
    this.imageItemToDisplay = e.file;
    this.popupVisible = true;
  }
}
