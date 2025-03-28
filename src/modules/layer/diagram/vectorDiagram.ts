import { Diagram } from "./diagram";

export class VectorDiagram extends Diagram {
  public vectorInterval: { x: number; y: number };
  constructor(
    vectorInterval: { x: number; y: number },
    private readonly mathMethod: (x: number) => number,
  ) {
    super(undefined);
    this.vectorInterval = vectorInterval;
  }

  protected drawVisualizedDiagramBasedONNumData = (datas: number[][], canvas: HTMLCanvasElement): HTMLCanvasElement => {
    //datas = datas.map((data) => data.map(this.mathMethod));
    this.mathMethod(1);

    const Direction = {
      Horizontal: 0,
      Vertical: 1,
    } as const;

    const canvasSize = { width: canvas.width, height: canvas.height };

    const blockSizeToDrawingOneVector = this.BlockSizeToDrawingOneVector(canvasSize, this.vectorInterval);

    const arraysCalculatedToMeanPerBlock = new Array<Array<number>>(2);
    // Calculate mean of horizontal direction tile per blocks.
    arraysCalculatedToMeanPerBlock[Direction.Horizontal] = this.ArrayCalculatedToMeanPerBlock(
      datas[Direction.Horizontal],
      canvasSize,
      blockSizeToDrawingOneVector,
      this.vectorInterval.x * this.vectorInterval.y,
    );
    // Calculate mean of vertical direction tile per blocks.
    arraysCalculatedToMeanPerBlock[Direction.Vertical] = this.ArrayCalculatedToMeanPerBlock(
      datas[Direction.Vertical],
      canvasSize,
      blockSizeToDrawingOneVector,
      this.vectorInterval.x * this.vectorInterval.y,
    );

    // Get max value to normalize.
    const max = arraysCalculatedToMeanPerBlock.map((meanedData) => Math.max(...meanedData.map(Math.abs)));

    // Normarize from -1 to 1.
    const arraysOfNormalizedMeanBlock = arraysCalculatedToMeanPerBlock.map((meanedData, direction) =>
      meanedData.map((data) => data / max[direction]),
    );

    // rendering vector
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get 2d context from canvas.");
    }
    for (let y = 0; y < this.vectorInterval.y; y++) {
      for (let x = 0; x < this.vectorInterval.x; x++) {
        context.beginPath();
        const halfOfBlockSize = {
          x: blockSizeToDrawingOneVector.x / 2,
          y: blockSizeToDrawingOneVector.y / 2,
        };

        const arrow = {
          length: 3,
          bold: 1,
          width: 3,
        };

        const startPointOfVector = {
          x: x * blockSizeToDrawingOneVector.x + halfOfBlockSize.x,
          y: y * blockSizeToDrawingOneVector.y + halfOfBlockSize.y,
        };
        const endPointOfVector = {
          x:
            startPointOfVector.x +
            arraysOfNormalizedMeanBlock[Direction.Horizontal][x + y * this.vectorInterval.x] * halfOfBlockSize.x,
          y:
            startPointOfVector.y +
            arraysOfNormalizedMeanBlock[Direction.Vertical][x + y * this.vectorInterval.x] * halfOfBlockSize.y,
        };
        const controlPointOfVector = [0, arrow.bold, -arrow.length, arrow.bold, -arrow.length, arrow.width];

        // @ts-ignore
        context.arrow(
          startPointOfVector.x,
          startPointOfVector.y,
          endPointOfVector.x,
          endPointOfVector.y,
          controlPointOfVector,
        );
        context.fill();
      }
    }

    return canvas;
  };

  private BlockSizeToDrawingOneVector = (
    canvasSize: { width: number; height: number },
    numOfVectorInCanvas: { x: number; y: number },
  ) => {
    return {
      x: canvasSize.width / numOfVectorInCanvas.x,
      y: canvasSize.height / numOfVectorInCanvas.y,
    };
  };

  private ArrayCalculatedToMeanPerBlock = (
    data: number[],
    canvasSize: { width: number; height: number },
    blockSizeToDrawingOneVector: { x: number; y: number },
    totalNumOfBlocksInCanvas: number,
  ) => {
    return new Array<number>(totalNumOfBlocksInCanvas).fill(0).map((_, i) => {
      // Slice Array to get needed section,
      // (Too Complication)
      let applicable_array = new Array<number>();
      const startPoint = {
        x: ((i * blockSizeToDrawingOneVector.x) % canvasSize.width) / blockSizeToDrawingOneVector.x,
        y: Math.floor((i * blockSizeToDrawingOneVector.x) / canvasSize.width),
      };
      for (let y = 0; y < blockSizeToDrawingOneVector.y; y++) {
        const slice = {
          start:
            startPoint.x * blockSizeToDrawingOneVector.x +
            (startPoint.y * blockSizeToDrawingOneVector.y + y) * canvasSize.width,
          end:
            (startPoint.x + 1) * blockSizeToDrawingOneVector.x +
            (startPoint.y * blockSizeToDrawingOneVector.y + y) * canvasSize.width,
        };
        const xSlicedArray = data.slice(slice.start, slice.end);
        applicable_array = applicable_array.concat(xSlicedArray);
      }

      // Calculate mean of sliced array.
      const mean = applicable_array.reduce((accumulator, current, _, { length }) => accumulator + current / length);
      return mean;
    });
  };

  public whichDiagram<T, U, V, N>(vector: V): T | U | V | N {
    return vector;
  }
}
