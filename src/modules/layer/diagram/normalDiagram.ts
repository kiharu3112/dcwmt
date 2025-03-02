import { Diagram } from './diagram';

export class NormalDiagram extends Diagram {
  protected drawVisualizedDiagramBasedONNumData = (
    datas: number[][],
    canvas: HTMLCanvasElement
  ): HTMLCanvasElement => {
    if (datas.length === 0) {
      return canvas;
    }
    const imageData = new ImageData(canvas.width, canvas.height);

    for (let i = 0; i < canvas.height * canvas.width; i++) {
      const bias_index = i * 4;
      const data = datas[0];

      imageData.data[bias_index + 0] = data[bias_index + 0];
      imageData.data[bias_index + 1] = data[bias_index + 1];
      imageData.data[bias_index + 2] = data[bias_index + 2];
      imageData.data[bias_index + 3] = data[bias_index + 3];
    }

    console.log('imageData', imageData.data[0]);
    const context = canvas.getContext('2d');

    if (!context) return canvas;
    console.log('[0,0].r: ', imageData.data[0]);
    console.log('[0,0].g: ', imageData.data[1]);
    console.log('[0,0].b: ', imageData.data[2]);
    context.putImageData(imageData, 0, 0);
    console.log('normal diagram canvas ok');
    return canvas;
  };

  public whichDiagram<T, U, V, N>(normal: N): T | U | V | N {
    return normal;
  }
}
