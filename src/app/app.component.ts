import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Coordinate, Edge, Tile } from './mapTypes';
import { MapComponent } from './map.component';
import { DisplayPosition } from './displayPosition';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MapComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  public displayPosition = new DisplayPosition(new Coordinate(0, 0), 100);
  public tiles = signal<Tile[]>([
    {
      coordinate: new Coordinate(0, 0),
      items: ['Grassland', 'Forest', 'Field', 'River', 'Town', 'Lake'],
    },
    {
      coordinate: new Coordinate(1, 0),
      items: ['Forest', 'Forest', 'Forest', 'Forest', 'Forest', 'Forest'],
    },
    {
      coordinate: new Coordinate(-1, 0),
      items: ['Town', 'Town', 'Town', 'Town', 'Town', 'Town'],
    },
    {
      coordinate: new Coordinate(0, -1),
      items: ['Lake', 'Lake', 'Lake', 'Lake', 'Lake', 'Lake'],
    },
    {
      coordinate: new Coordinate(0, 1),
      items: ['River', 'River', 'River', 'River', 'River', 'River'],
    },
    {
      coordinate: new Coordinate(-1, 0),
      items: ['Field', 'Field', 'Field', 'Field', 'Field', 'Field'],
    },
  ]);
  public edges = signal<Edge[]>([
    {
      coordinate: new Coordinate(1, 1),
      good: 3,
      all: 3,
    },
  ]);
}
