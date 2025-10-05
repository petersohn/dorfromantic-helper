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
import { DisplayPosition } from './displayPosition';

@Component({
  selector: 'mapuu',
  standalone: true,
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements AfterViewInit {
  private parent = inject(ElementRef<HTMLElement>);
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  public displayPosition = model.required<DisplayPosition>();
  public tiles = input.required<Tile[]>();
  public edges = input.required<Edge[]>();

  private panOrigin: Coordinate | null = null;

  constructor() {
    effect(() => this.render());
  }

  @HostListener('window:resize', [])
  public onResize() {
    this.render();
  }

  @HostListener('mousedown', ['$event'])
  public onMouseDown(event: MouseEvent) {
    this.panOrigin = Coordinate.fromMouseEvent(event);
  }

  @HostListener('mouseup', [])
  public onMouseUp() {
    this.panOrigin = null;
  }

  @HostListener('mouseout', [])
  public onMouseOut() {
    this.panOrigin = null;
  }

  @HostListener('mousemove', ['$event'])
  public onMouseMove(event: MouseEvent) {
    if (!this.panOrigin) {
      return;
    }

    const mousePosition = Coordinate.fromMouseEvent(event);
    this.displayPosition.update((dp) => dp.pan(this.panOrigin!, mousePosition));
    this.panOrigin = mousePosition;
  }

  @HostListener('wheel', ['$event'])
  public onMouseWheel(event: WheelEvent) {
    const mousePosition = Coordinate.fromMouseEvent(event);
    this.displayPosition.update((dp) =>
      dp.modifyZoom(
        mousePosition,
        this.getSize(),
        Math.min(2.0, Math.max(0.5, 1.0 - 0.002 * event.deltaY)),
      ),
    );
    event.preventDefault();
  }

  public ngAfterViewInit(): void {}

  private render() {
    this.doRender(
      this.canvas().nativeElement,
      this.displayPosition(),
      this.tiles(),
      this.edges(),
    );
  }

  private getSize(): Coordinate {
    return Coordinate.fromElementSize(this.parent.nativeElement);
  }

  private doRender(
    canvas: HTMLCanvasElement,
    displayPosition: DisplayPosition,
    tiles: Tile[],
    edges: Edge[],
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('not yet');
      return;
    }

    const size = this.getSize();

    canvas.width = size.x;
    canvas.height = size.y;
    ctx.clearRect(0, 0, size.x, size.y);

    for (const tile of tiles) {
      const center = calculateCenter(size, displayPosition, tile.coordinate);
      if (shouldDraw(size, center, displayPosition.zoom)) {
        drawTile(ctx, tile, center, displayPosition.zoom);
      }
    }

    for (const edge of edges) {
      const center = calculateCenter(size, displayPosition, edge.coordinate);
      if (shouldDraw(size, center, displayPosition.zoom)) {
        drawEdge(ctx, edge, center, displayPosition.zoom);
      }
    }
  }
}
