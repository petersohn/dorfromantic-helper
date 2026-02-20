import { Injectable, signal } from '@angular/core';
import { LogicalCoordinate } from './mapTypes';

@Injectable()
export class DebugService {
  public readonly showDebug = signal(false);
  public readonly summaryTrace = signal<LogicalCoordinate[]>([]);
  public readonly summaryTraceIndex = signal(0);
}
