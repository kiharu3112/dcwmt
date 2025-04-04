import { type Clrmap, ColorMap } from "../../utility/colormap/colormap";
import { Diagram } from "./diagram";

export class ToneDiagram extends Diagram {
  public colorIndex: number;
  private colormap: Clrmap[];
  private readonly mathMethod: (x: number) => number;

  constructor(colorIndex: number, mathMethod: (x: number) => number, minmax?: [number, number]) {
    super(minmax);

    this.colorIndex = colorIndex;
    this.colormap = new ColorMap(colorIndex).getClrmap();
    this.mathMethod = mathMethod;
  }

  public changeColorMap(colorIndex: number) {
    this.colorIndex = colorIndex;
    this.colormap = new ColorMap(colorIndex).getClrmap();
  }

  protected drawVisualizedDiagramBasedONNumData = (datas: number[][], canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const imageData = new ImageData(canvas.width, canvas.height);

    for (let i = 0; i < canvas.height * canvas.width; i++) {
      const bias_index = i * 4;
      const data = this.mathMethod(datas[0][i]);
      const clrmap = this.getClrMap(data);
      imageData.data[bias_index + 0] = clrmap.r;
      imageData.data[bias_index + 1] = clrmap.g;
      imageData.data[bias_index + 2] = clrmap.b;
      imageData.data[bias_index + 3] = 255;
    }

    const context = canvas.getContext("2d");
    if (!context) return canvas;
    context.putImageData(imageData, 0, 0);

    return canvas;
  };

  private getClrMap = (data: number): Clrmap => {
    const colormap_per_scalardata = this.colormap.length / (this.minmax[1] - this.minmax[0]);
    const colormap_index = Math.round(colormap_per_scalardata * (data - this.minmax[0]));

    // 読み込み失敗時は白を返す
    if (data === 0.0) {
      return { r: 255, g: 255, b: 255 };
    }
    if (this.colormap.length <= colormap_index) {
      return this.colormap[this.colormap.length - 1];
    }
    if (0 > colormap_index) {
      return this.colormap[0];
    }
    return this.colormap[colormap_index]; // それ以外は対応する色を返す
  };

  public whichDiagram<T, U, V, N>(tone: T): T | U | V | N {
    return tone;
  }
}
