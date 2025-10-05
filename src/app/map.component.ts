import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  input,
  viewChild,
  effect,
  model,
  HostListener,
} from '@angular/core';
import { Coordinate, Edge, Tile } from './mapTypes';
import { calculateCenter, drawEdge, drawTile, shouldDraw } from './drawHelper';

@Component({
  selector: 'mapuu',
  standalone: true,
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements AfterViewInit {
  private parent = inject(ElementRef<HTMLElement>);
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  public offset = model.required<Coordinate>();
  public zoom = model.required<number>();
  public tiles = input.required<Tile[]>();
  public edges = input.required<Edge[]>();

  constructor() {
    effect(() => this.render());
  }

  @HostListener('window:resize', [])
  public onResize() {
    this.render();
  }

  public ngAfterViewInit(): void {}

  private render() {
    this.doRender(
      this.canvas().nativeElement,
      this.offset(),
      this.zoom(),
      this.tiles(),
      this.edges(),
    );
  }

  private doRender(
    canvas: HTMLCanvasElement,
    offset: Coordinate,
    zoom: number,
    tiles: Tile[],
    edges: Edge[],
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('not yet');
      return;
    }

    const width = this.parent.nativeElement.clientWidth;
    const height = this.parent.nativeElement.clientHeight;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    for (const tile of tiles) {
      const center = calculateCenter(
        width,
        height,
        offset,
        tile.coordinate,
        zoom,
      );
      if (shouldDraw(width, height, center, zoom)) {
        drawTile(ctx, tile, center, zoom);
      }
    }

    for (const edge of edges) {
      const center = calculateCenter(
        width,
        height,
        offset,
        edge.coordinate,
        zoom,
      );
      if (shouldDraw(width, height, center, zoom)) {
        drawEdge(ctx, edge, center, zoom);
      }
    }
  }
}
