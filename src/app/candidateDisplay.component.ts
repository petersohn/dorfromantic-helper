import {
  Component,
  ElementRef,
  inject,
  viewChild,
  effect,
  HostListener,
  ChangeDetectionStrategy,
  model,
} from '@angular/core';
import { Coordinate, Tile } from './mapTypes';
import { drawTile, hexagonEdgeMidpoints } from './drawHelper';
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
  public addPosition = model.required<number>();
  private readonly points = hexagonEdgeMidpoints().map((c) => c.mul(100));

  constructor() {
    effect(() => this.render());
  }

  @HostListener('wheel', ['$event'])
  public onMouseWheel(event: WheelEvent) {
    const amount = event.deltaY > 0 ? 1 : -1;
    this.mapService.candidate.update((c) => c.rotate(amount));
    this.addPosition.update((x) => (x + amount) % this.points.length);
  }

  private render() {
    this.doRender(
      this.canvas().nativeElement,
      this.mapService.candidate(),
      this.addPosition(),
    );
  }

  private doRender(
    canvas: HTMLCanvasElement,
    candidate: Tile,
    addPosition: number,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawTile(ctx, candidate, new Coordinate(125, 125), 80);
    const coord = Coordinate.fromCanvasSize(canvas)
      .div(2)
      .add(this.points[addPosition % this.points.length]);

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(coord.x, coord.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}
