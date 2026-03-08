/**
 * Camera GPS coordinates for map display.
 * 
 * These are mock positions laid out along streets near a central point.
 * In production, coordinates come from camera registration (backend DB).
 * 
 * Center: 21.0285° N, 105.8542° E (Hanoi, Hoàn Kiếm area)
 * Cameras are spread across intersections along a ~1km radius.
 */

// Map center and default zoom
export const MAP_CENTER = [21.0285, 105.8542];
export const MAP_ZOOM = 16;

// Camera position lookup: camera_id → { lat, lng, address }
export const cameraPositions = {
  cam_001: { lat: 21.0292, lng: 105.8530, address: 'Ngã tư Tràng Tiền - Hàng Bài' },
  cam_002: { lat: 21.0278, lng: 105.8555, address: 'Ngã tư Đinh Tiên Hoàng - Tràng Thi' },
  cam_003: { lat: 21.0301, lng: 105.8518, address: 'Phố Hàng Khay - Tràng Tiền' },
  cam_004: { lat: 21.0268, lng: 105.8538, address: 'Phố Bà Triệu - Trần Hưng Đạo' },
  cam_005: { lat: 21.0295, lng: 105.8562, address: 'Phố Lý Thái Tổ - Bờ Hồ' },
  cam_006: { lat: 21.0310, lng: 105.8545, address: 'Phố Hàng Đào - Đồng Xuân' },
  cam_007: { lat: 21.0258, lng: 105.8525, address: 'Ngã tư Hai Bà Trưng - Lý Thường Kiệt' },
  cam_008: { lat: 21.0272, lng: 105.8510, address: 'Phố Quang Trung - Trần Hưng Đạo' },
  cam_009: { lat: 21.0315, lng: 105.8560, address: 'Phố Hàng Ngang - Hàng Đào' },
  cam_010: { lat: 21.0245, lng: 105.8548, address: 'Phố Bà Triệu - Nguyễn Du' },
  cam_011: { lat: 21.0288, lng: 105.8575, address: 'Phố Lê Thái Tổ - Hàng Trống' },
  cam_012: { lat: 21.0320, lng: 105.8530, address: 'Phố Hàng Bông - Hàng Gai' },
  cam_013: { lat: 21.0252, lng: 105.8565, address: 'Phố Hai Bà Trưng - Bạch Đằng' },
  cam_014: { lat: 21.0305, lng: 105.8500, address: 'Phố Phùng Hưng - Hàng Cót' },
  cam_015: { lat: 21.0240, lng: 105.8520, address: 'Ngã tư Kim Mã - Nguyễn Thái Học' },
};

/**
 * Get position for a camera, with fallback.
 * Works with both mock cameras (cam_001) and API cameras (path_name/id).
 */
export function getCameraPosition(camera) {
  const key = camera.path_name || camera.id;
  return cameraPositions[key] || null;
}

/**
 * Get all cameras with valid positions for map display.
 */
export function getCamerasWithPositions(cameras) {
  return cameras
    .map(cam => {
      const pos = getCameraPosition(cam);
      if (!pos) return null;
      return { ...cam, ...pos };
    })
    .filter(Boolean);
}
