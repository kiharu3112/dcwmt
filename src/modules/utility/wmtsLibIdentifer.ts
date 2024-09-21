const wmtsLibTypes = ['3d Sphere', 'Projections'] as const;
export type WMTSLibType = typeof wmtsLibTypes[number];

export class WmtsLibIdentifer {
  constructor(private readonly libtype: WMTSLibType) {}

  whichLib = <U, V>(sphere: U, projection: V): U | V => {
    switch (this.libtype) {
      case '3d Sphere':
        return sphere;
      case 'Projections':
        return projection;
    }
  };
}
