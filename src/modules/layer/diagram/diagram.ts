export abstract class Diagram {
  protected minmax: [number, number];
  public colorIndex?: number;
  public thresholdInterval?: number;
  public vectorInterval?: { x: number; y: number };

  constructor(minmax?: [number, number]) {
    if (!minmax || (minmax[0] === 0 && minmax[1] === 0)) {
      this.minmax = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
    } else {
      this.minmax = minmax;
    }
  }

  /**
   * Fetch Numerical Data Tile from specificated urls.
   *
   * @param urls - An Array of url to localtion stored Numerical Data Tile.
   * @param canvas - A canvases to drawing Numerical Data Tile.
   *
   * @returns A canvases to drawing Numerical Data Tile(same tile of param canvas).
   */
  private async fetchImages(
    urls: string[],
    size: { width: number; height: number }
  ): Promise<HTMLCanvasElement[]> {
    console.log('fetch Image');
    const canvases = new Array<HTMLCanvasElement>(urls.length);
    const promises = new Array<Promise<HTMLCanvasElement>>();

    for (let i = 0; i < urls.length; i++) {
      canvases[i] = document.createElement('canvas');
      canvases[i].width = size.width;
      canvases[i].height = size.height;
      const context = canvases[i].getContext('2d');
      if (!context) {
        throw new Error('Failed to get 2d context from canvas.');
      }

      const promise = new Promise<HTMLCanvasElement>((resolve, reject) => {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.width = size.width;
          img.height = size.height;
          img.onload = () => {
            context.drawImage(img, 0, 0);
            resolve(canvases[i]);
          };
          console.log('url is ', urls[i]);
          img.src = `${urls[i]}`;
          // img.src = `https://dcw.kijiharu3112.workers.dev?path=${urls[i]}`;
        } catch (err) {
          reject(err);
        }
      });

      promises.push(promise);
    }

    return await Promise.all(promises);
  }

  /**
   * Get an array of Numerical Data from canvases drawn Numerical Data Tile.
   *
   * @param canvas - A canvas to drawing final data.
   *
   * @returns an array of Numerical Data.
   */
  private getNumData(canvas: HTMLCanvasElement): number[] {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2d context from canvas.');
    }

    const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const dataView = new DataView(new ArrayBuffer(32));
    const datas = new Array<number>();
    const isCalcMinMax = !Number.isFinite(this.minmax[0]);

    // Normal Diagramの時だけ別の処理をする
    if (
      this.colorIndex === undefined &&
      this.thresholdInterval === undefined &&
      this.vectorInterval === undefined
    ) {
      console.log("Normal Diagram source")
      for (let i = 0; i < canvas.width * canvas.height; i++) {
        const bias_index = i * 4;
        const red = rgba[bias_index];
        const green = rgba[bias_index + 1];
        const blue = rgba[bias_index + 2];
        const alpha = rgba[bias_index + 3];
        datas.push(red); // Just push the raw pixel values
        datas.push(green);
        datas.push(blue);
        datas.push(alpha);
      }
      return datas;
    }

    for (let i = 0; i < canvas.width * canvas.height; i++) {
      // Get RGB value of each pixel from Numerical Data Tile
      const bias_index = i * 4;
      const red = rgba[bias_index] << 24;
      const green = rgba[bias_index + 1] << 16;
      const blue = rgba[bias_index + 2] << 8;
      dataView.setUint32(0, red + green + blue);
      const data = dataView.getFloat32(0);

      // Calculate minmax, if this.range is not specified.
      if (isCalcMinMax) {
        if (data < this.minmax[0]) {
          this.minmax[0] = data;
        }
        if (data > this.minmax[1]) {
          this.minmax[1] = data;
        }
      }

      datas.push(data);
    }

    return datas;
  }

  /**
   *
   * Draw specific diagram to the canvas passed the second parameter based on datas that the first parameter,
   *
   * @param datas - an array of Numerical Data to drawing specific diagram. specifical diagram is drawn based on this data.
   * @param canvas - a HTML Canvas Element to drawing specifical diagram.
   *
   * @returns A HTML Canvas Element drawn specifical diagram
   * */
  protected abstract drawVisualizedDiagramBasedONNumData(
    datas: number[][],
    canvas: HTMLCanvasElement
  ): HTMLCanvasElement;

  public async draw(
    urls: string[],
    canvas: HTMLCanvasElement
  ): Promise<HTMLCanvasElement> {
    const size = { width: canvas.width, height: canvas.height };
    const imgs = await this.fetchImages(urls, size);

    const datas = imgs.map((img) => this.getNumData(img));

    const visualizedDiagram = this.drawVisualizedDiagramBasedONNumData(
      datas,
      canvas
    );

    return visualizedDiagram;
  }

  public CanvasToArray(canvas: HTMLCanvasElement): number[] {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2d context from canvas.');
    }

    const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const dataView = new DataView(new ArrayBuffer(32));
    const datas = new Array<number>();

    for (let i = 0; i < canvas.width * canvas.height; i++) {
      // Get RGB value of each pixel from Numerical Data Tile
      const bias_index = i * 4;
      const red = rgba[bias_index] << 24;
      const green = rgba[bias_index + 1] << 16;
      const blue = rgba[bias_index + 2] << 8;
      dataView.setUint32(0, red + green + blue);
      const data = dataView.getFloat32(0);
      datas.push(data);
    }

    return datas;
  }

  public calcMinMax = async (
    urls: string[],
    canvas: HTMLCanvasElement
  ): Promise<[number, number]> => {
    if (Number.isFinite(this.minmax[0])) {
      return new Promise((resolve) => resolve(this.minmax));
    }
    const size = { width: canvas.width, height: canvas.height };
    const imgs = await this.fetchImages(urls, size);

    imgs.map((img) => this.getNumData(img));
    return new Promise((resolve) => resolve(this.minmax));
  };

  public abstract whichDiagram<T, U, V, N>(
    tone: T,
    contour: U,
    vector: V,
    normal: N
  ): T | U | V | N;
}
