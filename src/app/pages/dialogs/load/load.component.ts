import { Component } from '@angular/core';

@Component({
  selector: 'app-load',
  templateUrl: './load.component.html',
  styleUrl: './load.component.scss'
})
export class LoadComponent {
  loadIndicatorVisible = false;

  buttonText = 'Send';

  onClick(data:any) {
    this.buttonText = 'Sending';
    this.loadIndicatorVisible = true;

    setTimeout(() => {
      this.buttonText = 'Send';
      this.loadIndicatorVisible = false;
    }, 2000);
  }
}
