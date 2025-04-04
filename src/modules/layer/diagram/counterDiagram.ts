import * as contour from 'd3-contour';
import { geoIdentity, geoPath } from 'd3-geo';
import { Diagram } from './diagram';

export class ContourDiagram extends Diagram {
  public thresholdInterval: number;
  protected readonly mathMethod: (x: number) => number;

  constructor(
    thresholdInterval: number,
    mathMethod: (x: number) => number,
    minmax: [number, number] | undefined
  ) {
    super(minmax);

    this.thresholdInterval = thresholdInterval;
    this.mathMethod = mathMethod;
  }

  protected drawVisualizedDiagramBasedONNumData = (
    data: number[][],
    canvas: HTMLCanvasElement
  ): HTMLCanvasElement => {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2d context from canvas.');
    }

    const processedData = data[0].map(this.mathMethod);

    const projection = geoIdentity().scale(1);
    const path = geoPath(projection, context);

    const thresholds = new Array<number>(this.thresholdInterval)
      .fill(0)
      .map(
        (_, i) =>
          this.minmax[0] +
          ((this.minmax[1] - this.minmax[0]) / this.thresholdInterval) * i
      );

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.lineWidth = 1.5;

    for (const threshold of thresholds) {
      context.beginPath();
      const contours = contour.contours().size([canvas.width, canvas.height]);
      const object = contours.contour(processedData, threshold);
      path(object);
      context.stroke();
      context.closePath();
    }

    return canvas;
  };

  public whichDiagram<T, U, V, N>(contour: U): T | U | V | N {
    return contour;
  }
}
