import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { MapService } from './map.service';
import { tileColors, TileType, tileTypes } from './mapTypes';
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
  public readonly tileTypes = tileTypes;

  public tileKeys(): TileType[] {
    return Object.keys(tileTypes) as TileType[];
  }

  public canUndoTile = computed(() => this.mapService.canUndoTile());
  public canAddTile = computed(() => !this.mapService.candidate().isComplete());
  public canClearTile = computed(() => !this.mapService.candidate().isEmpty());

  public getColor(type: TileType): string {
    return tileColors[type];
  }

  public addTile(type: TileType) {
    this.mapService.addTile(type);
  }

  public fillTile(type: TileType) {
    this.mapService.fillTile(type);
  }

  public undoPlacement() {
    this.mapService.undoPlacement();
  }

  public undoTile() {
    this.mapService.undoTile();
  }

  public clearTile() {
    this.mapService.clearCandidate();
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
