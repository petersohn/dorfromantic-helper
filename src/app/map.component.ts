import {
  Component,
  ElementRef,
  inject,
  viewChild,
  effect,
  HostListener,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import {
  PhysicalCoordinate,
  LogicalCoordinate,
  Edge,
  LogicalItem,
  PhysicalItem,
  Tile,
} from './mapTypes';
import {
  drawEdge,
  drawTile,
  shouldDraw,
  logical2Screen,
  screen2Logical,
  drawMark,
} from './drawHelper';
import { DisplayPosition } from './displayPosition';
import { MapService } from './map.service';
import { DebugService } from './debug.service';

@Component({
  selector: 'mapuu',
  standalone: true,
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnInit {
  private parent = inject(ElementRef<HTMLElement>);
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private mapService = inject(MapService);
  private debugService = inject(DebugService);
  private candidateShowPosition = signal<LogicalCoordinate | null>(null);

  private candidateShow = computed<LogicalItem<Tile> | null>(() => {
    const p = this.candidateShowPosition();
    const c = this.mapService.candidate();
    return p && c.isComplete()
      ? {
          coordinate: p,
          item: c,
        }
      : null;
  });

  private panOrigin: PhysicalCoordinate | null = null;
  private mouseDownPosition: PhysicalCoordinate | null = null;

  constructor() {
    effect(() => this.render());
  }

  ngOnInit(): void {
    this.mapService.setWindowSize(this.getSize());
    this.mapService.init();
  }

  @HostListener('window:resize', [])
  public onResize() {
    this.mapService.setWindowSize(this.getSize());
    this.render();
  }

  @HostListener('mousedown', ['$event'])
  public onMouseDown(event: MouseEvent) {
    this.mouseDownPosition = PhysicalCoordinate.fromMouseEvent(
      this.parent.nativeElement,
      event,
    );
    this.panOrigin = this.mouseDownPosition;
  }

  @HostListener('mouseup', ['$event'])
  public onMouseUp(event: MouseEvent) {
    if (this.panOrigin === null) {
      return;
    }

    this.panOrigin = null;
    const mouseUpPosition = PhysicalCoordinate.fromMouseEvent(
      this.parent.nativeElement,
      event,
    );

    if (this.mouseDownPosition !== null) {
      const diff = mouseUpPosition.sub(this.mouseDownPosition);
      this.mouseDownPosition = null;
      const distance = Math.max(Math.abs(diff.x), Math.abs(diff.y));
      if (distance > 2) {
        return;
      }
    }

    const mousePosition = PhysicalCoordinate.fromMouseEvent(
      this.parent.nativeElement,
      event,
    );
    const coord = screen2Logical(
      this.mapService.displayPosition().physical2Screen(mousePosition),
    );

    if (event.button === 1) {
      if (this.mapService.hasMark(coord)) {
        this.mapService.removeMark(coord);
      } else {
        this.mapService.addMark(coord);
      }
    } else if (event.shiftKey) {
      this.mapService.removeTile(coord);
    } else {
      if (this.mapService.canAddCandidate(coord, !event.ctrlKey)) {
        this.mapService.addCandidate(coord);
      }
    }
  }

  @HostListener('mouseout', [])
  public onMouseOut() {
    this.mouseDownPosition = null;
    this.panOrigin = null;
    this.candidateShowPosition.set(null);
  }

  @HostListener('mousemove', ['$event'])
  public onMouseMove(event: MouseEvent) {
    const mousePosition = PhysicalCoordinate.fromMouseEvent(
      this.parent.nativeElement,
      event,
    );

    if (this.panOrigin === null) {
      const logical = screen2Logical(
        this.mapService.displayPosition().physical2Screen(mousePosition),
      );
      this.candidateShowPosition.set(
        !this.mapService.getTile(logical) ? logical : null,
      );
      return;
    }

    this.mapService.displayPosition.update((dp) =>
      dp.pan(this.panOrigin!, mousePosition),
    );
    this.panOrigin = mousePosition;
  }

  @HostListener('wheel', ['$event'])
  public onMouseWheel(event: WheelEvent) {
    if (!!this.candidateShow() && !event.ctrlKey) {
      this.mapService.rotateCandidate(event.deltaY);
      return;
    }

    const mousePosition = PhysicalCoordinate.fromMouseEvent(
      this.parent.nativeElement,
      event,
    );
    this.mapService.displayPosition.update((dp) =>
      dp.modifyZoomLevel(mousePosition, event.deltaY > 0 ? -1 : 1),
    );
    event.preventDefault();
  }

  private render() {
    this.doRender(
      this.canvas().nativeElement,
      this.mapService.displayPosition(),
      this.mapService.tiles(),
      this.mapService.edges(),
      this.mapService.marks(),
      this.candidateShow(),
      this.mapService.candidate().isComplete(),
    );
  }

  private getSize(): PhysicalCoordinate {
    return PhysicalCoordinate.fromElementSize(this.parent.nativeElement);
  }

  private doRender(
    canvas: HTMLCanvasElement,
    displayPosition: DisplayPosition,
    tiles: LogicalItem<Tile>[],
    edges: LogicalItem<Edge>[],
    marks: LogicalCoordinate[],
    candidateShow: LogicalItem<Tile> | null,
    isCandidateComplete: boolean,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('not yet');
      return;
    }

    const size = this.getSize();

    canvas.width = size.x;
    canvas.height = size.y;
    ctx.fillStyle = isCandidateComplete ? '#fff' : '#ccc';
    ctx.fillRect(0, 0, size.x, size.y);

    for (const mark of marks) {
      const center = displayPosition.screen2Physical(logical2Screen(mark));
      if (shouldDraw(size, center, displayPosition.zoom())) {
        drawMark(ctx, center, displayPosition.zoom());
      }
    }

    for (const tile of tiles) {
      const center = displayPosition.screen2Physical(
        logical2Screen(tile.coordinate),
      );
      if (shouldDraw(size, center, displayPosition.zoom())) {
        drawTile(ctx, tile.item, center, displayPosition.zoom());
      }
    }

    const edgesToDraw = edges
      .map((e) => ({
        hasMark: this.mapService.hasMark(e.coordinate),
        coordinate: displayPosition.screen2Physical(
          logical2Screen(e.coordinate),
        ),
        item: e.item,
      }))
      .filter((e) => shouldDraw(size, e.coordinate, displayPosition.zoom()));

    const goodness = (e: PhysicalItem<Edge> & { hasMark: boolean }) =>
      (!e.item.isGood() ? 0 : e.item.good) + (e.hasMark ? 6 : 0);
    edgesToDraw.sort((a, b) => goodness(a) - goodness(b));

    for (const edge of edgesToDraw) {
      drawEdge(
        ctx,
        edge.item,
        edge.coordinate,
        displayPosition.zoom(),
        edge.hasMark,
      );
    }

    if (candidateShow) {
      const center = displayPosition.screen2Physical(
        logical2Screen(candidateShow.coordinate),
      );

      ctx.globalAlpha = 0.7;
      drawTile(ctx, candidateShow.item, center, displayPosition.zoom());
      ctx.globalAlpha = 1.0;
    }

    if (this.debugService.showDebug()) {
      const trace = this.debugService.summaryTrace();
      if (trace.length > 0) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const coord = displayPosition.screen2Physical(logical2Screen(trace[0]));
        ctx.moveTo(coord.x, coord.y);
        for (let i = 1; i < trace.length; ++i) {
          const coord = displayPosition.screen2Physical(
            logical2Screen(trace[i]),
          );
          ctx.lineTo(coord.x, coord.y);
        }
        ctx.stroke();

        const index = this.debugService.summaryTraceIndex();
        console.log(index, trace.length);
        if (index < trace.length) {
          ctx.fillStyle = 'red';
          ctx.beginPath();
          const coord = displayPosition.screen2Physical(
            logical2Screen(trace[index]),
          );
          ctx.arc(coord.x, coord.y, 5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
  }
}
