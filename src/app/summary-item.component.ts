import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { drawEdge, logical2Screen } from './drawHelper';
import { Coordinate, Edge } from './mapTypes';
import { CommonModule } from '@angular/common';
import { MapService } from './map.service';
import { DisplayPosition } from './displayPosition';

@Component({
  selector: 'summary-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-item.component.html',
  styleUrl: './summary-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryItemComponent {
  private readonly canvas =
    viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly mapService = inject(MapService);

  public edgeCount = input.required<number>();
  public edges = input.required<Coordinate[]>();
  public count = computed(() => this.edges().length);
  public markCount = input.required<number>();

  private jumpList: Coordinate[] | null = null;
  private jumpIndex = 0;
  private edgesToSort: Coordinate[] = [];

  constructor() {
    effect(() => this.render());
    effect(() => {
      this.edgesToSort = this.edges();
      this.jumpList = null;
    });
  }

  private render() {
    const canvas = this.canvas().nativeElement;
    const edgeCount = this.edgeCount();
    const count = this.count();

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('not yet');
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawEdge(
      ctx,
      new Edge(edgeCount, count == 0 ? 0 : edgeCount),
      new Coordinate(canvas.width / 2, canvas.height / 2),
      canvas.width / 2,
      false,
      false,
    );
  }

  public onClick() {
    const edges = this.calculateJumpList();
    if (edges.length === 0) {
      return;
    }

    const coord = edges[this.jumpIndex];
    this.mapService.displayPosition.update((dp) => {
      const physical = dp.screen2Physical(logical2Screen(coord));
      return new DisplayPosition(
        dp.offset.sub(physical).add(this.mapService.getWindowSize().div(2)),
        dp.zoomLevel,
      );
    });
    this.jumpIndex = (this.jumpIndex + 1) % edges.length;
  }

  private calculateJumpList(): Coordinate[] {
    if (this.jumpList !== null) {
      return this.jumpList;
    }

    this.jumpList = [];
    this.jumpIndex = 0;

    type Accumulator = {
      diff: number;
      index: number;
    };

    let coord = this.mapService
      .displayPosition()
      .physical2Screen(this.mapService.getWindowSize().div(2));
    while (this.edgesToSort.length !== 0) {
      const { index } = this.edgesToSort.reduce(
        (acc: Accumulator | null, curr: Coordinate, index: number) => {
          const diff = coord.sub(logical2Screen(curr));
          const absdiff = Math.abs(diff.x) + Math.abs(diff.y);
          if (acc === null || absdiff < acc.diff) {
            return { diff: absdiff, index };
          } else {
            return acc;
          }
        },
        null,
      )!;

      const [best] = this.edgesToSort.splice(index, 1);
      this.jumpList.push(best);
      coord = best;
    }

    return this.jumpList;
  }
}
