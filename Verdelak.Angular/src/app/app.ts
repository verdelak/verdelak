import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainMenu } from './shared/components/main-menu/main-menu';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MainMenu],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'Verdelak';
}
