import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  viewChild,
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
  private readonly downloader =
    viewChild<ElementRef<HTMLAnchorElement>>('downloader');
  private readonly uploader =
    viewChild<ElementRef<HTMLInputElement>>('uploader');
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
    this.mapService.candidate.update((c) =>
      !this.tileTypes[type].normal || c.isComplete()
        ? Tile.singleTile(type)
        : c.fillUnknown(type),
    );
    this.mapService.addPosition.set(0);
  }

  public undo() {
    this.mapService.undo();
  }

  public resetGame() {
    if (confirm('Really reset the game?')) {
      this.mapService.reset();
    }
  }

  public export() {
    const data = this.mapService.serializeGame();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const element = this.downloader()!.nativeElement;
    if (element.href) {
      URL.revokeObjectURL(element.href);
    }
    element.href = url;
    element.click();
  }

  public import() {
    this.uploader()!.nativeElement.click();
  }

  public uploaded() {
    const files = this.uploader()!.nativeElement.files;
    if (!files || files.length === 0) {
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', (event: ProgressEvent) => {
      if (event.target) {
        const data = (event.target as FileReader).result as string;
        this.mapService.deserializeGame(data);
      }
    });
    reader.readAsText(files[0]);
  }
}
