import {type PointCloud2Msg, type PointField, PointFieldDatatype} from './pointcloud2';

// Simulates a robot-side ROS driver: packs raw positions into a
// sensor_msgs/PointCloud2-shaped binary message.

const POINT_STEP = 16; // x(4) + y(4) + z(4) + intensity(4) bytes

export function encodePointCloud2(positions: Float32Array): PointCloud2Msg {
  const N = positions.length / 3;
  const buffer = new ArrayBuffer(N * POINT_STEP);
  const view = new DataView(buffer);

  for (let k = 0; k < N; k++) {
    const base = k * POINT_STEP;
    view.setFloat32(base, positions[k * 3], true);
    view.setFloat32(base + 4, positions[k * 3 + 1], true);
    view.setFloat32(base + 8, positions[k * 3 + 2], true);
    view.setFloat32(base + 12, 1.0, true);
  }

  const fields: PointField[] = [
    { name: "x", offset: 0, datatype: PointFieldDatatype.FLOAT32, count: 1},
    { name: "y", offset: 4, datatype: PointFieldDatatype.FLOAT32, count: 1},
    { name: "z", offset: 8, datatype: PointFieldDatatype.FLOAT32, count: 1},
    { name: "intensity", offset: 12, datatype: PointFieldDatatype.FLOAT32, count: 1},
  ];

  return {
    height: 1,
    width: N,
    fields,
    is_bigendian: false,
    point_step: POINT_STEP,
    row_step: POINT_STEP * N,
    data: new Uint8Array(buffer),
    is_dense: true
  }
}
