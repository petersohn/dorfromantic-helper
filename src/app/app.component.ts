import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Coordinate, Edge, Tile } from './mapTypes';
import { MapComponent } from './map.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MapComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  public offset = signal(new Coordinate(0, 0));
  public zoom = signal(100);
  public tiles = signal<Tile[]>([
    {
      coordinate: new Coordinate(0, 0),
      items: ['Grassland', 'Forest', 'Field', 'River', 'Town', 'Lake'],
    },
  ]);
  public edges = signal<Edge[]>([]);
}
