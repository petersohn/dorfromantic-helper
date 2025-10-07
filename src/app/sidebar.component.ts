import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MapService } from './map.service';
import { Tile, tileColors, TileType } from './mapTypes';
import { NgStyle } from '@angular/common';
import { CandidateDisplayComponent } from './candidateDisplay.component';

@Component({
  selector: 'sidebar',
  standalone: true,
  imports: [NgStyle, CandidateDisplayComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly mapService = inject(MapService);
  public readonly tileTypes: {
    [key in TileType]: { normal: boolean; fill: boolean };
  } = {
    Unknown: { normal: false, fill: false },
    Grassland: { normal: true, fill: true },
    Forest: { normal: true, fill: true },
    Field: { normal: true, fill: true },
    Town: { normal: true, fill: true },
    River: { normal: true, fill: true },
    Lake: { normal: true, fill: true },
    Railway: { normal: true, fill: true },
    WaterStation: { normal: false, fill: true },
  };

  public tileKeys(): TileType[] {
    return Object.keys(this.tileTypes) as TileType[];
  }

  public getColor(type: TileType): string {
    return tileColors[type];
  }

  public addTile(type: TileType) {
    this.mapService.candidate.update((c) => {
      const result = this.tileTypes[c.getItem(0)].normal ? c : new Tile();
      return result.add(type, this.mapService.addPosition());
    });
    this.mapService.addPosition.update((p) => (p + 1) % 6);
  }

  public fillTile(type: TileType) {
    this.mapService.candidate.set(Tile.singleTile(type));
    this.mapService.addPosition.set(0);
  }
}
