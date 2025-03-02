import type { ProjCodes } from './components/DrawerContents/Drawer-figure/projection_lib';

const types = ['tone', 'vector', 'contour', 'normal'] as const;
export type DiagramTypes = typeof types[number];

export type Variable = {
  name: [string, string];
  type: DiagramTypes;
  tileSize: { x: number; y: number };
  minZoom: number;
  maxZoom: number;
  axis: [number, number];
  fixed: Array<string>;
  extent: [number, number, number, number];
};

type Layer = {
  name: string;
  show: boolean;
  opacity: number;
  varindex: number;
  fixedindex: number;
  minmax: [number, number] | undefined;
  id?: string;
};

type LayerTone = Layer & {
  type: 'tone';
  clrindex: number;
};

type LayerVector = Layer & {
  type: 'vector';
  vecinterval: {
    x: number;
    y: number;
  };
};

type LayerContour = Layer & {
  type: 'contour';
  thretholdinterval: number;
};

type LayerNormal = Layer & {
  type: 'normal';
};

export type LayerTypes = LayerTone | LayerVector | LayerContour | LayerNormal;

export type DefinedOptions = Readonly<{
  root: string;
  variables: Array<Variable>;
}>;

export type DrawingOptions = {
  title: string;
  sumneil: string;
  zoom: number;
  center: [number, number];
  projCode: ProjCodes;
  mathMethods: number;
  layers: Array<LayerTypes>;
  id?: string;
};
