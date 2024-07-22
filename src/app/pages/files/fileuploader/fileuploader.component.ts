import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-fileuploader',
  templateUrl: './fileuploader.component.html',
  styleUrl: './fileuploader.component.scss'
})
export class FileuploaderComponent {
  @ViewChild('form') form!: NgForm;

  updateClick() {
    alert('Uncomment the line to enable sending a form to the server.');
    // form.submit();
  }
}
