import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  viewChild,
} from '@angular/core';
import { drawEdge } from './drawHelper';
import { Coordinate, Edge } from './mapTypes';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'summary-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-item.component.html',
  styleUrl: './summary-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryItemComponent {
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  public edgeCount = input.required<number>();
  public count = input.required<number>();
  public markCount = input.required<number>();

  constructor() {
    effect(() => this.render());
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
}
