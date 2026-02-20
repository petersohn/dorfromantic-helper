import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MapComponent } from './map.component';
import { MapService } from './map.service';
import { SidebarComponent } from './sidebar.component';
import { DebugService } from './debug.service';

@Component({
  selector: 'app-root',
  standalone: true,
  providers: [MapService, DebugService],
  imports: [MapComponent, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
