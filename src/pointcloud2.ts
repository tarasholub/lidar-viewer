export interface PointField {
  name: string;
  offset: number,
  datatype: number,
  count: number,
}

export const PointFieldDatatype = {
  INT8: 1,
  UINT8: 2,
  INT16: 3,
  UINT16: 4,
  INT32: 5,
  UINT32: 6,
  FLOAT32: 7,
  FLOAT64: 8,
} as const;

export interface PointCloud2Msg {
  height: number,
  width: number,
  fields: PointField[],
  is_bigendian: boolean,
  is_dense: boolean,
  point_step: number,
  row_step: number,
  data: Uint8Array
}

export function parsePointCloud2(msg: PointCloud2Msg): Float32Array {
  const xField = msg.fields.find((f) => f.name === "x");
  if (!xField || xField.datatype !== PointFieldDatatype.FLOAT32) {
    throw new Error('PointCloud2: missing or non-float32 field "x"')
  }
  const yField = msg.fields.find((f) => f.name === "y");
  if (!yField || yField.datatype !== PointFieldDatatype.FLOAT32) {
    throw new Error('PointCloud2: missing or non-float32 field "y"')
  }
  const zField = msg.fields.find((f) => f.name === "z");
  if (!zField || zField.datatype !== PointFieldDatatype.FLOAT32) {
    throw new Error('PointCloud2: missing or non-float32 field "z"')
  }

  const N = msg.width * msg.height;
  const view = new DataView(msg.data.buffer, msg.data.byteOffset, msg.data.byteLength);
  const littleEndian = !msg.is_bigendian;
  const out = new Float32Array(N * 3);

  for (let k = 0; k < N; k++) {
    const base = k * msg.point_step;
    out[k * 3] = view.getFloat32(base + xField.offset, littleEndian);
    out[k * 3 + 1] = view.getFloat32(base + yField.offset, littleEndian);
    out[k * 3 + 2] = view.getFloat32(base + zField.offset, littleEndian);
  }

  return out;
}