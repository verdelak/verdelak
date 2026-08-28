import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainMenu } from './shared/components/main-menu/main-menu';
import { MainAppearanceService } from './shared/services/main-appearance.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MainMenu],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected title = 'Verdelak';

  constructor(private readonly appearance: MainAppearanceService) {}

  ngOnInit(): void {
    this.appearance.load();
  }
}
