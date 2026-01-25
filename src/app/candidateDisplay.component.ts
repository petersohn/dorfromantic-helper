import {
  Component,
  ElementRef,
  inject,
  viewChild,
  effect,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { PhysicalCoordinate, Tile } from './mapTypes';
import { drawTile } from './drawHelper';
import { MapService } from './map.service';

@Component({
  selector: 'candidate-display',
  standalone: true,
  templateUrl: './candidateDisplay.component.html',
  styleUrl: './candidateDisplay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidateDisplayComponent {
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private mapService = inject(MapService);

  constructor() {
    effect(() => this.render());
  }

  @HostListener('wheel', ['$event'])
  public onMouseWheel(event: WheelEvent) {
    if (this.mapService.candidate().isComplete()) {
      this.mapService.rotateCandidate(event.deltaY);
    }
  }

  private render() {
    this.doRender(this.canvas().nativeElement, this.mapService.candidate());
  }

  private doRender(canvas: HTMLCanvasElement, candidate: Tile) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawTile(ctx, candidate, new PhysicalCoordinate(125, 125), 80);
  }
}
